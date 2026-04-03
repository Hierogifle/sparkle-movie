#!/bin/bash

# Arrêter tous les processus enfants à la fermeture du script
trap "kill 0" EXIT

echo "🚀 Démarrage de Sparkle Movie..."

# 1. Démarrage du Backend
echo "📡 Lancement du Backend (FastAPI) sur http://localhost:8000..."
./.venv_linux/bin/python3 -m uvicorn backend.main:app --reload --port 8000 &

# Attendre un peu que le backend initialise la BDD si besoin
sleep 2

# 2. Démarrage du Frontend
echo "💻 Lancement du Frontend (Vite) sur http://localhost:5173..."
cd frontend && npm run dev &

# Garder le script actif
wait
