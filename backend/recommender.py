import os
import joblib
import pandas as pd
import numpy as np
from scipy.sparse import load_npz
from dotenv import load_dotenv
import random

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TFIDF_MATRIX_PATH = os.path.join(BASE_DIR, "data/gold/movies_tfidf.npz")
KNN_MODEL_PATH = os.path.join(BASE_DIR, "models/knn_tfidf.joblib")
MOVIES_PARQUET_PATH = os.path.join(BASE_DIR, "data/enriched/movies_enriched.parquet")

tfidf_matrix = load_npz(TFIDF_MATRIX_PATH)
knn_model = joblib.load(KNN_MODEL_PATH)
movies_df = pd.read_parquet(MOVIES_PARQUET_PATH)[["movieId", "genres_tmdb", "genres", "title"]]

movie_id_to_idx = {id: idx for idx, id in enumerate(movies_df["movieId"])}
idx_to_movie_id = {idx: id for idx, id in enumerate(movies_df["movieId"])}

def recommend_from_selection(movie_ids: list[int], n: int = 16, mode: str = "personal"):
    indices = [movie_id_to_idx.get(mid) for mid in movie_ids if mid in movie_id_to_idx]
    if not indices: return []

    # 1. Calcul du centre de tes goûts
    vectors = tfidf_matrix[indices]
    mean_vector = np.asarray(vectors.mean(axis=0))

    # 2. On cherche BEAUCOUP plus loin (500 voisins) pour avoir du choix "frais"
    search_depth = 500 if mode == "air" else 150
    distances, neighbor_indices = knn_model.kneighbors(mean_vector, n_neighbors=search_depth)
    
    distances = distances.flatten()
    neighbor_indices = neighbor_indices.flatten()
    
    # 3. Récupération TRÈS stricte des genres de ta sélection
    selected_genres_set = set()
    for idx in indices:
        g = str(movies_df.iloc[idx]["genres_tmdb"] or movies_df.iloc[idx]["genres"] or "").lower()
        selected_genres_set.update([gen.strip() for gen in g.split(',') if gen.strip()])
    
    # 4. Mélange des candidats pour le mode "Air" pour casser la ressemblance immédiate
    candidates = list(zip(distances, neighbor_indices))
    if mode == "air":
        random.shuffle(candidates) # On pioche au hasard dans les 500 voisins

    recommendations = []
    seen_titles = set()
    genre_count = {}

    for dist, idx in candidates:
        m_id = idx_to_movie_id[idx]
        if m_id in movie_ids: continue
            
        row = movies_df.iloc[idx]
        title = row["title"]
        g_raw = str(row["genres_tmdb"] or row["genres"] or "").lower()
        movie_genres = [gen.strip() for gen in g_raw.split(',') if gen.strip()]
        
        # --- FILTRE ANTI-FRANCHISE (Fini les 10 Avengers) ---
        title_base = title.split(':')[0].split(' - ')[0].strip().lower()
        if title_base in seen_titles: continue

        # --- LOGIQUE CHANGER D'AIR (Zéro point commun) ---
        if mode == "air":
            # Si le film partage ne serait-ce qu'UN genre avec ta sélection -> DEHORS
            if any(gen in selected_genres_set for gen in movie_genres):
                continue
            # On ignore aussi les films trop "proches" (similarité > 85%) pour forcer la surprise
            if (1 - dist) > 0.85:
                continue

        # --- LOGIQUE PERSONNELLE (DIVERSIFICATION) ---
        if mode == "personal":
            # Pas plus de 2 films du même genre principal
            primary = movie_genres[0] if movie_genres else "unknown"
            if genre_count.get(primary, 0) >= 2:
                continue
            genre_count[primary] = genre_count.get(primary, 0) + 1

        similarity = 1 - dist
        recommendations.append({"movieId": int(m_id), "similarity": float(similarity)})
        seen_titles.add(title_base)
        
        if len(recommendations) >= n: break
            
    # 5. GARANTIE DES 16 RÉSULTATS
    # Si les filtres ont été trop sévères, on complète avec les voisins restants
    if len(recommendations) < n:
        for dist, idx in candidates:
            m_id = idx_to_movie_id[idx]
            if m_id not in movie_ids and not any(r["movieId"] == m_id for r in recommendations):
                recommendations.append({"movieId": int(m_id), "similarity": float(1-dist)})
            if len(recommendations) >= n: break

    return recommendations[:n] # On renvoie strictement le nombre demandé