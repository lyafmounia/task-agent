from contextlib import asynccontextmanager

from beanie import Document, PydanticObjectId, init_beanie
from fastapi import Depends, FastAPI, HTTPException, Security
from pydantic import BaseModel, Field
from pymongo import AsyncMongoClient
import os
import secrets
from fastapi.security import APIKeyHeader

from pymongo import ASCENDING, DESCENDING, IndexModel


# ---------- Modèles ----------

class TacheCreation(BaseModel):
    title:str = Field(min_length=1)
    description: str | None = None
    priorite: int = Field(default=1, ge=1, le=3)
    etiquettes : list[str] = []

class Tache(Document, TacheCreation):
    terminee: bool = False
    class Settings:
        name = "taches"
        indexes = [
            IndexModel([("terminee", ASCENDING), ("priorite", DESCENDING)]),
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
    await init_beanie(database=client[MONGODB_DB], document_models=[Tache])
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

@app.get("/")
async def accueil():
    return {"message": "Bienvenue sur Task Agent"}


@app.post("/taches", status_code=201)
async def creer_tache(donnees: TacheCreation) -> Tache:
    tache = Tache(**donnees.model_dump())
    await tache.insert()
    return tache

@app.get("/taches")
async def lister_taches(
    terminee: bool | None = None
) -> list[Tache]:
    if terminee is not None:
        return await Tache.find(Tache.terminee == terminee).to_list()
    return await Tache.find_all().to_list()

@app.get("/taches/statistiques")
async def statistiques():
    pipeline = [
        {"$group": {"_id": "$priorite", "nombre": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$project": {"_id": 0, "priorite": "$_id", "nombre": 1}},
    ]
    return await Tache.aggregate(pipeline).to_list()


@app.get("/taches/statistiques/etiquettes")
async def statistiques():
    pipeline = [
        {"$unwind": "$etiquette"},
        {"$group": {"_id": "$etiquette", "nombre": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
        {"$project": {"_id": 0, "etiquette": "$_id", "nombre": 1}},
    ]
    return await Tache.aggregate(pipeline).to_list()


@app.get("/taches/{tache_id}")
async def lire_tache(tache_id: PydanticObjectId) -> Tache:
    tache = await Tache.get(tache_id)
    if tache is None:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    return tache



@app.patch("/taches/{tache_id}/terminer")
async def modifier_tache(tache_id: PydanticObjectId) -> Tache:
    tache = await Tache.get(tache_id)
    if tache is None:
        raise HTTPException(status_code=404, detail="Tache introuvable")
    tache.terminee = True
    await tache.save()
    return tache


@app.delete("/taches/{tache_id}", status_code=204)
async def supprimer_tache(tache_id: PydanticObjectId):
    tache = await Tache.get(tache_id)
    if tache is None:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    await tache.delete()

