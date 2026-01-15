
import { useState, useEffect, useCallback } from 'react';
import { Movie, HistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const STORAGE_KEY = 'zenstream_watch_history_v2';
const MAX_HISTORY = 20;

export const useHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setHistory(JSON.parse(stored));
        } catch (e) {
          setHistory([]);
        }
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(MAX_HISTORY);

      if (error) throw error;
      
      // Transform Supabase data to HistoryItem type
      const items: HistoryItem[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        media_id: item.media_id,
        media_type: item.media_type,
        media_data: item.media_data as Movie,
        last_watched_at: item.last_watched_at,
        season: item.season,
        episode: item.episode
      }));
      
      setHistory(items);
    } catch (err) {
      console.error("Failed to fetch cloud history:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addToHistory = async (movie: Movie, season?: number, episode?: number) => {
    const now = new Date().toISOString();

    // 1. Optimistic UI update
    setHistory(prev => {
      const filtered = prev.filter(h => h.media_id !== movie.id);
      const newItem: HistoryItem = {
        id: `temp-${movie.id}-${Date.now()}`,
        user_id: user?.id || 'local-user',
        media_id: movie.id,
        media_type: movie.media_type,
        media_data: movie,
        last_watched_at: now,
        season,
        episode
      };
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      if (!user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // 2. Cloud Sync
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

        if (error) console.error("Sync history failed:", error.message);
      } catch (err) {
        console.error("Critical history sync error:", err);
      }
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      try {
        const { error } = await supabase
          .from('watch_history')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Failed to clear cloud history:", err);
        fetchHistory(); // Revert on failure
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
