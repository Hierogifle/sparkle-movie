import React from 'react';
import { Star, Heart, Info } from 'lucide-react';
import './MovieCard.css';

const MovieCard = ({ movie, isSelected, onToggleSelect, onShowDetails, similarity }) => {
  const { title, title_fr, poster_path, vote_average } = movie;
  const displayTitle = title_fr || title;
  const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  const posterUrl = poster_path
    ? (poster_path.startsWith('http') ? poster_path : `${TMDB_IMAGE_BASE_URL}${poster_path}`)
    : 'https://via.placeholder.com/500x750?text=Affiche+non+disponible';

  return (
    <div
      className={`movie-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggleSelect && onToggleSelect(movie)}
    >
      <div className="poster-container">
        <img src={posterUrl} alt={displayTitle} loading="lazy" />

        {isSelected && (
          <div className="selection-overlay">
            <Heart size={40} fill="#ef4444" color="#ef4444" />
          </div>
        )}

        {similarity && (
          <div className="similarity-badge">{Math.round(similarity * 100)}% Match</div>
        )}

        {/* Bouton Info : Strictement l'icône, pas de texte */}
        <button
          className="info-icon-btn"
          onClick={(e) => {
            e.stopPropagation(); // Empêche la sélection du film
            onShowDetails && onShowDetails(movie.movieId);
          }}
        >
          <Info size={22} color="white" strokeWidth={2.5} />
        </button>
      </div>

      <div className="movie-info">
        <h3 title={displayTitle}>{displayTitle}</h3>
        <div className="movie-meta">
          <div className="rating">
            <Star size={14} fill="#fbbf24" color="#fbbf24" />
            <span>{vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;