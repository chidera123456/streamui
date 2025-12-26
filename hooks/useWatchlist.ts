
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
      const { data, error } = await supabase
        .from('watchlist')
        .select('media_data')
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching watchlist:", error);
      } else {
        const movies = data.map(item => item.media_data as Movie);
        setWatchlist(movies);
      }
      setLoading(false);
    };

    fetchWatchlist();
  }, [user]);

  const toggleWatchlist = async (movie: Movie) => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    const exists = watchlist.find(m => m.id === movie.id);
    
    if (exists) {
      // Remove from Supabase
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('media_id', movie.id);

      if (!error) {
        setWatchlist(prev => prev.filter(m => m.id !== movie.id));
      }
    } else {
      // Add to Supabase
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          media_id: movie.id,
          media_type: movie.media_type,
          media_data: movie
        });

      if (!error) {
        setWatchlist(prev => [...prev, movie]);
      } else {
        console.error("Error adding to watchlist:", error);
      }
    }
  };

  const isInWatchlist = (id: number) => {
    return watchlist.some(m => m.id === id);
  };

  return { watchlist, toggleWatchlist, isInWatchlist, loading };
};
