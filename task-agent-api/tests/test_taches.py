def test_accueil(client):
    reponse = client.get("/")
    assert reponse.status_code == 200
    assert reponse.json() == {"message": "Bienvenue sur Task Agent"}


def test_creer_tache(client_connecte):
    reponse = client_connecte.post("/taches", json={"title": "Écrire des tests", "priorite": 2})
    # breakpoint()
    assert reponse.status_code == 201
    donnees = reponse.json()
    assert donnees["title"] == "Écrire des tests"
    assert donnees["priorite"] == 2
    assert donnees["terminee"] is False
    assert "_id" in donnees


def test_creer_tache_sans_titre(client_connecte):
    reponse = client_connecte.post("/taches", json={"priorite": 2})
    assert reponse.status_code == 422


def test_lire_tache_inexistante(client_connecte):
    reponse = client_connecte.get("/taches/000000000000000000000000")
    assert reponse.status_code == 404

def test_terminer_tache(client_connecte):
    creation = client_connecte.post("/taches", json={"title": "À terminer"})
    tache_id = creation.json()['_id']

    reponse = client_connecte.patch(f"/taches/{tache_id}/terminer")

    assert reponse.status_code == 200, reponse.json()
    assert reponse.json()["terminee"] is True

def test_filtrer_taches_terminees(client_connecte):
    premiere = client_connecte.post("/taches", json={"title": "Tâche finie"})
    client_connecte.post("/taches", json={"title": "Tâche à faire"})
    client_connecte.patch(f"/taches/{premiere.json()['_id']}/terminer")

    reponse = client_connecte.get("/taches?terminee=true")

    assert reponse.status_code == 200
    taches = reponse.json()
    assert len(taches) == 1
    assert taches[0]["title"] == "Tâche finie"


def test_supprimer_tache(client_connecte):
    creation = client_connecte.post("/taches", json={"title": "À supprimer"})
    tache_id = creation.json()["_id"]

    reponse = client_connecte.delete(f"/taches/{tache_id}")
    assert reponse.status_code == 204

    lecture = client_connecte.get(f"/taches/{tache_id}")
    assert lecture.status_code == 404

def test_refuse_sans_cle(client):
    # On retire la clé des en-têtes du client pour cette requête.
    client.headers.pop("X-Api-Key")

    reponse = client.get("/taches")

    assert reponse.status_code == 401


def test_taches_exigent_un_jeton(client):
    # Client avec la clé d'API, mais SANS jeton : refusé.
    reponse = client.get("/taches")
    assert reponse.status_code == 401


def test_ne_voit_pas_les_taches_des_autres(client_connecte, jeton_pour):
    # user crée une tâche.
    creation = client_connecte.post("/taches", json={"title": "Tâche de Mounia"})
    tache_id = creation.json()["_id"]

    # Un second utilisateur, Bob. Les en-têtes passés à une requête REMPLACENT
    # ceux du client pour cette requête : on agit donc en tant que Bob.
    entetes_bob = {"Authorization": f"Bearer {jeton_pour('bob@exemple.fr')}"}

    # Bob ne voit aucune tâche dans sa liste...
    assert client_connecte.get("/taches", headers=entetes_bob).json() == []
    # ...ne peut pas lire celle de Mounia...
    assert client_connecte.get(f"/taches/{tache_id}", headers=entetes_bob).status_code == 404
    # ...ni la supprimer.
    assert client_connecte.delete(f"/taches/{tache_id}", headers=entetes_bob).status_code == 404

    # Et la tâche de Mounia existe toujours.
    assert client_connecte.get(f"/taches/{tache_id}").status_code == 200