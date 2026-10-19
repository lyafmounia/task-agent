# ==================== Étape 1 : installer les dépendances ====================
FROM node:24-alpine AS dependances

# Métadonnée indiquant où se trouve le code source de l'image :
# GitHub s'en sert pour relier le paquet publié au dépôt.
LABEL org.opencontainers.image.source=https://github.com/lyafmounia/task-agent
WORKDIR /app

# Copier d'abord uniquement les fichiers de dépendances, pour profiter
# du cache de Docker (même principe que requirements.txt pour le backend).
COPY package.json package-lock.json ./

# Installer exactement les versions du lockfile.
RUN npm ci

# ==================== Étape 2 : compiler l'application ====================
FROM node:24-alpine AS construction
WORKDIR /app

# Récupérer node_modules depuis l'étape précédente (--from=dependances).
COPY --from=dependances /app/node_modules ./node_modules

# Copier tout le code source (sauf ce qu'exclut .dockerignore).
COPY . .

# Compiler : produit .next/standalone et .next/static.
RUN npm run build

# ==================== Étape 3 : l'image finale ====================
# On repart d'une image neuve : rien des étapes précédentes n'est gardé,
# sauf ce qu'on copie explicitement ci-dessous.
FROM node:24-alpine AS execution
WORKDIR /app

# Variables d'environnement lues par le serveur Next.js :
# - NODE_ENV=production active les optimisations de production ;
# - HOSTNAME=0.0.0.0 fait écouter le serveur sur toutes les adresses du
#   conteneur (même raison que le 0.0.0.0 de FastAPI à l'étape 11) ;
# - PORT=3000 est le port d'écoute.
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copier uniquement le résultat de la compilation.
# --chown=node:node donne ces fichiers à l'utilisateur "node",
# un utilisateur sans privilèges fourni par l'image officielle de Node.js.
COPY --from=construction --chown=node:node /app/.next/standalone ./
COPY --from=construction --chown=node:node /app/.next/static ./.next/static
COPY --from=construction --chown=node:node /app/public ./public

# Exécuter le serveur avec l'utilisateur "node" plutôt qu'avec "root".
# Si une faille permettait de prendre le contrôle du serveur, l'attaquant
# n'aurait que les droits limités de cet utilisateur.
USER node

EXPOSE 3000

# Lancer le serveur minimal produit par le mode standalone.
CMD ["node", "server.js"]