
import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants';
import { Movie, Episode } from '../types';

export const fetchTrending = async (type: 'movie' | 'tv' | 'all' = 'movie', page: number = 1): Promise<{ results: Movie[], totalPages: number }> => {
  const response = await fetch(`${TMDB_BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}&page=${page}`);
  const data = await response.json();
  return {
    results: (data.results || []).map((m: any) => ({ ...m, media_type: m.media_type || type })),
    totalPages: data.total_pages || 1
  };
};

export const fetchGenres = async (type: 'movie' | 'tv'): Promise<{ id: number, name: string }[]> => {
  const response = await fetch(`${TMDB_BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}`);
  const data = await response.json();
  return data.genres || [];
};

export const searchMedia = async (query: string, type: 'movie' | 'tv' | 'all', page: number = 1, year?: string): Promise<{ results: Movie[], totalPages: number }> => {
  if (type === 'all') {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${year ? `&primary_release_year=${year}` : ''}`),
      fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${year ? `&first_air_date_year=${year}` : ''}`)
    ]);
    const movieData = await movieRes.json();
    const tvData = await tvRes.json();
    
    const combinedResults = [
      ...(movieData.results || []).map((m: any) => ({ ...m, media_type: 'movie' })),
      ...(tvData.results || []).map((t: any) => ({ ...t, media_type: 'tv' }))
    ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return {
      results: combinedResults,
      totalPages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1)
    };
  }
  
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
  const yearParam = type === 'movie' ? `&primary_release_year=${year}` : `&first_air_date_year=${year}`;
  const response = await fetch(`${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}${year ? yearParam : ''}`);
  const data = await response.json();
  return {
    results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
    totalPages: data.total_pages || 1
  };
};

export const discoverMedia = async (type: 'movie' | 'tv', page: number = 1, filters: { genre?: number, year?: string, rating?: number, language?: string }): Promise<{ results: Movie[], totalPages: number }> => {
  let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc`;
  
  if (filters.genre) url += `&with_genres=${filters.genre}`;
  if (filters.language) url += `&with_original_language=${filters.language}`;
  if (filters.year) {
    const yearKey = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    url += `&${yearKey}=${filters.year}`;
  }
  if (filters.rating) url += `&vote_average.gte=${filters.rating}`;

  const response = await fetch(url);
  const data = await response.json();
  return {
    results: (data.results || []).map((m: any) => ({ ...m, media_type: type })),
    totalPages: data.total_pages || 1
  };
};

export const fetchAnime = async (page: number = 1, subGenre?: number): Promise<{ results: Movie[], totalPages: number }> => {
  // Genre 16 is Animation. Original language 'ja' filters for Japanese Anime.
  // Correctly append subGenre to the with_genres parameter.
  const genres = subGenre ? `16,${subGenre}` : '16';
  const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&with_genres=${genres}&with_original_language=ja&sort_by=popularity.desc`;
  
  const response = await fetch(url);
  const data = await response.json();
  return {
    results: (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' })),
    totalPages: data.total_pages || 1
  };
};

export const getDetails = async (id: number, type: 'movie' | 'tv'): Promise<Movie> => {
  const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,videos,credits`);
  const data = await response.json();
  return { ...data, media_type: type };
};

export const getSeasonEpisodes = async (id: number, season: number): Promise<Episode[]> => {
  const response = await fetch(`${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}`);
  const data = await response.json();
  return data.episodes || [];
};

export const findByTitle = async (title: string): Promise<Movie | null> => {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const sorted = data.results
        .filter((r: any) => r.poster_path)
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
        
      const top = sorted.length > 0 ? sorted[0] : data.results[0];
      return { ...top, media_type: top.media_type };
    }
  } catch (err) {
    console.error("Error finding media by title:", title, err);
  }
  return null;
};
