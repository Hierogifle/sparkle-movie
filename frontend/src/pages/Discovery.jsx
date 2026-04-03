import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '../hooks/useMovies';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { Search, Sparkles, Wind, Trash2, ArrowLeft } from 'lucide-react';
import './Discovery.css';

const Discovery = () => {
  const navigate = useNavigate();
  const { getTrending, searchMovies, getPersonalRecs, getChangeOfAirRecs, loading } = useMovies();

  const [searchQuery, setSearchQuery] = useState('');
  const [displayedMovies, setDisplayedMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingType, setLoadingType] = useState(null);
  const [lastRecType, setLastRecType] = useState('personal');

  // État pour la modale
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const resultsRef = useRef(null);

  // Chargement des films par défaut
  useEffect(() => {
    const loadDefault = async () => {
      const data = await getTrending(32);
      if (data) setDisplayedMovies(data);
    };
    loadDefault();
  }, [getTrending]);

  // Recherche dynamique
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      const data = await getTrending(32);
      setDisplayedMovies(data || []);
      return;
    }
    const results = await searchMovies(searchQuery, 32);
    setDisplayedMovies(results || []);
  };

  // Sélection des films
  const toggleMovieSelection = (movie) => {
    setSelectedMovies(prev => {
      const isAlreadySelected = prev.some(m => m.movieId === movie.movieId);
      if (isAlreadySelected) {
        return prev.filter(m => m.movieId !== movie.movieId);
      } else {
        return [...prev, movie];
      }
    });
  };

  // Recommandations IA
  const generateRecommendations = async (type) => {
    if (selectedMovies.length < 3) return;
    setLoadingType(type);
    setLastRecType(type);
    setRecommendations([]);
    const movieIds = selectedMovies.map(m => m.movieId);
    let results = [];
    if (type === 'personal') {
      results = await getPersonalRecs(movieIds);
    } else {
      results = await getChangeOfAirRecs(movieIds);
    }
    setRecommendations(results || []);
    setLoadingType(null);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="discovery-container">
      
      {/* NAVBAR PREMIUM */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="logo-icon">💎</span>
          <span className="logo-text">Ciné<span className="logo-accent">Pépite</span></span>
        </div>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Retour
        </button>
      </nav>

      {/* HEADER DE RECHERCHE */}
      <header className="discovery-header fade-in visible">
        <h1 className="hero-title">L'IA à votre <span className="hero-accent">service</span></h1>
        <p className="hero-subtitle">Sélectionnez au moins 3 films que vous avez aimés pour calibrer l'algorithme.</p>
        
        <form className="discovery-search" onSubmit={handleSearch}>
          <Search size={20} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Rechercher un film à ajouter à votre sélection..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary">Chercher</button>
        </form>
      </header>

      {/* GRILLE DES FILMS À SÉLECTIONNER */}
      <section className="selection-grid-section fade-in visible">
        <div className="movies-grid-auto">
          {displayedMovies.map(movie => (
            <MovieCard 
              key={movie.movieId} 
              movie={movie} 
              isSelected={selectedMovies.some(m => m.movieId === movie.movieId)}
              onToggleSelect={toggleMovieSelection}
              onShowDetails={(id) => setSelectedMovieId(id)}
            />
          ))}
        </div>
      </section>

      {/* AFFICHAGE DES RÉSULTATS IA */}
      {recommendations.length > 0 && (
        <section className="recommendations-section fade-in visible" ref={resultsRef}>
          <div className="recommendations-header">
            <h2 className="section-title">
              {lastRecType === 'air' ? "Un vent de fraîcheur 🌪️" : "Vos pépites sur mesure 🎯"}
            </h2>
            <p className="section-sub">
              {lastRecType === 'air' 
                ? "Des films excellents mais éloignés de vos habitudes pour sortir de votre zone de confort." 
                : "Classées par pourcentage de compatibilité avec vos goûts."}
            </p>
          </div>
          
          <div className="movies-grid-auto">
            {recommendations.map(movie => (
              <MovieCard 
                key={`rec-${movie.movieId}`} 
                movie={movie} 
                similarity={movie.similarity} 
                onShowDetails={(id) => setSelectedMovieId(id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* BARRE FLOTTANTE D'ACTION (Glassmorphism) */}
      {selectedMovies.length > 0 && (
        <div className={`floating-action-bar ${selectedMovies.length >= 3 ? 'ready' : ''}`}>
          <div className="fab-info">
            <span className="fab-count">{selectedMovies.length}</span>
            <span className="fab-text">
              film{selectedMovies.length > 1 ? 's' : ''} sélectionné{selectedMovies.length > 1 ? 's' : ''}
              {selectedMovies.length < 3 && <span className="fab-hint"> (Encore {3 - selectedMovies.length} !)</span>}
            </span>
          </div>
          
          <div className="fab-actions">
            <button 
              className="fab-btn btn-primary" 
              disabled={selectedMovies.length < 3 || loadingType === 'personal'}
              onClick={() => generateRecommendations('personal')}
            >
              <Sparkles size={18} />
              {loadingType === 'personal' ? 'Analyse...' : 'Générer mes pépites'}
            </button>
            
            <button 
              className="fab-btn btn-ghost" 
              disabled={selectedMovies.length < 3 || loadingType === 'air'}
              onClick={() => generateRecommendations('air')}
            >
              <Wind size={18} />
              {loadingType === 'air' ? 'Analyse...' : "Changer d'air"}
            </button>
            
            <button className="fab-icon-btn" onClick={() => setSelectedMovies([])} title="Vider la sélection">
              <Trash2 size={20} color="#ef4444" />
            </button>
          </div>
        </div>
      )}

      {/* MODALE DE DÉTAILS */}
      {selectedMovieId && (
        <MovieModal 
          movieId={selectedMovieId} 
          onClose={() => setSelectedMovieId(null)} 
        />
      )}
      
    </div>
  );
};

export default Discovery;