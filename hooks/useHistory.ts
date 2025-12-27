
import { useState, useEffect } from 'react';
import { Movie, HistoryItem } from '../types';

const STORAGE_KEY = 'zenstream_watch_history_v2';
const MAX_HISTORY = 20;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history from local storage on initialization
  useEffect(() => {
    const loadLocalHistory = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setHistory(parsed);
        } catch (e) {
          console.error("Failed to parse history from local storage", e);
        }
      }
      setLoading(false);
    };

    loadLocalHistory();
  }, []);

  const addToHistory = (movie: Movie, season?: number, episode?: number) => {
    // We update state immediately for a fast UI response
    setHistory(prev => {
      // Remove existing entry for the same media to move it to the top
      const filtered = prev.filter(h => h.media_id !== movie.id);
      
      const newItem: HistoryItem = {
        id: `local-${movie.id}-${Date.now()}`,
        user_id: 'local-user', // Decoupled from Supabase for history
        media_id: movie.id,
        media_type: movie.media_type,
        media_data: movie,
        last_watched_at: new Date().toISOString(),
        season,
        episode
      };

      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      
      // Persist to local storage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Local storage quota exceeded, could not save history", e);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  return { 
    history, 
    addToHistory, 
    clearHistory, 
    loading 
  };
};
