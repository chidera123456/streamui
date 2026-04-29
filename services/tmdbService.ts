
import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants.ts';
import { Movie, Episode, Collection } from '../types.ts';

const CACHE_KEY_PREFIX = 'zenstream-cache-';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours for better persistence

const saveToLocalStorage = (key: string, data: any) => {
  try {
    const serialized = JSON.stringify({ data, timestamp: Date.now() });
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, serialized);
  } catch {
    // Falls back to memory-only if storage is full or unavailable
  }
};

export const getFromCache = (key: string) => {
  try {
    const item = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
  } catch {
    return null;
  }
  return null;
};

const handleResponse = async (response: Response, cacheKey?: string) => {
  if (!response.ok) {
    if (cacheKey) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
    }
    throw new Error(`TMDB Request failed: ${response.status}`);
  }
  const data = await response.json();
  if (cacheKey) {
    saveToLocalStorage(cacheKey, data);
  }
  return data;
};

const secureFetch = async (url: string) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('OFFLINE');
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const fetchNowPlaying = async (): Promise<Movie[]> => {
  const cacheKey = `now-playing`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&region=US`);
    const data = await handleResponse(response, cacheKey);
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  } catch {
    return [];
  }
};

export const fetchTrending = async (type: 'movie' | 'tv' | 'all' = 'movie', page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `trending-${type}-${page}`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}&page=${page}`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: m.media_type || (type === 'all' ? 'movie' : type) })),
      totalPages: data.total_pages || 1
    };
  } catch (err: any) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchAwardWinning = async (type: 'movie' | 'tv', page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `award-winning-${type}-${page}`;
  try {
    const minVoteCount = type === 'movie' ? 1000 : 500;
    const url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&page=${page}&vote_average.gte=8&vote_count.gte=${minVoteCount}&sort_by=vote_average.desc&include_adult=false`;
    
    const response = await secureFetch(url);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchNetflixContent = async (page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `netflix-originals-${page}`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_networks=213&sort_by=popularity.desc&page=${page}`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchUpcomingMovies = async (page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `upcoming-movies-2026-${page}`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&primary_release_year=2026&sort_by=popularity.desc&include_adult=false`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchUpcomingTV = async (page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `upcoming-tv-2026-${page}`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&first_air_date_year=2026&sort_by=popularity.desc&include_adult=false`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchGenres = async (type: 'movie' | 'tv'): Promise<{ id: number, name: string }[]> => {
  const cacheKey = `genres-${type}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached.genres;

  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return data.genres || [];
  } catch (err) {
    return [];
  }
};

export const searchMedia = async (query: string, type: 'all' | 'movie' | 'tv', page: number = 1, year?: string): Promise<{ results: Movie[], totalPages: number }> => {
  try {
    if (type === 'all') {
      const response = await secureFetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
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
    const response = await secureFetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${year ? yearParam : ''}`);
    const data = await handleResponse(response);
    
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
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

    const response = await secureFetch(url);
    const data = await handleResponse(response);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return { results: [], totalPages: 0 };
  }
};

export const fetchAnime = async (page: number = 1, subGenre?: number): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `anime-${page}-${subGenre || 'all'}`;
  try {
    const genres = subGenre ? `16,${subGenre}` : '16';
    const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&with_genres=${genres}&with_original_language=ja&sort_by=popularity.desc`;
    
    const response = await secureFetch(url);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchComedyTV = async (page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `comedy-tv-${page}`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=35&sort_by=popularity.desc&page=${page}`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const fetchTopRatedTV = async (page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const cacheKey = `top-rated-tv-${page}`;
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&page=${page}`);
    const data = await handleResponse(response, cacheKey);
    return {
      results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
      totalPages: data.total_pages || 1
    };
  } catch (err) {
    return getFromCache(cacheKey) || { results: [], totalPages: 0 };
  }
};

export const getDetails = async (id: number, type: 'movie' | 'tv'): Promise<Movie> => {
  const cacheKey = `details-${type}-${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return { ...cached, media_type: type };

  const response = await secureFetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,videos,credits`);
  const data = await handleResponse(response, cacheKey);
  return { ...data, media_type: type };
};

export const fetchSimilar = async (id: number, type: 'movie' | 'tv'): Promise<Movie[]> => {
  const cacheKey = `similar-${type}-${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return (cached.results || []).map((m: any) => ({ ...m, media_type: type }));

  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return (data.results || []).map((m: any) => ({ ...m, media_type: type }));
  } catch (err) {
    return [];
  }
};

export const fetchLogos = async (id: number, type: 'movie' | 'tv'): Promise<string | null> => {
  const cacheKey = `logos-${type}-${id}`;
  const cached = getFromCache(cacheKey);

  const extractLogo = (data: any) => {
    if (data && data.logos && data.logos.length > 0) {
      const englishLogo = data.logos.find((l: any) => l.iso_639_1 === 'en');
      const logo = englishLogo || data.logos[0];
      return logo.file_path;
    }
    return null;
  };

  if (cached) return extractLogo(cached);

  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/${type}/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`);
    const data = await handleResponse(response, cacheKey);
    return extractLogo(data);
  } catch (err) {
    return null;
  }
};

export const fetchTrailer = async (id: number, type: 'movie' | 'tv'): Promise<string | null> => {
  const cacheKey = `trailer-${type}-${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    const results = data.results || [];
    
    const priorities = ['Trailer', 'Teaser', 'Clip', 'Opening Credits', 'Featurette', 'Behind the Scenes'];
    let selected = null;
    
    for (const p of priorities) {
      selected = results.find((v: any) => v.site === 'YouTube' && v.type === p);
      if (selected) break;
    }
    
    if (!selected) {
      selected = results.find((v: any) => v.site === 'YouTube');
    }

    return selected ? selected.key : null;
  } catch (err) {
    return null;
  }
};

export const getSeasonEpisodes = async (id: number, season: number): Promise<Episode[]> => {
  const cacheKey = `episodes-${id}-${season}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached.episodes || [];

  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return data.episodes || [];
  } catch (err) {
    return [];
  }
};

export const fetchCollection = async (id: number): Promise<Collection | null> => {
  const cacheKey = `collection-${id}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/collection/${id}?api_key=${TMDB_API_KEY}`);
    const data = await handleResponse(response, cacheKey);
    return data;
  } catch (err) {
    return null;
  }
};

export const findByTitle = async (title: string): Promise<Movie | null> => {
  try {
    const response = await secureFetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
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

export const isCached = (key: string): boolean => {
  return !!getFromCache(key);
};
