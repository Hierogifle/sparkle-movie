import React from 'react';
import MovieCard from './MovieCard';
import './MovieGrid.css';

const MovieGrid = ({ movies, selectedIds, onToggleSelect }) => {
  if (!movies || movies.length === 0) return null;
  
  return (
    <div className="movie-grid">
      {movies.map(movie => (
        <MovieCard 
          key={movie.movieId} 
          movie={movie} 
          isSelected={selectedIds?.includes(movie.movieId)}
          onToggleSelect={onToggleSelect}
          similarity={movie.similarity}
        />
      ))}
    </div>
  );
};

export default MovieGrid;
