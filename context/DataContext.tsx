
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Movie } from '../types';

interface HomeData {
  trending: Movie[];
  netflix: Movie[];
  tvTrending: Movie[];
  anime: Movie[];
  awardWinning: Movie[];
  hero: Movie | null;
  loaded: boolean;
}

interface AnimePageData {
  hero: Movie | null;
  trending: Movie[];
  action: Movie[];
  fantasy: Movie[];
  loaded: boolean;
}

interface DataContextType {
  homeData: HomeData;
  setHomeData: (data: Partial<HomeData>) => void;
  animePageData: AnimePageData;
  setAnimePageData: (data: Partial<AnimePageData>) => void;
  genreMap: Record<number, string>;
  setGenreMap: (map: Record<number, string>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homeData, _setHomeData] = useState<HomeData>({
    trending: [],
    netflix: [],
    tvTrending: [],
    anime: [],
    awardWinning: [],
    hero: null,
    loaded: false,
  });

  const [animePageData, _setAnimePageData] = useState<AnimePageData>({
    hero: null,
    trending: [],
    action: [],
    fantasy: [],
    loaded: false,
  });

  const [genreMap, setGenreMap] = useState<Record<number, string>>({});

  const setHomeData = useCallback((data: Partial<HomeData>) => {
    _setHomeData(prev => ({ ...prev, ...data }));
  }, []);

  const setAnimePageData = useCallback((data: Partial<AnimePageData>) => {
    _setAnimePageData(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <DataContext.Provider value={{ 
      homeData, setHomeData, 
      animePageData, setAnimePageData,
      genreMap, setGenreMap 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
