
import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchGenres } from '../services/tmdbService';

interface GenreContextType {
  genreMap: Record<number, string>;
  getGenreNames: (ids: number[]) => string[];
}

const GenreContext = createContext<GenreContextType | undefined>(undefined);

export const GenreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          fetchGenres('movie'),
          fetchGenres('tv')
        ]);
        
        const combinedMap: Record<number, string> = {};
        movieGenres.forEach(g => combinedMap[g.id] = g.name);
        tvGenres.forEach(g => combinedMap[g.id] = g.name);
        
        setGenreMap(combinedMap);
      } catch (err) {
        console.error("Failed to load genres", err);
      }
    };

    loadGenres();
  }, []);

  const getGenreNames = (ids: number[] = []) => {
    return ids.map(id => genreMap[id]).filter(Boolean);
  };

  return (
    <GenreContext.Provider value={{ genreMap, getGenreNames }}>
      {children}
    </GenreContext.Provider>
  );
};

export const useGenres = () => {
  const context = useContext(GenreContext);
  if (!context) throw new Error('useGenres must be used within a GenreProvider');
  return context;
};
