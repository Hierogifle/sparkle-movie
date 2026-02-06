# 🎬 Sparkle Movie — Moteurs de recommandation à grande échelle (Partie 1)

## Contexte
Ce projet s’inscrit dans le cadre du cursus **Master 1 Data / IA** de *La Plateforme*.  
Il vise à concevoir et comparer plusieurs **moteurs de recommandation** à partir du dataset **MovieLens**, en s’appuyant sur **Apache Spark (PySpark)** pour le traitement de données à grande échelle.

Le contexte métier simulé est celui d’une **plateforme de streaming vidéo** souhaitant améliorer l’expérience utilisateur grâce à des recommandations personnalisées, robustes et scalables.

## Objectifs du projet (Partie 1)
La première partie du projet se concentre sur la **conception, l’évaluation et la comparaison de moteurs de recommandation**, sans industrialisation avancée.

Les objectifs sont :
- Charger et explorer un dataset réel à l’aide de **Spark DataFrames**
- Mettre en œuvre plusieurs approches de recommandation :
  - Filtrage collaboratif (ALS – Spark MLlib)
  - Recommandation basée sur le contenu
  - Recommandation par proximité (KNN utilisateur ou item)
- Comparer les approches selon :
  - la qualité des recommandations
  - la complexité de mise en œuvre
  - les performances et la scalabilité
- Proposer des recommandations explicites pour des utilisateurs fictifs
- Structurer un pipeline d’entraînement **reproductible**

## Dataset
Le projet utilise le dataset **MovieLens**, composé principalement de :

- **ratings.csv**
  - `userId` : identifiant utilisateur
  - `movieId` : identifiant film
  - `rating` : note attribuée
  - `timestamp`
- **movies.csv**
  - `movieId`
  - `title`
  - `genres`

Le chargement et le traitement des données sont réalisés via **PySpark**.

## Architecture du projet
```text
sparkle-movie/
├── data/
│   ├── raw/
│   ├── interim/
│   └── processed/
├── notebooks/
│   ├── 01_exploration.ipynb
│   └── 02_modelisation.ipynb
├── src/
│   └── sparkle_movie/
│       ├── data/
│       ├── features/
│       ├── models/
│       └── evaluation/
├── reports/
│   └── figures/
├── tests/
├── docs/
└── README.md
```

## Approches de recommandation implémentées

### Filtrage collaboratif — ALS
Utilisation de l’algorithme **Alternating Least Squares** de Spark MLlib, avec séparation des données en jeux d’entraînement, de validation et de test. Les hyperparamètres principaux (rank, regParam, nombre d’itérations) sont ajustés et les performances évaluées à l’aide de métriques telles que **RMSE** et **MAE**. Ce modèle constitue la baseline principale du projet.

### Recommandation basée sur le contenu
Création de profils de films à partir des genres et d’informations textuelles simples. Les films sont représentés dans un espace vectoriel (TF-IDF) et les recommandations sont générées via une mesure de similarité (cosinus).

### Recommandation par proximité (KNN)
Implémentation d’une approche basée sur la similarité entre utilisateurs ou entre items (User-Based ou Item-Based KNN). Les recommandations sont générées à partir des évaluations des voisins les plus proches.

## Évaluation et comparaison
Les différentes approches sont comparées selon :
- la pertinence des recommandations
- la couverture
- le temps de calcul
- la facilité de passage à l’échelle

Des recommandations concrètes sont proposées pour **3 à 5 utilisateurs fictifs**, avec justification du modèle utilisé.

## Environnement technique

### Pré-requis
- Python **3.11+**
- Apache Spark
- PySpark
- Git

### Installation locale
```bash
git clone git@github.com:Hierogifle/spa
