
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
    let isMounted = true;

    const fetchWatchlist = async () => {
      if (watchlist.length === 0) setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .select('media_data')
          .eq('user_id', user.id);

        if (!isMounted) return;

        if (error) {
          // Explicitly ignore AbortErrors and noise from background navigation
          if (error.message?.includes('aborted') || error.name === 'AbortError' || error.code === 'ABORTED') return;
          console.debug("Watchlist sync paused:", error.message);
        } else if (data) {
          const cloudMovies = data.map(item => item.media_data as Movie).filter(Boolean);
          if (JSON.stringify(cloudMovies) !== JSON.stringify(watchlist)) {
            setWatchlist(cloudMovies);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('Failed to fetch')) return;
        // Only log critical application errors, not network dips
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWatchlist();

    const channel = supabase.channel(`public:watchlist:user=${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'watchlist',
        filter: `user_id=eq.${user.id}`
      }, () => {
        if (isMounted) fetchWatchlist();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleWatchlist = async (movie: Movie) => {
    if (!user) {
      openAuthModal();
      return;
    }
    
    const exists = watchlist.find(m => m.id === movie.id);
    
    // Optimistic Update
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
      // Gracefully handle silent failures
      if (exists) setWatchlist(prev => [...prev, movie]);
      else setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    }
  };

  const isInWatchlist = (id: number) => watchlist.some(m => m.id === id);

  return { watchlist, toggleWatchlist, isInWatchlist, loading };
};
