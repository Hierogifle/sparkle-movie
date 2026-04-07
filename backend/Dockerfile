FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances système nécessaires pour certaines bibliothèques Python
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de dépendances
COPY backend/requirements.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code backend et des données nécessaires
COPY backend/ ./backend/
COPY data/ ./data/
COPY models/ ./models/

# Exposition du port
EXPOSE 8000

# Commande pour lancer l'application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
