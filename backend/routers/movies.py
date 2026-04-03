from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List
from database import SessionLocal, Movie
from models import MovieBase, MovieDetail

router = APIRouter(prefix="/api/movies", tags=["movies"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/search", response_model=List[MovieBase])
def search_movies(q: str = Query(..., min_length=2), limit: int = 20, db: Session = Depends(get_db)):
    search = f"%{q}%"
    movies = db.query(Movie).filter(
        or_(
            Movie.title.ilike(search),
            Movie.title_fr.ilike(search)
        )
    ).limit(limit).all()
    return movies

@router.get("/trending", response_model=List[MovieBase])
def get_trending(limit: int = 20, genre: str = None, db: Session = Depends(get_db)):
    query = db.query(Movie)
    # On ajoute la vérification ici
    if genre and genre not in ["Tous", "Les pépites des pépites"]:
        query = query.filter(or_(Movie.genres_tmdb.ilike(f"%{genre}%"), Movie.genres.ilike(f"%{genre}%")))
    movies = query.order_by(Movie.trending_score.desc()).limit(limit).all()
    return movies

@router.get("/hidden-gems", response_model=List[MovieBase])
def get_hidden_gems(limit: int = 20, genre: str = None, db: Session = Depends(get_db)):
    query = db.query(Movie).filter(Movie.hidden_gem_score > 0)
    # Et on ajoute la vérification ici aussi
    if genre and genre not in ["Tous", "Les pépites des pépites"]:
        query = query.filter(or_(Movie.genres_tmdb.ilike(f"%{genre}%"), Movie.genres.ilike(f"%{genre}%")))
    movies = query.order_by(Movie.hidden_gem_score.desc(), Movie.vote_count.desc()).limit(limit).all()
    return movies

@router.get("/{movie_id}", response_model=MovieDetail)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.movieId == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie
