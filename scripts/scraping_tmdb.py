import os
import re
import json
import asyncio
import aiohttp
import logging
import pandas as pd
from pathlib import Path
from tqdm.asyncio import tqdm_asyncio
from dotenv import load_dotenv

load_dotenv()

# ── Logger ────────────────────────────────────────────────────────────────────
Path("../logs").mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("../logs/scraping.log", encoding="utf-8")
    ]
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
TMDB_API_KEY   = os.getenv("TMDB_API_KEY")
DATA_ENRICHED  = Path("../data/enriched")
CACHE_FILE     = DATA_ENRICHED / "tmdb_cache.json"
OUTPUT_PARQUET = DATA_ENRICHED / "tmdb_metadata.parquet"
MAX_CONCURRENT = 50
SAVE_EVERY     = 500

assert TMDB_API_KEY, "⚠️  Variable TMDB_API_KEY non définie !"

# ── Cache ─────────────────────────────────────────────────────────────────────
def load_cache() -> dict:
    if CACHE_FILE.exists():
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_cache(cache: dict):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)

# ── Chargement des tmdbIds ────────────────────────────────────────────────────
def load_tmdb_ids() -> list:
    links = pd.read_parquet(DATA_ENRICHED / "links.parquet")
    ids   = links["tmdbId"].dropna().astype(int).unique().tolist()
    log.info(f"Films à scrapper : {len(ids):,}")
    return ids

# ── Chargement des films manquants ───────────────────────────────────────────
def load_missing() -> list:
    missing_file = DATA_ENRICHED / "missing_tmdb.csv"
    if not missing_file.exists():
        log.warning("Pas de fichier missing_tmdb.csv trouvé")
        return []
    missing = pd.read_csv(missing_file)
    log.info(f"Films manquants à rechercher : {len(missing):,}")
    return missing.to_dict("records")

# ── Extraction certification ──────────────────────────────────────────────────
def extract_certification(d: dict, country: str) -> str:
    for entry in d.get("release_dates", {}).get("results", []):
        if entry["iso_3166_1"] == country:
            releases = entry.get("release_dates", [])
            if releases:
                return releases[0].get("certification", "") or ""
    return ""

# ── Construction du record ────────────────────────────────────────────────────
def build_record(d: dict, tmdb_id: int, media_type: str) -> dict:
    """Extrait tous les champs utiles d'une réponse TMDB."""
    crew     = d.get("credits", {}).get("crew", [])
    cast     = d.get("credits", {}).get("cast", [])
    keywords = d.get("keywords", {}).get("keywords", [])

    directors        = [c["name"] for c in crew if c["job"] == "Director"]
    writers          = [c["name"] for c in crew if c["job"] in ("Screenplay", "Writer", "Story")]
    composers        = [c["name"] for c in crew if c["job"] == "Original Music Composer"]
    producers        = [c["name"] for c in crew if c["job"] == "Producer"]
    cinematographers = [c["name"] for c in crew if c["job"] == "Director of Photography"]

    collection  = d.get("belongs_to_collection")
    similar     = d.get("similar", {}).get("results", [])
    recommended = d.get("recommendations", {}).get("results", [])
    runtime     = d.get("runtime") or (d.get("episode_run_time") or [None])[0]

    return {
        # ── Identifiants ──────────────────────────────────────────────────
        "tmdbId":           tmdb_id,
        "imdb_id":          d.get("external_ids", {}).get("imdb_id"),
        "media_type":       media_type,
        # ── Titres ────────────────────────────────────────────────────────
        "title_fr":         d.get("title") or d.get("name"),
        "original_title":   d.get("original_title") or d.get("original_name"),
        "tagline":          d.get("tagline"),
        # ── Description ───────────────────────────────────────────────────
        "overview":         d.get("overview"),
        "keywords":         "|".join([k["name"] for k in keywords[:20]]),
        # ── Dates & durée ─────────────────────────────────────────────────
        "release_date":     d.get("release_date") or d.get("first_air_date"),
        "runtime":          runtime,
        "status":           d.get("status"),
        "adult":            d.get("adult", False),
        # ── Langue & pays ─────────────────────────────────────────────────
        "original_lang":    d.get("original_language"),
        "origin_countries": "|".join(d.get("origin_country", [])),
        "prod_countries":   "|".join([c["iso_3166_1"] for c in d.get("production_countries", [])]),
        "spoken_languages": "|".join([l["iso_639_1"] for l in d.get("spoken_languages", [])]),
        # ── Financier ─────────────────────────────────────────────────────
        "budget":           d.get("budget"),
        "revenue":          d.get("revenue"),
        # ── Popularité ────────────────────────────────────────────────────
        "vote_average":     d.get("vote_average"),
        "vote_count":       d.get("vote_count"),
        "popularity":       d.get("popularity"),
        # ── Genres ────────────────────────────────────────────────────────
        "genres_tmdb":      "|".join([g["name"] for g in d.get("genres", [])]),
        # ── Équipe ────────────────────────────────────────────────────────
        "directors":        "|".join(directors),
        "writers":          "|".join(writers[:3]),
        "composers":        "|".join(composers[:2]),
        "producers":        "|".join(producers[:2]),
        "cinematographer":  "|".join(cinematographers[:1]),
        "cast_top10":       "|".join([c["name"] for c in cast[:10]]),
        "cast_characters":  "|".join([c["character"] for c in cast[:10]]),
        # ── Production ────────────────────────────────────────────────────
        "studios":          "|".join([p["name"] for p in d.get("production_companies", [])]),
        "collection":       collection["name"] if collection else None,
        "collection_id":    collection["id"]   if collection else None,
        # ── Certification ─────────────────────────────────────────────────
        "certification_us": extract_certification(d, "US"),
        "certification_fr": extract_certification(d, "FR"),
        # ── Similarité TMDB ───────────────────────────────────────────────
        "similar_ids":      "|".join([str(m["id"]) for m in similar[:10]]),
        "recommended_ids":  "|".join([str(m["id"]) for m in recommended[:10]]),
        # ── Images ────────────────────────────────────────────────────────
        "poster_path":      d.get("poster_path"),
        "backdrop_path":    d.get("backdrop_path"),
    }

