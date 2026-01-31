
import { useData } from '../context/DataContext';

export const useWatchlist = () => {
  const { watchlist, toggleWatchlist, isInWatchlist, watchlistLoading } = useData();

  return { 
    watchlist, 
    toggleWatchlist, 
    isInWatchlist, 
    loading: watchlistLoading 
  };
};
