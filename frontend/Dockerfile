# Étape 1 : Build de l'application React
FROM node:20-alpine AS build

WORKDIR /app

# On déclare l'argument VITE_API_URL pour qu'il soit injecté lors du build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copie des fichiers de dépendances
COPY frontend/package.json frontend/package-lock.json ./

# Installation des dépendances
RUN npm install

# Copie du code source
COPY frontend/ .

# Build de l'application
RUN npm run build

# Étape 2 : Serveur de fichiers statiques (Nginx)
FROM nginx:alpine

# Copie de la configuration Nginx personnalisée
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers buildés depuis l'étape précédente
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