# ── Fetch par ID (movie + fallback tv) ───────────────────────────────────────
async def fetch_tmdb(session, semaphore, tmdb_id, cache):
    key = str(tmdb_id)
    if key in cache:
        return cache[key]

    for media_type in ["movie", "tv"]:
        url    = f"https://api.themoviedb.org/3/{media_type}/{tmdb_id}"
        params = {
            "api_key":            TMDB_API_KEY,
            "language":           "fr-FR",
            "append_to_response": "credits,keywords,external_ids,similar,recommendations,release_dates"
        }

        # ── Retry sur erreur réseau (max 3 tentatives) ────────────────────
        for attempt in range(3):
            async with semaphore:
                try:
                    async with session.get(url, params=params,
                                           timeout=aiohttp.ClientTimeout(total=15)) as r:
                        if r.status == 404:
                            break                       # inutile de retry un 404
                        if r.status == 429:
                            log.warning(f"Rate limit (tmdb_id={tmdb_id}), pause 10s...")
                            await asyncio.sleep(10)
                            continue
                        if r.status != 200:
                            break

                        d = await r.json()
                        record = build_record(d, tmdb_id, media_type)
                        cache[key] = record
                        return record

                except aiohttp.ClientConnectorError as e:
                    # Erreur réseau / DNS → on attend et on réessaie
                    wait = 2 ** attempt          # 1s, 2s, 4s
                    log.warning(f"Erreur réseau tmdb_id={tmdb_id} "
                                f"(tentative {attempt+1}/3), retry dans {wait}s: {e}")
                    await asyncio.sleep(wait)

                except Exception as e:
                    log.error(f"Erreur {media_type} tmdb_id={tmdb_id}: {e}")
                    break                        # erreur inconnue → on passe

    cache[key] = None
    return None


