from pydantic import BaseModel
from typing import List, Optional

class MovieBase(BaseModel):
    movieId: int
    title: str
    title_fr: Optional[str] = None
    poster_path: Optional[str] = None
    vote_average: Optional[float] = None
    genres_tmdb: Optional[str] = None
    genres: Optional[str] = None

class MovieDetail(MovieBase):
    overview: Optional[str] = None
    tagline: Optional[str] = None
    vote_count: Optional[float] = None
    popularity: Optional[float] = None
    release_date: Optional[str] = None
    runtime: Optional[float] = None
    directors: Optional[str] = None
    cast_top10: Optional[str] = None
    backdrop_path: Optional[str] = None
    certification_fr: Optional[str] = None
    collection: Optional[str] = None
    tags_users: Optional[str] = None

class RecommendationRequest(BaseModel):
    movie_ids: List[int]

class RecommendationResponse(MovieBase):
    similarity: float
