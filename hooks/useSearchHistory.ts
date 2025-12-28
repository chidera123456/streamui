
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'zenstream_search_history';
const MAX_HISTORY = 10;

export const useSearchHistory = () => {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocalHistory = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse local history", e);
      }
    }
    return [];
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setSearchHistory(fetchLocalHistory());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('query')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_HISTORY);

      if (error) throw error;
      setSearchHistory(data?.map(h => h.query) || []);
    } catch (err) {
      console.error("Search history fetch failed:", err);
      setSearchHistory(fetchLocalHistory());
    } finally {
      setLoading(false);
    }
  }, [user, fetchLocalHistory]);

  // Sync history when user changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveToHistory = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    // 1. Optimistic Local Update
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      if (!user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    // 2. Database Sync
    if (user) {
      try {
        await supabase
          .from('search_history')
          .insert({ user_id: user.id, query: trimmed });
      } catch (err) {
        console.error("Failed to sync search to cloud", err);
      }
    }
  };

  const removeFromHistory = async (query: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== query);
      if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (user) {
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', user.id)
          .eq('query', query);
      } catch (err) {
        console.error("Failed to remove search from cloud", err);
      }
    }
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error("Failed to clear cloud history", err);
      }
    }
  };

  return { searchHistory, saveToHistory, removeFromHistory, clearHistory, loading, refresh: fetchHistory };
};