# ── Fetch par recherche titre + année ────────────────────────────────────────
async def fetch_tmdb_by_search(session, semaphore, movie: dict, cache: dict) -> dict | None:
    title_raw = movie.get("title", "")
    match     = re.search(r"^(.*?)\s*\((\d{4})\)$", title_raw)
    if not match:
        return None

    title_clean = match.group(1).strip()
    year        = match.group(2)
    results     = []

    # ── Sémaphore uniquement pour la recherche ────────────────────────────
    async with semaphore:
        try:
            for attempt_params in [
                {"api_key": TMDB_API_KEY, "query": title_clean, "year": year, "language": "fr-FR"},
                {"api_key": TMDB_API_KEY, "query": title_clean,               "language": "fr-FR"},
            ]:
                async with session.get(
                    "https://api.themoviedb.org/3/search/movie",
                    params=attempt_params,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as r:
                    if r.status == 200:
                        results = (await r.json()).get("results", [])
                        if results:
                            break
        except Exception as e:
            log.error(f"Erreur search '{title_clean}': {e}")
            return None

    # ── fetch_tmdb HORS du sémaphore → plus de deadlock ───────────────────
    if not results:
        log.warning(f"Introuvable via search : '{title_clean}' ({year})")
        cache[str(movie["tmdbId"])] = None
        return None

    real_tmdb_id  = results[0]["id"]
    original_id   = movie["tmdbId"]
    log.info(f"✅ Retrouvé : '{title_clean}' ({year}) "
             f"| ancien ID {original_id} → nouveau ID {real_tmdb_id}")

    # ── Récupère les données avec le vrai ID ──────────────────────────────
    record = await fetch_tmdb(session, semaphore, real_tmdb_id, cache)

    # ── Réindexe sous l'ID original (celui de links.parquet) ─────────────
    if record and real_tmdb_id != original_id:
        cache.pop(str(real_tmdb_id), None)          # supprime le nouveau ID
        record = dict(record)                        # copie pour ne pas muter
        record["real_tmdb_id"] = real_tmdb_id        # conserve le vrai ID TMDB
        record["tmdbId"]       = original_id         # restaure l'ID de links
        cache[str(original_id)] = record             # stocke sous l'ID original

    return record

# ── Pipeline principal ────────────────────────────────────────────────────────
async def run_scraping_async(tmdb_ids: list) -> list:
    cache     = load_cache()
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    ids_todo  = [i for i in tmdb_ids if str(i) not in cache]
    already   = len(tmdb_ids) - len(ids_todo)
    log.info(f"Total      : {len(tmdb_ids):,}")
    log.info(f"En cache   : {already:,}")
    log.info(f"À scrapper : {len(ids_todo):,}")

    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT)
    nb_errors = 0

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_tmdb(session, semaphore, tid, cache) for tid in ids_todo]
        for i, coro in enumerate(tqdm_asyncio.as_completed(tasks, desc="[1/2] Scraping TMDB")):
            result = await coro
            if result is None:
                nb_errors += 1
            if i % 1000 == 0 and i > 0:
                pct      = i / len(ids_todo) * 100
                in_cache = sum(1 for v in cache.values() if v is not None)
                log.info(f"Progression : {i:,}/{len(ids_todo):,} ({pct:.1f}%) "
                         f"— OK: {in_cache:,} — Erreurs: {nb_errors:,}")
            if i % SAVE_EVERY == 0 and i > 0:
                save_cache(cache)
                log.info(f"Cache sauvegardé ({i:,} traités)")

    save_cache(cache)
    log.info(f"✅ Phase 1 terminée : {nb_errors:,} films non trouvés par ID direct")
    return cache

# ── Pipeline de récupération par search ──────────────────────────────────────
async def run_recovery_async(missing: list, cache: dict) -> dict:
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT)
    found = 0

    log.info(f"[2/2] Recherche par titre pour {len(missing):,} films manquants...")

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [
            fetch_tmdb_by_search(session, semaphore, movie, cache)
            for movie in missing
        ]
        for coro in tqdm_asyncio.as_completed(tasks, desc="[2/2] Search TMDB"):
            result = await coro
            if result:
                found += 1

    save_cache(cache)
    log.info(f"✅ Phase 2 terminée : {found:,}/{len(missing):,} films récupérés via search")
    return cache

# ── Sauvegarde Parquet ────────────────────────────────────────────────────────
def save_parquet(cache: dict):
    results = [v for v in cache.values() if v is not None]
    df      = pd.DataFrame(results)
    df.to_parquet(OUTPUT_PARQUET, index=False)
    log.info(f"💾 Sauvegardé → {OUTPUT_PARQUET}")
    log.info(f"   {len(df):,} lignes, {len(df.columns)} colonnes")

# ── Point d'entrée ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Phase 1 : scraping par ID (movie + fallback tv)
    tmdb_ids = load_tmdb_ids()
    cache    = asyncio.run(run_scraping_async(tmdb_ids))

    # Phase 2 : récupération des manquants par recherche titre+année
    missing = load_missing()
    if missing:
        cache = asyncio.run(run_recovery_async(missing, cache))

    # Sauvegarde finale
    save_parquet(cache)
