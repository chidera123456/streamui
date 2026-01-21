
import { useState, useEffect } from 'react';
import { Movie } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const WATCHLIST_CACHE_KEY = 'zenstream_watchlist_cache';

export const useWatchlist = () => {
  const { user, openAuthModal } = useAuth();
  const [watchlist, setWatchlist] = useState<Movie[]>(() => {
    // Immediate load from local cache for zero-latency UI
    const cached = localStorage.getItem(WATCHLIST_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(false);

  // Persistence effect: Keep local cache in sync with state
  useEffect(() => {
    localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    if (!user) return;

    const fetchWatchlist = async () => {
      // Only set loading to true if the list is empty (first load)
      if (watchlist.length === 0) setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('media_data')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching watchlist:", error.message);
        } else if (data) {
          const cloudMovies = data.map(item => item.media_data as Movie).filter(Boolean);
          // Only update if different to prevent unnecessary re-renders
          if (JSON.stringify(cloudMovies) !== JSON.stringify(watchlist)) {
            setWatchlist(cloudMovies);
          }
        }
      } catch (err) {
        console.error("Critical error fetching watchlist:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();

    // Subscribe to realtime changes
    const channel = supabase.channel(`public:watchlist:user=${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'watchlist',
        filter: `user_id=eq.${user.id}`
      }, () => fetchWatchlist())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleWatchlist = async (movie: Movie) => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    const exists = watchlist.find(m => m.id === movie.id);
    
    // Optimistic Update for instant UI response
    if (exists) {
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    } else {
      setWatchlist(prev => [...prev, movie]);
    }
    
    try {
      if (exists) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', movie.id);
      } else {
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            media_id: movie.id,
            media_type: movie.media_type,
            media_data: movie
          });
      }
    } catch (err: any) {
      console.error("Watchlist sync failed, reverting:", err?.message);
      if (exists) setWatchlist(prev => [...prev, movie]);
      else setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    }
  };

  const isInWatchlist = (id: number) => watchlist.some(m => m.id === id);

  return { watchlist, toggleWatchlist, isInWatchlist, loading };
};