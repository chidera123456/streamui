
import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants';
import { Movie, Episode } from '../types';

// Simple in-memory cache to speed up navigation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes cache

const handleResponse = async (response: Response, cacheKey?: string) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.error(`TMDB API Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`TMDB Request failed: ${response.status}`);
  }
  const data = await response.json();
  if (cacheKey) {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }
  return data;
};

const getFromCache = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const fetchTrending = async (type: 'movie' | 'tv' | 'all' = 'movie', page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `trending-${type}-${page}`;
  const cached = getFromCache(cacheKey);
  if (cached) return { results: cached.results.map((m: any) => ({ ...m, media_type: m.media_type || (type === 'all' ? 'movie' : type) })), totalPages: cached.total_pages };

  try {
    const response = await fetch(`${TMDB_BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}&page=${page}`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: m.media_type || (type === 'all' ? 'movie' : type) })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    console.error("fetchTrending failed", err);
    return { results: [], totalPages: 0 };
  }
};

export const fetchGenres = async (type: 'movie' | 'tv'): Promise<{ id: number, name: string }[]> => {
  const cacheKey = `genres-${type}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached.genres;

  try {
    const response = await fetch(`${TMDB_BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return data.genres || [];
  } catch (err) {
    console.error("fetchGenres failed", err);
    return [];
  }
};

export const searchMedia = async (query: string, type: 'movie' | 'tv' | 'all', page: number = 1, year?: string): Promise<{ results: Movie[], totalPages: number }> => {
  try {
    if (type === 'all') {
      const response = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
      const data = await handleResponse(response);
      
      const filteredResults = (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((m: any) => ({ ...m, media_type: m.media_type }));

      return {
        results: filteredResults,
        totalPages: data.total_pages || 1
      };
    }
    
    const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
    const yearParam = type === 'movie' ? `&primary_release_year=${year}` : `&first_air_date_year=${year}`;
    const response = await fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${year ? yearParam : ''}`);
    const data = await handleResponse(response);
    
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    console.error("searchMedia failed", err);
    return { results: [], totalPages: 0 };
  }
};

export const discoverMedia = async (type: 'movie' | 'tv', page: number = 1, filters: { genre?: number, year?: string, rating?: number, language?: string }): Promise<{ results: Movie[], totalPages: number }> => {
  try {
    let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc`;
    
    if (filters.genre) url += `&with_genres=${filters.genre}`;
    if (filters.language) url += `&with_original_language=${filters.language}`;
    if (filters.year) {
      const yearKey = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
      url += `&${yearKey}=${filters.year}`;
    }
    if (filters.rating) url += `&vote_average.gte=${filters.rating}`;

    const response = await fetch(url);
    const data = await handleResponse(response);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    console.error("discoverMedia failed", err);
    return { results: [], totalPages: 0 };
  }
};

export const fetchAnime = async (page: number = 1, subGenre?: number): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `anime-${page}-${subGenre || 'all'}`;
  const cached = getFromCache(cacheKey);
  if (cached) return { results: cached.results.map((m: any) => ({ ...m, media_type: 'tv' })), totalPages: cached.total_pages };

  try {
    const genres = subGenre ? `16,${subGenre}` : '16';
    const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&with_genres=${genres}&with_original_language=ja&sort_by=popularity.desc`;
    
    const response = await fetch(url);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    console.error("fetchAnime failed", err);
    return { results: [], totalPages: 0 };
  }
};

export const getDetails = async (id: number, type: 'movie' | 'tv'): Promise<Movie> => {
  const cacheKey = `details-${type}-${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return { ...cached, media_type: type };

  const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,videos,credits`);
  const data = await handleResponse(response, cacheKey);
  return { ...data, media_type: type };
};

export const fetchSimilar = async (id: number, type: 'movie' | 'tv'): Promise<Movie[]> => {
  const cacheKey = `similar-${type}-${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached.results.map((m: any) => ({ ...m, media_type: type }));

  try {
    const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return (data.results || []).map((m: any) => ({ ...m, media_type: type }));
  } catch (err) {
    console.error("fetchSimilar failed", err);
    return [];
  }
};

export const getSeasonEpisodes = async (id: number, season: number): Promise<Episode[]> => {
  const cacheKey = `episodes-${id}-${season}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached.episodes || [];

  try {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return data.episodes || [];
  } catch (err) {
    console.error("getSeasonEpisodes failed", err);
    return [];
  }
};

export const findByTitle = async (title: string): Promise<Movie | null> => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await handleResponse(response);
    if (data.results && data.results.length > 0) {
      const sorted = data.results
        .filter((r: any) => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'))
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
        
      const top = sorted.length > 0 ? sorted[0] : null;
      if (!top) return null;
      return { ...top, media_type: top.media_type };
    }
  } catch (err) {
    console.error("Error finding media by title:", title, err);
  }
  return null;
};
