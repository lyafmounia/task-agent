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