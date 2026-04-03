import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovies } from '../hooks/useMovies';
import MovieCarousel from '../components/MovieCarousel';
import MovieModal from '../components/MovieModal'; // Import de la surpage
import './Home.css';

// --- DONNÉES STATIQUES DU DESIGN ---
const heroMovies = [
  { title: 'Matrix', img: 'https://image.tmdb.org/t/p/original/oMsxZEvz9a708d49b6UdZK1KAo5.jpg' },
  { title: 'Gladiateur', img: 'https://image.tmdb.org/t/p/original/hND7xAaxxBgaIspp9iMsaEXOSTz.jpg' },
  { title: 'Nausicaä de la vallée du vent', img: 'https://image.tmdb.org/t/p/original/ulVUa2MvnJAjAeRt7h23FFJVRKH.jpg' },
]

const genres = [
  'Les pépites des pépites', // Toujours en premier (traité à part dans notre code)
  'Action',
  'Animation',
  'Aventure',
  'Comédie',
  'Crime',
  'Documentaire',
  'Drame',
  'Familial',
  'Fantastique',
  'Guerre',
  'Histoire',
  'Horreur',
  'Mystère',
  'Romance',
  'Science Fiction',
  'Thriller'
]

// RETOUR DES TÉMOIGNAGES COMPLETS !
const testimonials = [
  { name: 'Marie L.', avatar: '👩', note: 5, text: "J'ai découvert des films incroyables que je n'aurais jamais trouvés seule. CinéPépite c'est magique !" },
  { name: 'Thomas R.', avatar: '🧑', note: 5, text: "L'algorithme est bluffant. Il a cerné mes goûts en 3 notes. Je recommande à tous les cinéphiles !" },
  { name: 'Sofia M.', avatar: '👩‍🦱', note: 5, text: "Interface élégante et recommandations pertinentes. Enfin une appli qui sort des sentiers battus." },
  { name: 'Lucas B.', avatar: '👨', note: 5, text: "Les pépites d'horreur coréen... qui aurait cru ? Cette app change complètement ma façon de voir les films." },
  { name: 'Emma D.', avatar: '👩', note: 5, text: "Mon mec et moi on a les mêmes goûts, et pourtant on a des recommandations différentes. Génial !" },
  { name: 'Maxime T.', avatar: '🧑‍💻', note: 5, text: "Design sombre impeccable, navigation fluide, et surtout des films que personne ne connaît. Top !" },
]

const stats = [
  { value: 12000, label: 'Films', suffix: '+' },
  { value: 50000, label: 'Utilisateurs', suffix: '+' },
  { value: 1000000, label: 'Recommandations', suffix: '' },
]

// RETOUR DES FEATURES !
const features = [
  { icon: '💎', title: 'Pépites cachées', desc: 'Des films excellents que personne ne connaît encore.' },
  { icon: '⭐', title: 'Notez vos films', desc: 'Construisez votre profil cinéma film après film.' },
  { icon: '🎯', title: 'Recommandations IA', desc: "Notre algorithme apprend vos goûts et s'améliore." },
  { icon: '❤️', title: 'Vos favoris', desc: 'Sauvegardez, organisez, partagez vos coups de cœur.' },
]

// --- HOOKS D'ANIMATION ---
function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) entry.target.classList.add('visible') },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return ref
}

