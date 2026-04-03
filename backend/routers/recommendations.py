from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal, Movie
from models import RecommendationRequest, RecommendationResponse
from recommender import recommend_from_selection

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _get_movies_from_recommendations(recs: list, db: Session):
    if not recs:
        return []
    
    rec_map = {r["movieId"]: r["similarity"] for r in recs}
    movie_ids = list(rec_map.keys())
    
    movies = db.query(Movie).filter(Movie.movieId.in_(movie_ids)).all()
    
    sorted_movies = []
    movie_dict = {m.movieId: m for m in movies}
    
    for mid in movie_ids:
        if mid in movie_dict:
            m = movie_dict[mid]
            m_data = {
                "movieId": m.movieId,
                "title": m.title,
                "title_fr": m.title_fr,
                "poster_path": m.poster_path,
                "vote_average": m.vote_average,
                "genres_tmdb": m.genres_tmdb,
                "genres": m.genres,
                "similarity": rec_map[mid]
            }
            sorted_movies.append(m_data)
            
    return sorted_movies

# --- LES DEUX FONCTIONS À MODIFIER SONT ICI ---

@router.post("/personal", response_model=List[RecommendationResponse])
def get_personal_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
    if len(request.movie_ids) < 3:
        raise HTTPException(status_code=400, detail="Veuillez sélectionner au moins 3 films.")
    
    # MODIFICATION : n=16 et mode="personal"
    recs = recommend_from_selection(request.movie_ids, n=16, mode="personal")
    return _get_movies_from_recommendations(recs, db)

@router.post("/change-of-air", response_model=List[RecommendationResponse])
def get_change_of_air_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
    if len(request.movie_ids) < 3:
        raise HTTPException(status_code=400, detail="Veuillez sélectionner au moins 3 films.")
    
    # MODIFICATION : n=16 et mode="air"
    recs = recommend_from_selection(request.movie_ids, n=16, mode="air")
    return _get_movies_from_recommendations(recs, db)