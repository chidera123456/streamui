
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { Movie, HistoryItem, Notification } from '../types';
import { fetchNowPlaying } from '../services/tmdbService';
import { IMG_URL } from '../constants';

interface DataContextType {
  watchlist: Movie[];
  history: HistoryItem[];
  notifications: Notification[];
  watchlistLoading: boolean;
  historyLoading: boolean;
  toggleWatchlist: (movie: Movie) => Promise<void>;
  addToHistory: (movie: Movie, season?: number, episode?: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  isInWatchlist: (id: number) => boolean;
  markNotificationsAsRead: () => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const WATCHLIST_CACHE_KEY = 'zenstream_watchlist_v4';
const HISTORY_CACHE_KEY = 'zenstream_history_v4';
const NOTIFICATIONS_CACHE_KEY = 'zenstream_notifs_v1';
const MAX_HISTORY = 20;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [watchlist, setWatchlist] = useState<Movie[]>(() => {
    const cached = localStorage.getItem(WATCHLIST_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const cached = localStorage.getItem(HISTORY_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const cached = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Automated notification generation logic
  useEffect(() => {
    const generateNotifications = async () => {
      // 1. App Tips (if empty or periodically)
      const tips: Notification[] = [
        {
          id: 'tip-sleep-timer',
          type: 'tip',
          title: 'Pro Tip: Sleep Timer',
          message: 'Did you know you can set a sleep timer in the player? Click the moon icon to try it out.',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: '/'
        },
        {
          id: 'tip-ai-discovery',
          type: 'tip',
          title: 'Explore AI Discovery',
          message: 'Having trouble choosing? Describe your mood in the AI Discovery section for personalized picks.',
          timestamp: new Date().toISOString(),
          isRead: false,
          link: '/ai-discovery'
        }
      ];

      // 2. Fresh Releases from TMDB
      const nowPlaying = await fetchNowPlaying();
      const movieNotifications: Notification[] = nowPlaying.slice(0, 3).map(m => ({
        id: `release-${m.id}`,
        type: 'release',
        title: `Now Playing: ${m.title}`,
        message: `${m.title} is now streaming in theaters and on platforms. Check it out!`,
        timestamp: new Date().toISOString(),
        isRead: false,
        image: `${IMG_URL}${m.poster_path}`,
        link: `/details/movie/${m.id}`
      }));

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newNotifs = [...movieNotifications, ...tips].filter(n => !existingIds.has(n.id));
        if (newNotifs.length === 0) return prev;
        return [...newNotifs, ...prev].slice(0, 15);
      });
    };

    generateNotifications();
  }, []);

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

  useEffect(() => {
    if (user) {
      refreshData();
      
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
    }
  }, [user, fetchWatchlist, fetchHistory, refreshData]);

  const toggleWatchlist = async (movie: Movie) => {
    const exists = watchlist.find(m => m.id === movie.id);
    
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

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const isInWatchlist = (id: number) => watchlist.some(m => m.id === id);

  return (
    <DataContext.Provider value={{ 
      watchlist, history, notifications, watchlistLoading, historyLoading, 
      toggleWatchlist, addToHistory, clearHistory, isInWatchlist, markNotificationsAsRead, refreshData 
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