function AnimatedCounter({ value, suffix }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true
        let start = 0
        const step = value / (2000 / 16)
        const timer = setInterval(() => {
          start += step
          if (start >= value) { setCount(value); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 16)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  const display = value >= 1000000 ? '1M' : count >= 1000 ? `${Math.floor(count / 1000)}k` : count
  return <span ref={ref}>{display}{suffix}</span>
}

// --- COMPOSANT PRINCIPAL ---
export default function Home() {
  const navigate = useNavigate()
  
  const { getTrending, getHiddenGems, searchMovies, loading } = useMovies()
  
  // États de l'interface
  const [heroIndex, setHeroIndex] = useState(0)
  const [activeGenre, setActiveGenre] = useState('Les pépites des pépites')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // États pour la recherche
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  // États des données API
  const [trending, setTrending] = useState([])
  const [hiddenGems, setHiddenGems] = useState([])
  
  // ÉTAT POUR LA MODALE
  const [selectedMovieId, setSelectedMovieId] = useState(null)

  // Références d'animation
  const statsRef = useFadeIn()
  const moviesRef = useFadeIn()
  const trendingRef = useFadeIn()
  const featuresRef = useFadeIn()
  const testimonialsRef = useFadeIn()

  // Chargement des vrais films depuis l'API
  useEffect(() => {
    const loadData = async () => {
      const trendingData = await getTrending(20, activeGenre)
      if (trendingData) setTrending(trendingData)
      
      const hiddenGemsData = await getHiddenGems(20, activeGenre)
      if (hiddenGemsData) setHiddenGems(hiddenGemsData)
    }
    loadData()
  }, [getTrending, getHiddenGems, activeGenre])

  // Changement du fond Hero
  useEffect(() => {
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % heroMovies.length), 6500)
    return () => clearInterval(timer)
  }, [])

  // Gestion de la recherche
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setIsSearching(true);
    const results = await searchMovies(search, 20); 
    setSearchResults(results || []);
    setIsSearching(false);
    
    setTimeout(() => {
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <div className="home">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">💎</span>
          <span className="logo-text">Ciné<span className="logo-accent">Pépite</span></span>
        </div>
        <button className="burger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* HERO PANORAMA */}
      <section className="hero">
        {heroMovies.map((m, i) => (
          <div key={i} className={`hero-slide ${i === heroIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${m.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Découvrez des films<br />
            <span className="hero-accent">que vous allez adorer</span>
          </h1>
          <p className="hero-subtitle">
            CinéPépite analyse vos goûts pour révéler des pépites cinématographiques <br />
            Les meilleurs films que tout le monde rate.
          </p>
          
          <form className="search-bar" onSubmit={handleSearch}>
            <span>🔍</span>
            <input type="text" placeholder="Cherchez un film (ex: Batman)..." value={search}
              onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={isSearching}>
              {isSearching ? '...' : 'Rechercher'}
            </button>
          </form>

          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={() => navigate('/discover')}>
              Recommandation Personnalisée
            </button>
          </div>
          <div className="hero-dots">
            {heroMovies.map((_, i) => (
              <button key={i} className={`dot ${i === heroIndex ? 'active' : ''}`} onClick={() => setHeroIndex(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats fade-in" ref={statsRef}>
        {stats.map((s, i) => (
          <div key={i} className="stat-item">
            <div className="stat-value"><AnimatedCounter value={s.value} suffix={s.suffix} /></div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* RÉSULTATS DE RECHERCHE */}
      {searchResults !== null && (
        <section id="search-results" className="movies-preview fade-in visible" style={{ paddingTop: '2rem' }}>
          <h2 className="section-title">Résultats pour "{search}"</h2>
          {searchResults.length === 0 ? (
            <p className="section-sub">Aucun film trouvé pour cette recherche.</p>
          ) : (
            <MovieCarousel 
              key={`search-${search}`} 
              movies={searchResults} 
              onShowDetails={(id) => setSelectedMovieId(id)} 
            />
          )}
        </section>
      )}

      {/* SECTION PÉPITES */}
      <section className="movies-preview fade-in" ref={moviesRef}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <button 
            className={`genre-btn ${activeGenre === 'Les pépites des pépites' ? 'active' : ''}`} 
            onClick={() => setActiveGenre('Les pépites des pépites')}
            style={{ 
              padding: '0.6rem 1.8rem', 
              fontSize: '1rem',
              border: activeGenre === 'Les pépites des pépites' ? 'none' : '1px solid var(--accent)',
              color: activeGenre === 'Les pépites des pépites' ? '#000' : 'var(--accent)',
              boxShadow: activeGenre === 'Les pépites des pépites' ? '0 0 15px rgba(245, 197, 24, 0.4)' : 'none'
            }}
          >
            💎 Les pépites des pépites
          </button>
          <div className="genre-filters" style={{ marginBottom: 0 }}>
            {genres.filter(g => g !== 'Les pépites des pépites').map(g => (
              <button key={g} className={`genre-btn ${activeGenre === g ? 'active' : ''}`} onClick={() => setActiveGenre(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <h2 className="section-title">Les pépites du moment</h2>
        <p className="section-sub">Bien notés. Peu vus. Inoubliables.</p>

        {hiddenGems.length === 0 && loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Analyse des pépites en cours...</div>
        ) : (
          <MovieCarousel 
            key={`gems-${activeGenre}`} 
            movies={hiddenGems} 
            onShowDetails={(id) => setSelectedMovieId(id)} 
          />
        )}
      </section>

      {/* SECTION TRENDING */}
      <section className="movies-preview fade-in" ref={trendingRef} style={{ paddingTop: '0' }}>
        <h2 className="section-title">Films Tendances</h2>
        <p className="section-sub">Ce que tout le monde regarde en ce moment.</p>
        
        {trending.length === 0 && loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement des tendances...</div>
        ) : (
          <MovieCarousel 
            movies={trending} 
            onShowDetails={(id) => setSelectedMovieId(id)} 
          />
        )}
      </section>

      {/* FEATURES (Restauration !) */}
      <section className="features fade-in" ref={featuresRef}>
        <h2 className="section-title">Pourquoi CinéPépite ?</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TÉMOIGNAGES (Restauration !) */}
      <section className="testimonials fade-in" ref={testimonialsRef}>
        <h2 className="section-title">Ce qu'ils en disent</h2>
        <div className="testimonials-marquee">
          <div className="testimonials-track">
            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
              <div className="testimonial-card horizontal" key={i}>
                <div className="testimonial-header">
                  <span className="testimonial-avatar">{t.avatar}</span>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-stars">{'⭐'.repeat(t.note)}</div>
                  </div>
                </div>
                <p className="testimonial-text">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="logo" style={{ marginBottom: '10px' }}>
          <span className="logo-icon">💎</span>
          <span className="logo-text">Ciné<span className="logo-accent">Pépite</span></span>
        </div>
        <p>Projet Sparkle Movie · La Fine Equipe · 2026</p>
      </footer>

      {/* MODALE DE DÉTAILS */}
      {selectedMovieId && (
        <MovieModal 
          movieId={selectedMovieId} 
          onClose={() => setSelectedMovieId(null)} 
        />
      )}

    </div>
  )
}