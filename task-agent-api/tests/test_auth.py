# Données réutilisées dans plusieurs tests.
EMAIL = "mounia@exemple.fr"
MOT_DE_PASSE = "motdepasse123"


def inscrire(client, email=EMAIL, mot_de_passe=MOT_DE_PASSE):
    """Crée un compte et renvoie la réponse."""
    return client.post(
        "/auth/inscription", json={"email": email, "mot_de_passe": mot_de_passe}
    )


def se_connecter(client, email=EMAIL, mot_de_passe=MOT_DE_PASSE):
    """Se connecte et renvoie la réponse.
    data= envoie un FORMULAIRE, comme l'exige OAuth2 (et non du JSON)."""
    return client.post(
        "/auth/connexion", data={"username": email, "password": mot_de_passe}
    )


def test_inscription(client):
    reponse = inscrire(client)

    assert reponse.status_code == 201, reponse.json()
    donnees = reponse.json()
    assert donnees["email"] == EMAIL
    # Ni le mot de passe ni son empreinte ne doivent sortir de l'API.
    assert "mot_de_passe" not in donnees
    assert "mot_de_passe_hache" not in donnees


def test_inscription_email_deja_utilise(client):
    inscrire(client)

    reponse = inscrire(client)

    assert reponse.status_code == 409


def test_inscription_mot_de_passe_trop_court(client):
    reponse = inscrire(client, mot_de_passe="court")

    assert reponse.status_code == 422


def test_connexion(client):
    inscrire(client)

    reponse = se_connecter(client)

    assert reponse.status_code == 200, reponse.json()
    assert reponse.json()["token_type"] == "bearer"
    assert reponse.json()["access_token"]


def test_connexion_mauvais_mot_de_passe(client):
    inscrire(client)

    reponse = se_connecter(client, mot_de_passe="mauvais-mot-de-passe")

    assert reponse.status_code == 401


def test_moi_avec_jeton(client):
    inscrire(client)
    jeton = se_connecter(client).json()["access_token"]

    # Le jeton est envoyé dans l'en-tête Authorization, au format "Bearer <jeton>".
    reponse = client.get("/auth/moi", headers={"Authorization": f"Bearer {jeton}"})

    assert reponse.status_code == 200
    assert reponse.json()["email"] == EMAIL


def test_moi_sans_jeton(client):
    reponse = client.get("/auth/moi")

    assert reponse.status_code == 401


def test_moi_jeton_falsifie(client):
    reponse = client.get(
        "/auth/moi", headers={"Authorization": "Bearer un.faux.jeton"}
    )
    assert reponse.status_code == 401

def test_connexion_limitee(client):
    inscrire(client)

    # 5 tentatives avec un mauvais mot de passe : refusées (401),
    # mais encore autorisées par le rate limiting.
    for _ in range(5):
        assert se_connecter(client, mot_de_passe="mauvais").status_code == 401

    # La 6e tentative est bloquée, MÊME avec le bon mot de passe.
    reponse = se_connecter(client)

    assert reponse.status_code == 429