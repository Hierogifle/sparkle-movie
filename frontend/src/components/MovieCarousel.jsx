import React from 'react';
import MovieCard from './MovieCard';
import './MovieCarousel.css';

const MovieCarousel = ({ movies, onShowDetails }) => {
  if (!movies || movies.length === 0) return null;

  // Si on a moins de 8 films, la boucle infinie va casser visuellement.
  const isShortList = movies.length <= 8;
  
  // On ne duplique la liste que si elle est assez longue
  const displayMovies = isShortList ? movies : [...movies, ...movies];

  return (
    <div className="movie-carousel-container">
      <div className={`movie-carousel-track ${isShortList ? 'static-track' : ''}`}>
        {displayMovies.map((movie, index) => (
          <div key={`${movie.movieId}-${index}`} className="carousel-item">
            {/* ICI : On ajoute onShowDetails pour que MovieCard puisse l'utiliser */}
            <MovieCard 
              movie={movie} 
              onShowDetails={onShowDetails} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieCarousel;