import React, { useEffect, useState } from 'react';
import { X, Star, Clock, User, Users, Globe, Building2, Calendar } from 'lucide-react';
import { useMovies } from '../hooks/useMovies';
import './MovieModal.css';

const MovieModal = ({ movieId, onClose }) => {
  const { getMovieById } = useMovies();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const data = await getMovieById(movieId);
      setMovie(data);
      setLoading(false);
    };
    if (movieId) fetchDetails();
  }, [movieId, getMovieById]);

  if (!movieId) return null;

  // Formattage propre de la durée
  const formatRuntime = (minutes) => {
    if (!minutes) return "N/A";
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return h > 0 ? `${h}h ${m < 10 ? '0' : ''}${m}min` : `${m}min`;
  };

  // Année de sortie
  const releaseYear = movie?.release_date ? movie.release_date.substring(0, 4) : "N/A";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* BOUTON FERMER (Le vrai, parfaitement rond !) */}
        <button className="modal-close-btn" onClick={onClose}>
          <X size={24} strokeWidth={2.5} />
        </button>
        
        {loading ? (
          <div className="modal-loader">
            <div className="spinner"></div>
            <p>Ouverture de la pépite...</p>
          </div>
        ) : movie && (
          <>
            {/* HERO BANNER (Image de fond qui se fond dans la couleur de la carte) */}
            <div 
              className="modal-hero" 
              style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}
            >
              <div className="modal-hero-gradient"></div>
            </div>

            {/* CONTENU PRINCIPAL */}
            <div className="modal-content-layout">
              
              {/* COLONNE GAUCHE : Affiche et badges rapides */}
              <div className="modal-sidebar">
                <img 
                  className="modal-poster" 
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                  alt={movie.title} 
                />
                
                <div className="modal-quick-stats">
                  <div className="stat-badge highlight">
                    <Star size={16} fill="black" /> 
                    <span>{movie.vote_average?.toFixed(1)}</span>
                  </div>
                  <div className="stat-badge">
                    <Clock size={16} /> 
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                  <div className="stat-badge">
                    <Calendar size={16} /> 
                    <span>{releaseYear}</span>
                  </div>
                </div>
              </div>

              {/* COLONNE DROITE : Toutes les infos textuelles */}
              <div className="modal-info">
                
                <div className="modal-title-area">
                  <h1 className="modal-title">{movie.title_fr || movie.title}</h1>
                  {movie.tagline && <p className="modal-tagline">"{movie.tagline}"</p>}
                </div>

                <div className="modal-badges-row">
                  <span className="certification-badge">
                    {movie.certification_fr || movie.certification_us || "TOUT PUBLIC"}
                  </span>
                  <span className="lang-badge">
                    <Globe size={14} /> {movie.original_lang?.toUpperCase() || "N/A"}
                  </span>
                </div>

                <div className="modal-genres">
                  {(movie.genres_tmdb || movie.genres || "").split('|').map(g => {
                    const genre = g.trim();
                    if (!genre) return null;
                    return <span key={genre} className="genre-pill">{genre}</span>;
                  })}
                </div>

                {/* SYNOPSIS */}
                <div className="modal-section">
                  <h3>Synopsis</h3>
                  <p className="modal-overview">
                    {movie.overview || "Aucun résumé n'est disponible pour ce film pour le moment."}
                  </p>
                </div>

                {/* GRILLE D'ÉQUIPE (Cast, Crew, Studios) */}
                <div className="modal-crew-grid">
                  <div className="crew-item">
                    <div className="crew-icon"><User size={18} /></div>
                    <div className="crew-text">
                      <h4>Réalisation</h4>
                      {/* MODIFICATION ICI : Remplace les | par des virgules pour l'affichage */}
                      <p>{movie.directors ? movie.directors.split('|').join(', ') : "Information non disponible"}</p>
                    </div>
                  </div>
                  
                  <div className="crew-item">
                    <div className="crew-icon"><Users size={18} /></div>
                    <div className="crew-text">
                      <h4>Distribution principale</h4>
                      {/* MODIFICATION ICI : split('|') pour isoler les acteurs */}
                      <p>{movie.cast_top10 ? movie.cast_top10.split('|').slice(0, 6).join(', ') : "Non renseigné"}</p>
                    </div>
                  </div>

                  <div className="crew-item">
                    <div className="crew-icon"><Building2 size={18} /></div>
                    <div className="crew-text">
                      <h4>Studios de production</h4>
                      {/* MODIFICATION ICI : Remplace les | par des virgules */}
                      <p>{movie.studios ? movie.studios.split('|').join(', ') : "Indépendant / Non renseigné"}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MovieModal;