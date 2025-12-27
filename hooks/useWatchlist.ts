
import { useState, useEffect } from 'react';
import { Movie } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export const useWatchlist = () => {
  const { user, openAuthModal } = useAuth();
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('media_data')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching watchlist:", error.message || String(error));
        } else if (data && Array.isArray(data)) {
          const movies = data.map(item => item.media_data as Movie).filter(Boolean);
          setWatchlist(movies);
        }
      } catch (err: any) {
        console.error("Critical error fetching watchlist:", err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  const toggleWatchlist = async (movie: Movie) => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    const exists = watchlist.find(m => m.id === movie.id);
    
    try {
      if (exists) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', movie.id);

        if (error) {
          console.error("Error removing from watchlist:", error.message || String(error));
        } else {
          setWatchlist(prev => prev.filter(m => m.id !== movie.id));
        }
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            media_id: movie.id,
            media_type: movie.media_type,
            media_data: movie
          });

        if (error) {
          console.error("Error adding to watchlist:", error.message || String(error));
        } else {
          setWatchlist(prev => [...prev, movie]);
        }
      }
    } catch (err: any) {
      console.error("Watchlist action failed:", err?.message || String(err));
    }
  };

  const isInWatchlist = (id: number) => {
    return watchlist.some(m => m.id === id);
  };

  return { watchlist, toggleWatchlist, isInWatchlist, loading };
};
