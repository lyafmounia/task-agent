import os

os.environ["MONGODB_DB"] = "task_agent_test"

import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from main import app


@pytest.fixture
def client():
    MongoClient("mongodb://localhost:27017").drop_database("task_agent_test")
    with TestClient(app, headers={"X-Api-Key": "cle-de-developpement"}) as c:
        yield c

@pytest.fixture
def jeton_pour(client):
    """Fournit une fonction qui crée un compte et renvoie son jeton.
    Une fixture peut renvoyer une FONCTION : chaque test l'appelle
    autant de fois qu'il a besoin d'utilisateurs."""

    def creer_et_connecter(email, mot_de_passe="motdepasse123"):
        client.post(
            "/auth/inscription", json={"email": email, "mot_de_passe": mot_de_passe}
        )
        reponse = client.post(
            "/auth/connexion", data={"username": email, "password": mot_de_passe}
        )
        return reponse.json()["access_token"]

    return creer_et_connecter

@pytest.fixture
def client_connecte(client, jeton_pour):
    """Un client de test déjà connecté : son jeton est envoyé à chaque requête.
    Une fixture peut en utiliser d'autres, comme ici client et jeton_pour."""
    jeton = jeton_pour("mounia@exemple.fr")
    client.headers["Authorization"] = f"Bearer {jeton}"
    return client