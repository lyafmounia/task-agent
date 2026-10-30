def test_accueil(client):
    reponse = client.get("/")
    assert reponse.status_code == 200
    assert reponse.json() == {"message": "Bienvenue sur Task Agent"}


def test_creer_tache(client):
    reponse = client.post("/taches", json={"title": "Écrire des tests", "priorite": 2})
    # breakpoint()
    assert reponse.status_code == 201
    donnees = reponse.json()
    assert donnees["title"] == "Écrire des tests"
    assert donnees["priorite"] == 2
    assert donnees["terminee"] is False
    assert "_id" in donnees


def test_creer_tache_sans_titre(client):
    reponse = client.post("/taches", json={"priorite": 2})
    assert reponse.status_code == 422


def test_lire_tache_inexistante(client):
    reponse = client.get("/taches/000000000000000000000000")
    assert reponse.status_code == 404

def test_terminer_tache(client):
    creation = client.post("/taches", json={"title": "À terminer"})
    tache_id = creation.json()['_id']

    reponse = client.patch(f"/taches/{tache_id}/terminer")

    assert reponse.status_code == 200, reponse.json()
    assert reponse.json()["terminee"] is True

def test_filtrer_taches_terminees(client):
    premiere = client.post("/taches", json={"title": "Tâche finie"})
    client.post("/taches", json={"title": "Tâche à faire"})
    client.patch(f"/taches/{premiere.json()['_id']}/terminer")

    reponse = client.get("/taches?terminee=true")

    assert reponse.status_code == 200
    taches = reponse.json()
    assert len(taches) == 1
    assert taches[0]["title"] == "Tâche finie"


def test_supprimer_tache(client):
    creation = client.post("/taches", json={"title": "À supprimer"})
    tache_id = creation.json()["_id"]

    reponse = client.delete(f"/taches/{tache_id}")
    assert reponse.status_code == 204

    lecture = client.get(f"/taches/{tache_id}")
    assert lecture.status_code == 404

def test_refuse_sans_cle(client):
    # On retire la clé des en-têtes du client pour cette requête.
    client.headers.pop("X-Api-Key")

    reponse = client.get("/taches")

    assert reponse.status_code == 401