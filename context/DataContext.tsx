
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Movie, HistoryItem } from '../types';

interface DataContextType {
  watchlist: Movie[];
  history: HistoryItem[];
  watchlistLoading: boolean;
  historyLoading: boolean;
  toggleWatchlist: (movie: Movie) => Promise<void>;
  addToHistory: (movie: Movie, season?: number, episode?: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  isInWatchlist: (id: number) => boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const WATCHLIST_CACHE_KEY = 'zenstream_watchlist_v4';
const HISTORY_CACHE_KEY = 'zenstream_history_v4';
const MAX_HISTORY = 20;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Local-First State: Initialize from localStorage for zero-latency startup
  const [watchlist, setWatchlist] = useState<Movie[]>(() => {
    const cached = localStorage.getItem(WATCHLIST_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const cached = localStorage.getItem(HISTORY_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Persistence: Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(history));
  }, [history]);

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('media_data')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        const cloudMovies = data.map(item => item.media_data as Movie).filter(Boolean);
        setWatchlist(cloudMovies);
      }
    } catch (err) {
      console.debug("Watchlist background sync failed");
    }
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(MAX_HISTORY);

      if (error) throw error;
      if (data) {
        const cloudItems: HistoryItem[] = data.map(item => ({
          ...item,
          media_data: item.media_data as Movie
        }));
        setHistory(cloudItems);
      }
    } catch (err) {
      console.debug("History background sync failed");
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setWatchlistLoading(true);
    setHistoryLoading(true);
    await Promise.all([fetchWatchlist(), fetchHistory()]);
    setWatchlistLoading(false);
    setHistoryLoading(false);
  }, [user, fetchWatchlist, fetchHistory]);

  // Sync on Login/User Change
  useEffect(() => {
    if (user) {
      refreshData();
      
      // Real-time subscriptions for cross-device sync
      const watchlistChannel = supabase.channel(`public:watchlist:user=${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'watchlist', filter: `user_id=eq.${user.id}` }, fetchWatchlist)
        .subscribe();
        
      const historyChannel = supabase.channel(`public:watch_history:user=${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'watch_history', filter: `user_id=eq.${user.id}` }, fetchHistory)
        .subscribe();

      return () => {
        supabase.removeChannel(watchlistChannel);
        supabase.removeChannel(historyChannel);
      };
    } else {
      // If user logs out, clear state (but keep local storage for guest if you want, or clear it)
      // For now, keep local for guest experience
    }
  }, [user, fetchWatchlist, fetchHistory, refreshData]);

  const toggleWatchlist = async (movie: Movie) => {
    const exists = watchlist.find(m => m.id === movie.id);
    
    // Optimistic Update
    if (exists) {
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    } else {
      setWatchlist(prev => [...prev, movie]);
    }

    if (!user) return;

    try {
      if (exists) {
        await supabase.from('watchlist').delete().eq('user_id', user.id).eq('media_id', movie.id);
      } else {
        await supabase.from('watchlist').insert({
          user_id: user.id,
          media_id: movie.id,
          media_type: movie.media_type,
          media_data: movie
        });
      }
    } catch (err) {
      // Revert on failure
      if (exists) setWatchlist(prev => [...prev, movie]);
      else setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    }
  };

  const addToHistory = async (movie: Movie, season?: number, episode?: number) => {
    const now = new Date().toISOString();
    const newItem: HistoryItem = {
      id: `local-${movie.id}-${Date.now()}`,
      user_id: user?.id || 'local-user',
      media_id: movie.id,
      media_type: movie.media_type,
      media_data: movie,
      last_watched_at: now,
      season,
      episode
    };

    // Optimistic Update
    setHistory(prev => {
      const filtered = prev.filter(h => h.media_id !== movie.id);
      return [newItem, ...filtered].slice(0, MAX_HISTORY);
    });

    if (!user) return;

    try {
      await supabase.from('watch_history').upsert({
        user_id: user.id,
        media_id: movie.id,
        media_type: movie.media_type,
        media_data: movie,
        last_watched_at: now,
        season,
        episode
      }, { onConflict: 'user_id, media_id' });
    } catch (err) {
      console.debug("History sync error");
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    if (user) {
      await supabase.from('watch_history').delete().eq('user_id', user.id);
    }
  };

  const isInWatchlist = (id: number) => watchlist.some(m => m.id === id);

  return (
    <DataContext.Provider value={{ 
      watchlist, history, watchlistLoading, historyLoading, 
      toggleWatchlist, addToHistory, clearHistory, isInWatchlist, refreshData 
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
