import { useState, useEffect, useRef } from 'react'
import './Home.css'

const heroMovies = [
  { title: 'Matrix', img: 'https://image.tmdb.org/t/p/original/oMsxZEvz9a708d49b6UdZK1KAo5.jpg' },
  { title: 'Gladiateur', img: 'https://image.tmdb.org/t/p/original/hND7xAaxxBgaIspp9iMsaEXOSTz.jpg' },
  { title: 'Nausicaä de la vallée du vent', img: 'https://image.tmdb.org/t/p/original/ulVUa2MvnJAjAeRt7h23FFJVRKH.jpg' },
]

const allMovies = [
  { title: 'The Lighthouse', year: 2019, score: 9.1, genre: 'Drame', pepite: true },
  { title: 'Coherence', year: 2013, score: 8.7, genre: 'Sci-Fi', pepite: true },
  { title: 'A Ghost Story', year: 2017, score: 8.4, genre: 'Drame', pepite: false },
  { title: 'Possessor', year: 2020, score: 8.9, genre: 'Thriller', pepite: true },
  { title: 'The Wailing', year: 2016, score: 9.3, genre: 'Horreur', pepite: true },
  { title: 'Enemy', year: 2013, score: 8.5, genre: 'Thriller', pepite: false },
  { title: 'Annihilation', year: 2018, score: 8.8, genre: 'Sci-Fi', pepite: true },
  { title: 'Midsommar', year: 2019, score: 8.6, genre: 'Horreur', pepite: false },
]

const genres = ['Tous', 'Drame', 'Sci-Fi', 'Thriller', 'Horreur']

const testimonials = [
  { name: 'Marie L.', avatar: '👩', note: 5, text: "J'ai découvert des films incroyables que je n'aurais jamais trouvés seule. CinéPépite c'est magique !" },
  { name: 'Thomas R.', avatar: '🧑', note: 5, text: "L'algorithme est bluffant. Il a cerné mes goûts en 3 notes. Je recommande à tous les cinéphiles !" },
  { name: 'Sofia M.', avatar: '👩‍🦱', note: 5, text: "Interface élégante et recommandations pertinentes. Enfin une appli qui sort des sentiers battus." },
  { name: 'Lucas B.', avatar: '👨', note: 5, text: "Les pépites d'horreur coréen... qui aurait cru ? Cette app change complètement ma façon de voir les films." },
  { name: 'Emma D.', avatar: '👩', note: 5, text: "Mon mec et moi on a les mêmes goûts, et pourtant on a des recommandations différentes. Génial !" },
  { name: 'Julien P.', avatar: '🧔', note: 5, text: "J'ai retrouvé des films d'animation japonais des années 80 que j'adorais gamin. Nostalgie garantie." },
  { name: 'Camille V.', avatar: '👩‍🦰', note: 5, text: "Enfin une app qui me propose pas toujours les mêmes blockbusters. Du vrai cinéma indépendant." },
  { name: 'Antoine G.', avatar: '👨‍💼', note: 5, text: "Parfait pour les soirées solo. Je teste un film inconnu tous les vendredis maintenant." },
  { name: 'Léa S.', avatar: '👩‍🎤', note: 5, text: "Les recommandations évoluent avec le temps. Plus je note, plus c'est précis. Impressionnant." },
  { name: 'Maxime T.', avatar: '🧑‍💻', note: 5, text: "Design sombre impeccable, navigation fluide, et surtout des films que personne ne connaît. Top !" },
]

const stats = [
  { value: 12000, label: 'Films', suffix: '+' },
  { value: 50000, label: 'Utilisateurs', suffix: '+' },
  { value: 1000000, label: 'Recommandations', suffix: '' },
]

const features = [
  { icon: '💎', title: 'Pépites cachées', desc: 'Des films excellents que personne ne connaît encore.' },
  { icon: '⭐', title: 'Notez vos films', desc: 'Construisez votre profil cinéma film après film.' },
  { icon: '🎯', title: 'Recommandations IA', desc: "Notre algorithme apprend vos goûts et s'améliore." },
  { icon: '❤️', title: 'Vos favoris', desc: 'Sauvegardez, organisez, partagez vos coups de cœur.' },
]

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


export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0)
  const [activeGenre, setActiveGenre] = useState('Tous')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const statsRef = useFadeIn()
  const moviesRef = useFadeIn()
  const featuresRef = useFadeIn()
  const testimonialsRef = useFadeIn()

  useEffect(() => {
    const timer = setInterval(() => setHeroIndex(i => (i + 1) % heroMovies.length), 6500)
    return () => clearInterval(timer)
  }, [])

  const filteredMovies = allMovies.filter(m => {
    const matchGenre = activeGenre === 'Tous' || m.genre === activeGenre
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
    return matchGenre && matchSearch
  })

  return (
    <div className="home">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">💎</span>
          <span className="logo-text">Ciné<span className="logo-accent">Pépite</span></span>
        </div>
        <div className="nav-buttons">
          <button className="btn-ghost">Se connecter</button>
          <button className="btn-primary">S'inscrire</button>
        </div>
        <button className="burger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* HERO */}
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
            CinéPépite analyse vos goûts pour révéler des pépites cinématographiques
            — les films excellents que tout le monde rate.
          </p>
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Cherchez un film..." value={search}
              onChange={e => setSearch(e.target.value)} />
            <button className="btn-primary">Rechercher</button>
          </div>
          <div className="hero-cta">
            <button className="btn-primary btn-large">Recommandation Personnalisée</button>
            <button className="btn-ghost btn-large">Voir les pépites →</button>
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

      {/* FILMS */}
      <section className="movies-preview fade-in" ref={moviesRef}>
        <h2 className="section-title">Les pépites du moment</h2>
        <p className="section-sub">Bien notés. Peu vus. Inoubliables.</p>
        <div className="genre-filters">
          {genres.map(g => (
            <button key={g} className={`genre-btn ${activeGenre === g ? 'active' : ''}`} onClick={() => setActiveGenre(g)}>{g}</button>
          ))}
        </div>
        <div className="movies-grid">
          {filteredMovies.map((movie, i) => (
            <div className="movie-card" key={i}>
              {movie.pepite && <div className="pepite-badge">💎 Pépite</div>}
              <div className="movie-poster"><span className="movie-emoji">🎬</span></div>
              <div className="movie-info">
                <span className="movie-genre">{movie.genre}</span>
                <h3 className="movie-title">{movie.title}</h3>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${(movie.score / 10) * 100}%` }} />
                </div>
                <div className="movie-footer">
                  <span className="movie-year">{movie.year}</span>
                  <span className="movie-score">{movie.score}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
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

      {/* TÉMOIGNAGES */}
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

      {/* CTA */}
      <section className="cta-section">
        <h2>Prêt à découvrir votre prochaine pépite ?</h2>
        <button className="btn-primary btn-large">Créer mon compte</button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span className="logo-icon">💎</span>
        <span className="logo-text">Ciné<span className="logo-accent">Pépite</span></span>
        <p>Projet Sparkle Movie · La Fine Equipe · 2026</p>
      </footer>

    </div>
  )
}
