
import { useState, useEffect, useCallback } from 'react';
import { Movie, HistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const HISTORY_CACHE_KEY = 'zenstream_history_cache_v3';
const MAX_HISTORY = 20;

export const useHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    // Immediate load from local cache
    const cached = localStorage.getItem(HISTORY_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);

  // Persistence effect
  useEffect(() => {
    localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(history));
  }, [history]);

  const fetchHistory = useCallback(async (isMounted: boolean = true) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(MAX_HISTORY);

      if (!isMounted) return;

      if (error) {
        if (error.message?.includes('aborted') || error.name === 'AbortError') return;
        throw error;
      }
      
      const cloudItems: HistoryItem[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        media_id: item.media_id,
        media_type: item.media_type,
        media_data: item.media_data as Movie,
        last_watched_at: item.last_watched_at,
        season: item.season,
        episode: item.episode
      }));
      
      // Update local state if cloud data differs
      if (JSON.stringify(cloudItems) !== JSON.stringify(history)) {
        setHistory(cloudItems);
      }
    } catch (err: any) {
      if (!isMounted) return;
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('Failed to fetch')) return;
      console.error("Failed to fetch cloud history:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  }, [user, history]);

  useEffect(() => {
    let isMounted = true;
    fetchHistory(isMounted);
    
    // Subscribe to realtime history updates
    let channel: any;
    if (user) {
      channel = supabase.channel(`public:watch_history:user=${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'watch_history',
          filter: `user_id=eq.${user.id}`
        }, () => isMounted && fetchHistory(isMounted))
        .subscribe();
    }
    
    return () => { 
      isMounted = false;
      if (channel) supabase.removeChannel(channel); 
    };
  }, [user, fetchHistory]);

  const addToHistory = async (movie: Movie, season?: number, episode?: number) => {
    const now = new Date().toISOString();

    // Optimistic UI update: Immediate feedback
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

    if (user) {
      try {
        const { error } = await supabase
          .from('watch_history')
          .upsert({
            user_id: user.id,
            media_id: movie.id,
            media_type: movie.media_type,
            media_data: movie,
            last_watched_at: now,
            season,
            episode
          }, { 
            onConflict: 'user_id, media_id' 
          });

        if (error) console.error("Cloud sync history failed:", error.message);
      } catch (err) {
        console.error("Critical history sync error:", err);
      }
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    if (!user) {
      localStorage.removeItem(HISTORY_CACHE_KEY);
    } else {
      try {
        await supabase.from('watch_history').delete().eq('user_id', user.id);
      } catch (err) {
        console.error("Failed to clear cloud history:", err);
      }
    }
  };

  return { 
    history, 
    addToHistory, 
    clearHistory, 
    loading 
  };
};
