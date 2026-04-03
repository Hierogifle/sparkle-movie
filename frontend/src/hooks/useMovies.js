import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

export const useMovies = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    setError(null);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error(`Erreur sur ${endpoint}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTrending = useCallback((limit = 20, genre = '') => {
    let url = `/movies/trending?limit=${limit}`;
    // On ajoute notre nouveau nom aux exceptions
    if (genre && genre !== 'Tous' && genre !== 'Les pépites des pépites') {
        url += `&genre=${encodeURIComponent(genre)}`;
    }
    return fetchData(url);
  }, [fetchData]);

  const getHiddenGems = useCallback((limit = 20, genre = '') => {
    let url = `/movies/hidden-gems?limit=${limit}`;
    // On ajoute notre nouveau nom aux exceptions
    if (genre && genre !== 'Tous' && genre !== 'Les pépites des pépites') {
        url += `&genre=${encodeURIComponent(genre)}`;
    }
    return fetchData(url);
  }, [fetchData]);

  const searchMovies = useCallback((q, limit = 20) => fetchData(`/movies/search?q=${q}&limit=${limit}`), [fetchData]);
  const getMovieDetail = useCallback((id) => fetchData(`/movies/${id}`), [fetchData]);
  
  const getPersonalRecs = useCallback((movieIds) => 
    fetchData('/recommendations/personal', 'POST', { movie_ids: movieIds }), [fetchData]);
    
  const getChangeOfAirRecs = useCallback((movieIds) => 
    fetchData('/recommendations/change-of-air', 'POST', { movie_ids: movieIds }), [fetchData]);
  
  const getMovieById = useCallback(async (id) => {
  return await fetchData(`/movies/${id}`); // Appelle l'endpoint GET /api/movies/{id}
  }, [fetchData]);

  return {
    loading,
    error,
    getTrending,
    getHiddenGems,
    searchMovies,
    getMovieDetail,
    getPersonalRecs,
    getChangeOfAirRecs,
    getMovieById
  };
};
