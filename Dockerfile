FROM python:3.14-slim

# Métadonnée standard indiquant où se trouve le code source de l'image.
# GitHub s'en sert pour relier le paquet publié au dépôt.
LABEL org.opencontainers.image.source=https://github.com/lyafmounia/task-agent

# Dossier de travail à l'intérieur de l'image : toutes les commandes
# suivantes s'exécutent dans /app (il est créé s'il n'existe pas).
WORKDIR /app

# On copie d'abord UNIQUEMENT la liste des dépendances.
COPY requirements.txt .

# COPY . /app

# On installe les dépendances. --no-cache-dir évite de garder les fichiers
# téléchargés par pip, ce qui rend l'image plus légère.
RUN pip install --no-cache-dir -r requirements.txt

# Puis on copie le code de l'application.
COPY main.py .

# Commande lancée au démarrage du conteneur. "fastapi run" est le mode
# production : pas de rechargement automatique, et il écoute sur toutes
# les adresses réseau du conteneur, pas seulement sur 127.0.0.1.
CMD ["fastapi", "run", "main.py", "--port", "8000"]