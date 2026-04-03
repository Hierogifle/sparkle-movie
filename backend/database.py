import os
import pandas as pd
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Gestion des chemins : on essaie de trouver le fichier par rapport à la racine du projet
# ou par rapport au dossier backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_abs_path(env_var, default_rel_path):
    path = os.getenv(env_var, default_rel_path)
    if os.path.isabs(path):
        return path
    # Essayer par rapport à la racine du projet
    abs_path = os.path.join(BASE_DIR, path.replace("../", ""))
    if os.path.exists(abs_path):
        return abs_path
    # Fallback sur le chemin tel quel
    return path

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'backend', 'sparkle.db')}")
MOVIES_PARQUET_PATH = get_abs_path("MOVIES_PARQUET_PATH", "data/enriched/movies_enriched.parquet")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Movie(Base):
    __tablename__ = "movies"
    
    movieId = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    title_fr = Column(String, index=True)
    genres_tmdb = Column(String)
    genres = Column(String)
    overview = Column(Text)
    tagline = Column(Text)
    vote_average = Column(Float)
    vote_count = Column(Float)
    popularity = Column(Float)
    release_date = Column(String)
    runtime = Column(Float)
    directors = Column(String)
    cast_top10 = Column(Text)
    poster_path = Column(String)
    backdrop_path = Column(String)
    certification_fr = Column(String)
    collection = Column(String)
    tags_users = Column(Text)
    
    # Champs pour les stats
    trending_score = Column(Float)
    hidden_gem_score = Column(Float)

# Index pour la recherche rapide
Index('idx_movie_title', Movie.title)
Index('idx_movie_title_fr', Movie.title_fr)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Vérifier si la table est déjà remplie
        if db.query(Movie).first() is None:
            print(f"Importation des données depuis {MOVIES_PARQUET_PATH}...")
            
            # Charger le parquet
            df = pd.read_parquet(MOVIES_PARQUET_PATH)
            
            # Sélectionner les colonnes utiles
            columns_to_keep = [
                'movieId', 'title', 'title_fr', 'genres_tmdb', 'genres', 
                'overview', 'tagline', 'vote_average', 'vote_count', 
                'popularity', 'release_date', 'runtime', 'directors', 
                'cast_top10', 'poster_path', 'backdrop_path', 
                'certification_fr', 'collection', 'tags_users'
            ]
            
            # S'assurer que toutes les colonnes existent
            available_cols = [c for c in columns_to_keep if c in df.columns]
            df_subset = df[available_cols].copy()
            
            # Calcul des scores
            # trending_score = popularity pondérée par vote_count normalisé
            # On utilise une normalisation simple pour vote_count
            max_votes = df_subset['vote_count'].max()
            df_subset['trending_score'] = df_subset['popularity'] * (df_subset['vote_count'] / max_votes)
            
            # hidden_gem_score = vote_average >= 7.0 ET vote_count entre 50 et 2000 ET popularity dans le bas quartile
            pop_q1 = df_subset['popularity'].quantile(0.25)
            mask_hidden_gem = (
                (df_subset['vote_average'] >= 7.0) & 
                (df_subset['vote_count'] >= 50) & 
                (df_subset['vote_count'] <= 2000) & 
                (df_subset['popularity'] <= pop_q1)
            )
            df_subset['hidden_gem_score'] = 0.0
            df_subset.loc[mask_hidden_gem, 'hidden_gem_score'] = df_subset.loc[mask_hidden_gem, 'vote_average']
            
            # Importer dans SQLite
            df_subset.to_sql('movies', con=engine, if_exists='append', index=False)
            print(f"Importation terminée : {len(df_subset)} films importés.")
        else:
            print("La base de données contient déjà des films. Importation ignorée.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
