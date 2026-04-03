# 🎬 Sparkle Movie

**Sparkle Movie** est une démo d'application full-stack de recommandation de films, pilotée par l'Intelligence Artificielle. Conçue pour offrir une expérience utilisateur moderne et fluide, l'application analyse vos sélections pour vous proposer des films pertinents, ou au contraire, vous sortir de votre zone de confort.

![Sparkle Movie - Aperçu](frontend/public/vite.svg) *(Remplacez par un screenshot de l'app)*

## ✨ Fonctionnalités Principales

- **Recherche Instantanée** : Moteur de recherche réactif pour trouver n'importe quel film parmi plus de 87 000 titres.
- **Tendances ("En ce moment")** : Les films les plus populaires et les mieux notés du moment.
- **Pépites ("Les oubliés")** : Les films avec d'excellentes notes mais un nombre de votes très faible, pour découvrir des chefs-d'œuvre cachés.
- **Recommandations Personnalisées** :
  - **Fait pour vous** : Une sélection basée sur vos goûts (via analyse KNN et Similarité Cosinus TF-IDF).
  - **Changer d'air** : Des propositions inattendues qui excluent les genres des films que vous avez l'habitude de regarder.

## 🛠️ Stack Technique

### Backend (API & ML)
- **Framework** : [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Base de données** : SQLite (via [SQLAlchemy](https://www.sqlalchemy.org/)) - *Initialisée automatiquement au 1er lancement à partir d'un fichier Parquet*.
- **Machine Learning** : [Scikit-learn](https://scikit-learn.org/) (Modèle KNN pré-entraîné) & Scipy (Matrice TF-IDF).
- **Manipulation Data** : Pandas & PyArrow.

### Frontend
- **Framework** : [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routage** : React Router DOM
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Design** : CSS Vanilla moderne avec thématique "Dark Mode", variables CSS et animations CSS fluides.

## 📂 Architecture du Dépôt

```
sparkle-movie/
├── backend/            # Code source de l'API FastAPI (main.py, routers, database.py)
├── frontend/           # Application React (Composants, Hooks, Pages)
├── data/
│   ├── enriched/       # Contient movies_enriched.parquet (source DB)
│   └── gold/           # Matrice TF-IDF (.npz)
├── models/             # Modèle ML KNN pré-entraîné (.joblib)
├── start.sh            # Script de lancement global (Linux/macOS)
├── start.ps1           # Script de lancement global (Windows PowerShell)
└── Makefile            # Raccourcis pour l'installation et le développement
```

## 🚀 Installation & Démarrage (Développement Local)

L'application est conçue pour démarrer facilement en unifiant Backend et Frontend.

### Prérequis
- Python 3.10+
- Node.js 18+

### 1. Installation
Utilisez le `Makefile` pour tout installer (Création de l'environnement virtuel Python + npm install) :
```bash
make install
```

### 2. Configuration (`.env`)
Assurez-vous qu'un fichier `.env` existe à la racine (généré automatiquement ou via Dokploy) avec les chemins appropriés :
```ini
DATABASE_URL=sqlite:///./backend/sparkle.db
TFIDF_MATRIX_PATH=./data/gold/movies_tfidf.npz
KNN_MODEL_PATH=./models/knn_tfidf.joblib
MOVIES_PARQUET_PATH=./data/enriched/movies_enriched.parquet
```

### 3. Lancement
Pour démarrer simultanément l'API (port `8000`) et le Frontend (port `5173`) :

**Sous Linux / WSL / macOS :**
```bash
./start.sh
# ou via Make
make start
```

**Sous Windows (PowerShell) :**
```powershell
.\start.ps1
```

*Note : Lors du tout premier lancement, le backend mettra environ 30 secondes à démarrer pour importer le fichier `movies_enriched.parquet` dans SQLite et charger les modèles de Machine Learning de 50 Mo.*

## 🐳 Déploiement (Dokploy)

Ce projet est optimisé pour être déployé sur **Dokploy** via cette branche `main`. Les fichiers `.gitignore` ont été configurés pour exclure strictement la base de données générée (`sparkle.db`) et les environnements virtuels locaux, afin de garantir un build Docker propre.
