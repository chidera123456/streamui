
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
  runtime?: number;
  popularity: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
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
