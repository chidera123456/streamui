
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  joinedAt: string;
}

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  genres?: Array<{ id: number; name: string }>;
  genre_ids?: number[];
  runtime?: number;
  popularity: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  original_language?: string;
  external_ids?: {
    imdb_id?: string;
  };
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
}

export interface HistoryItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  media_data: Movie;
  last_watched_at: string;
  season?: number;
  episode?: number;
}

export interface Season {
  season_number: number;
  episode_count: number;
  name: string;
  poster_path: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string;
  air_date: string;
}

export interface AISuggestion {
  title: string;
  reason: string;
}

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  media_id: number;
  media_type: string;
  parent_id: string | null;
  avatar_url?: string;
  likes?: number;
  dislikes?: number;
}
