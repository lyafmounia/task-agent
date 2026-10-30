from contextlib import asynccontextmanager

from beanie import Document, PydanticObjectId, init_beanie
from fastapi import Depends, FastAPI, HTTPException, Security, Request
from pydantic import BaseModel, Field
from pymongo import AsyncMongoClient
import os
import secrets
from fastapi.security import APIKeyHeader
from auth import Utilisateur, routeur as routeur_auth,  utilisateur_connecte, limiteur

from pymongo import ASCENDING, DESCENDING, IndexModel
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

# ---------- Modèles ----------

class TacheCreation(BaseModel):
    title:str = Field(min_length=1)
    description: str | None = None
    priorite: int = Field(default=1, ge=1, le=3)
    etiquettes : list[str] = []

class Tache(Document, TacheCreation):
    terminee: bool = False
    utilisateur_id: PydanticObjectId
    class Settings:
        name = "taches"
        indexes = [
            IndexModel([
                ("utilisateur_id", ASCENDING),
                ("terminee", ASCENDING),
                ("priorite", DESCENDING)]),
        ]


# ---------- Connexion à MongoDB ----------

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "task_agent")

# Clé partagée entre le frontend et l'API.
# La valeur par défaut ne sert QU'EN DÉVELOPPEMENT : en production, la vraie
# clé est fournie par la variable d'environnement API_KEY (fichier .env).
API_KEY = os.getenv("API_KEY", "cle-de-developpement")

# Environnement : "development" par défaut, "production" dans Compose.
APP_ENV = os.getenv("APP_ENV", "development")

# auto_error=False : on gère nous-mêmes l'erreur, pour renvoyer un message clair.
en_tete_cle = APIKeyHeader(name="X-Api-Key", auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncMongoClient(MONGODB_URL)
    await init_beanie(
        database=client[MONGODB_DB],
        document_models=[Tache, Utilisateur],
    )
    yield
    await client.close()


async def verifier_cle(cle: str | None = Security(en_tete_cle)):
    """Dépendance : refuse la requête si la clé est absente ou incorrecte."""
    if cle is None or not secrets.compare_digest(cle, API_KEY):
        raise HTTPException(status_code=401, detail="Clé d'API invalide")

# ---------- Application ----------

# En production, on désactive les pages de documentation.
EN_PRODUCTION = APP_ENV == "production"

app = FastAPI(
    title="Task Agent",
    lifespan=lifespan,
    dependencies=[Depends(verifier_cle)],
    docs_url=None if EN_PRODUCTION else "/docs",
    redoc_url=None if EN_PRODUCTION else "/redoc",
    openapi_url=None if EN_PRODUCTION else "/openapi.json",
)

# SlowAPI retrouve le limiteur dans l'état de l'application
app.state.limiter = limiteur

# Quand une limite est dépassée, SlowAPI lève RateLimitExceeded
# On la transforme en réponse 429, avec un champ "detail"
# erreurs de l'API : fetchApi saura ainsi afficher le message
@app.exception_handler(RateLimitExceeded)
async def trop_de_requetes(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Trop de tentatives. Réessayez dans une minute."},
    )

# Ajouter les routes /auth/... à l'application
# La dépendance globale verifier_cle s'applique aussi à elles
app.include_router(routeur_auth)


async def tache_de(tache_id: PydanticObjectId, utilisateur: Utilisateur) -> Tache:
    """Renvoie la tâche si elle appartient à l'utilisateur, sinon lève une 404."""
    tache = await Tache.find_one(
        Tache.id == tache_id,
        Tache.utilisateur_id == utilisateur.id,
    )
    if tache is None:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return tache


@app.get("/")
async def accueil():
    return {"message": "Bienvenue sur Task Agent"}


@app.post("/taches", status_code=201)
async def creer_tache(
    donnees: TacheCreation,
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
) -> Tache:
    tache = Tache(**donnees.model_dump(), utilisateur_id=utilisateur.id)
    await tache.insert()
    return tache

@app.get("/taches")
async def lister_taches(
    terminee: bool | None = None,
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
) -> list[Tache]:
    # La condition sur le propriétaire est TOUJOURS présente.
    requete = Tache.find(Tache.utilisateur_id == utilisateur.id)
    if terminee is not None:
        requete = requete.find(Tache.terminee == terminee)
    return await requete.to_list()

@app.get("/taches/statistiques")
async def statistiques():
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
    pipeline = [
        {"$match": {"utilisateur_id": utilisateur.id}},
        {"$group": {"_id": "$priorite", "nombre": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$project": {"_id": 0, "priorite": "$_id", "nombre": 1}},
    ]
    return await Tache.aggregate(pipeline).to_list()


@app.get("/taches/statistiques/etiquettes")
async def statistiques():
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
    pipeline = [
        {"$match": {"utilisateur_id": utilisateur.id}},
        {"$unwind": "$etiquette"},
        {"$group": {"_id": "$etiquette", "nombre": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
        {"$project": {"_id": 0, "etiquette": "$_id", "nombre": 1}},
    ]
    return await Tache.aggregate(pipeline).to_list()


@app.get("/taches/{tache_id}")
async def lire_tache(
    tache_id: PydanticObjectId,
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
) -> Tache:
    return await tache_de(tache_id, utilisateur)


@app.patch("/taches/{tache_id}/terminer")
async def modifier_tache(
    tache_id: PydanticObjectId,
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
) -> Tache:
    tache = await tache_de(tache_id, utilisateur)
    tache.terminee = True
    await tache.save()
    return tache


@app.delete("/taches/{tache_id}", status_code=204)
async def supprimer_tache(
    tache_id: PydanticObjectId,
    utilisateur: Utilisateur = Depends(utilisateur_connecte),
):
    tache = await tache_de(tache_id, utilisateur)
    await tache.delete()

