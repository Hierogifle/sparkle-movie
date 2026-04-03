.PHONY: install start backend-dev frontend-dev db-init

# Installation initiale
install:
	python3 -m venv .venv_linux
	./.venv_linux/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

# Tout lancer d'un coup
start:
	./start.sh

# Lancer le backend seul
backend-dev:
	./.venv_linux/bin/python3 -m uvicorn backend.main:app --reload --port 8000

# Lancer le frontend seul
frontend-dev:
	cd frontend && npm run dev

# Forcer l'initialisation de la BDD
db-init:
	./.venv_linux/bin/python3 backend/database.py
