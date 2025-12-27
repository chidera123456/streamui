
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'zenstream_search_history';
const MAX_HISTORY = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const saveToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setSearchHistory(prev => {
      // Remove duplicate if it exists and put new one at the top
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (query: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(item => item !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { searchHistory, saveToHistory, removeFromHistory, clearHistory };
};
