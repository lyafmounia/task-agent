"""Authentification : comptes utilisateurs, mots de passe et jetons JWT."""
import os
from datetime import datetime, timedelta, timezone

import jwt
from beanie import Document, Indexed, PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr, Field
from fastapi import Request
from slowapi import Limiter

# Clé secrète qui signe les jetons. Valeur par défaut : développement uniquement
JWT_SECRET = os.getenv("JWT_SECRET", "secret-de-developpement")
# HS256 : signature avec une clé secrète partagée (la même pour signer et vérifier)
JWT_ALGORITHME = "HS256"
DUREE_JETON = timedelta(minutes=30)

hachage = PasswordHash.recommended()

# Une empreinte "factice", utilisée quand l'e-mail n'existe pas 
EMPREINTE_FACTICE = hachage.hash("mot-de-passe-factice")

# Lit le jeton dans l'en-tête "Authorization: Bearer <jeton>"
# tokenUrl : l'adresse de connexion, utilisée par le bouton Authorize de /docs
schema_oauth2 = OAuth2PasswordBearer(tokenUrl="auth/connexion")


# ---------- Modèles ----------

class Utilisateur(Document):
    email: Indexed(EmailStr, unique=True)
    mot_de_passe_hache: str

    class Settings:
        name = "utilisateurs"
        
class Inscription(BaseModel):
    """Ce que l'utilisateur envoie pour créer un compte."""
    # EmailStr : Pydantic vérifie que c'est une adresse e-mail valide.
    email: EmailStr
    mot_de_passe: str = Field(min_length=8)

class UtilisateurPublic(BaseModel):
    """Ce que l'API renvoie : SANS le mot de passe ni son empreinte."""
    id: str
    email: EmailStr

class Jeton(BaseModel):
    """La réponse de la connexion, au format attendu par OAuth2."""
    access_token: str
    token_type: str = "bearer"

# ---------- Fonctions utilitaires ----------

def creer_jeton(utilisateur_id: str) -> str:
    """Crée un JWT signé, contenant l'identifiant de l'utilisateur."""
    contenu = {
        # "sub" (subject) : à qui appartient le jeton. Nom standard des JWT.
        "sub": utilisateur_id,
        # "exp" (expiration) : après cette date, le jeton est refusé.
        "exp": datetime.now(timezone.utc) + DUREE_JETON,
    }
    return jwt.encode(contenu, JWT_SECRET, algorithm=JWT_ALGORITHME)

def vers_public(utilisateur: Utilisateur) -> UtilisateurPublic:
    """Convertit un utilisateur en sa version publique, sans empreinte."""
    return UtilisateurPublic(id=str(utilisateur.id), email=utilisateur.email)

# ---------- Dépendance : l'utilisateur connecté ----------

async def utilisateur_connecte(
    jeton: str = Depends(schema_oauth2),
) -> Utilisateur:
    """Vérifie le jeton et renvoie l'utilisateur correspondant, ou 401."""
    erreur = HTTPException(
        status_code=401,
        detail="Jeton invalide ou expiré",
        # En-tête standard qui indique au client le type d'authentification attendu.
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # decode vérifie la SIGNATURE et l'EXPIRATION. Si l'une des deux
        # échoue (jeton modifié, falsifié ou périmé), il lève InvalidTokenError.
        contenu = jwt.decode(jeton, JWT_SECRET, algorithms=[JWT_ALGORITHME])
        utilisateur_id = PydanticObjectId(contenu["sub"])
    except (InvalidTokenError, KeyError, ValueError):
        # KeyError : pas de "sub" ; ValueError : "sub" n'est pas un ObjectId.
        raise erreur

    # Le jeton est valide, mais le compte existe-t-il toujours ?
    utilisateur = await Utilisateur.get(utilisateur_id)
    if utilisateur is None:
        raise erreur
    return utilisateur


# ---------- Configuration ----------

def adresse_visiteur(request: Request) -> str:
    """Renvoie l'adresse IP du VRAI visiteur, qui sert de clé au compteur.

    Le serveur Next.js transmet l'adresse du navigateur dans l'en-tête
    X-Forwarded-For. On peut lui faire confiance, car seul Next.js
    connaît la clé d'API exigée par toutes les routes.
    """
    transmise = request.headers.get("x-forwarded-for")
    if transmise:
        # L'en-tête peut contenir une liste d'adresses ("client, proxy1, ...") :
        # la première est celle du client d'origine.
        return transmise.split(",")[0].strip()
    # Pas d'en-tête : on utilise l'adresse de l'appelant direct.
    return request.client.host if request.client else "inconnue"


# Le limiteur : il compte les requêtes par adresse de visiteur.
# Les compteurs sont gardés EN MÉMOIRE : ils sont remis à zéro au redémarrage.
limiteur = Limiter(key_func=adresse_visiteur)

# ---------- Routes ----------

# Toutes les routes de ce routeur commencent par /auth, et sont regroupées
# sous l'étiquette "auth" dans /docs.
routeur = APIRouter(prefix="/auth", tags=["auth"])

@routeur.post("/inscription", status_code=201)
@limiteur.limit("3/minute") 
async def inscription(request: Request, donnees: Inscription) -> UtilisateurPublic:
    # On normalise l'e-mail en minuscules : "Mounia@X.fr" et "mounia@x.fr"
    # désignent la même personne.
    email = donnees.email.lower()

    if await Utilisateur.find_one(Utilisateur.email == email):
        # 409 Conflict : la ressource existe déjà.
        raise HTTPException(status_code=409, detail="Cet e-mail est déjà utilisé")

    utilisateur = Utilisateur(
        email=email,
        # On ne stocke QUE l'empreinte. Le mot de passe en clair n'est
        # jamais enregistré nulle part.
        mot_de_passe_hache=hachage.hash(donnees.mot_de_passe),
    )
    await utilisateur.insert()
    return vers_public(utilisateur)

@routeur.post("/connexion")
@limiteur.limit("5/minute") 
async def connexion(
    request: Request,
    # OAuth2PasswordRequestForm lit un FORMULAIRE (et non du JSON) avec les
    # champs "username" et "password" : c'est le format imposé par le
    # standard OAuth2. Ici, "username" contient l'e-mail.
    formulaire: OAuth2PasswordRequestForm = Depends(),
) -> Jeton:
    utilisateur = await Utilisateur.find_one(
        Utilisateur.email == formulaire.username.lower()
    )

    if utilisateur is None:
        # Protection contre les "attaques temporelles" : vérifier un mot de
        # passe avec Argon2 prend du temps. Si on répondait immédiatement
        # quand l'e-mail n'existe pas, un attaquant pourrait mesurer le temps
        # de réponse pour savoir quels e-mails ont un compte. On fait donc
        # une vérification factice, qui prend le même temps.
        hachage.verify(formulaire.password, EMPREINTE_FACTICE)
        raise HTTPException(status_code=401, detail="E-mail ou mot de passe incorrect")

    if not hachage.verify(formulaire.password, utilisateur.mot_de_passe_hache):
        raise HTTPException(status_code=401, detail="E-mail ou mot de passe incorrect")

    return Jeton(access_token=creer_jeton(str(utilisateur.id)))

@routeur.get("/moi")
async def moi(
    # Toute la vérification est faite par la dépendance : si on arrive ici,
    # l'utilisateur est forcément authentifié.
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
) -> UtilisateurPublic:
    return vers_public(utilisateur)