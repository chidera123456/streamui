
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnime, fetchTrending, getFromCache, fetchLogos } from '../services/tmdbService';
import { Movie } from '../types';
import { BACKDROP_URL, LOGO_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import { GridSkeleton, HeroSkeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { useGenres } from '../context/GenreContext';

const Anime: React.FC = () => {
  const { getGenreNames } = useGenres();
  const rotationTimerRef = useRef<number | null>(null);
  
  const [trending, setTrending] = useState<Movie[]>(() => getFromCache('anime-1-all')?.results || []);
  const [tvTrending, setTvTrending] = useState<Movie[]>(() => getFromCache('trending-tv-1')?.results || []);
  const [action, setAction] = useState<Movie[]>(() => getFromCache('anime-1-10759')?.results || []);
  const [fantasy, setFantasy] = useState<Movie[]>(() => getFromCache('anime-1-10765')?.results || []);
  
  // Initialize with a simple random starting point, don't persist in session storage
  // as it makes the banner feel "stuck" on refresh to the user.
  const [heroIndex, setHeroIndex] = useState(() => Math.floor(Math.random() * 10));
  const [heroLogos, setHeroLogos] = useState<Record<number, string | null>>(() => {
    const initialLogos: Record<number, string | null> = {};
    const animeCache = getFromCache('anime-1-all');
    if (animeCache && animeCache.results) {
      animeCache.results.slice(0, 10).forEach((m: { id: number }) => {
        const cacheKey = `logos-tv-${m.id}`;
        const cachedLogo = getFromCache(cacheKey);
        if (cachedLogo && cachedLogo.logos && cachedLogo.logos.length > 0) {
          const englishLogo = (cachedLogo.logos as { iso_639_1: string, file_path: string }[]).find(l => l.iso_639_1 === 'en');
          const logo = englishLogo || cachedLogo.logos[0];
          initialLogos[m.id] = logo.file_path;
        }
      });
    }
    return initialLogos;
  });

  const [loadingTrending, setLoadingTrending] = useState(trending.length === 0);
  const [loadingAction, setLoadingAction] = useState(action.length === 0);
  const [loadingFantasy, setLoadingFantasy] = useState(fantasy.length === 0);

  const heroList = useMemo(() => {
    // Combine trending anime with global trending TV shows as requested
    const animeHeroes = trending.filter(m => m.backdrop_path).slice(0, 6);
    const tvHeroes = tvTrending.filter(m => m.backdrop_path).slice(0, 6);
    
    const combined = [...animeHeroes, ...tvHeroes];
    return combined.length > 0 ? combined : trending.slice(0, 10);
  }, [trending, tvTrending]);

  const hero = useMemo(() => {
    if (heroList.length === 0) return null;
    return heroList[heroIndex % heroList.length];
  }, [heroList, heroIndex]);

  useEffect(() => {
    fetchAnime(1).then(res => {
      if (res?.results) {
        setTrending(res.results);
        // Pre-fetch logos for anime heroes
        res.results.slice(0, 6).forEach(m => {
          fetchLogos(m.id, 'tv').then(logo => {
            if (logo) setHeroLogos(prev => ({ ...prev, [m.id]: logo }));
          });
        });
      }
      setLoadingTrending(false);
    });

    fetchAnime(1, 10759).then(res => {
      if (res?.results) {
        setAction(res.results);
      }
      setLoadingAction(false);
    });

    fetchAnime(1, 10765).then(res => {
      if (res?.results) {
        setFantasy(res.results);
      }
      setLoadingFantasy(false);
    });

    fetchTrending('tv', 1).then(res => {
      if (res?.results) {
        setTvTrending(res.results);
        // Pre-fetch logos for TV trending items in hero
        res.results.slice(0, 6).forEach(m => {
          fetchLogos(m.id, 'tv').then(logo => {
            if (logo) setHeroLogos(prev => ({ ...prev, [m.id]: logo }));
          });
        });
      }
    });
  }, []);

  useEffect(() => {
    if (hero && !heroLogos[hero.id]) {
      fetchLogos(hero.id, 'tv').then(logo => {
        if (logo) setHeroLogos(prev => ({ ...prev, [hero.id]: logo }));
      });
    }
  }, [hero, heroLogos]);

  useEffect(() => {
    if (heroList.length > 0) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      
      rotationTimerRef.current = window.setInterval(() => {
        setHeroIndex(prev => (prev + 1));
      }, 40000); // 40 seconds as requested
    }
    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [heroList]);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {!hero && loadingTrending ? (
        <HeroSkeleton />
      ) : hero && (
        <section className="relative h-[70vh] md:h-[90vh] w-full overflow-hidden">
            <div className="absolute inset-0">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={hero.id}
                  src={`${BACKDROP_URL}${hero.backdrop_path}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="w-full h-full object-cover"
                  alt={hero.name}
                  loading="eager"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-transparent" />
            </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6 z-20">
            {heroLogos[hero.id] ? (
              <img 
                src={`${LOGO_URL}${heroLogos[hero.id]}`} 
                alt={hero.name}
                className="h-16 md:h-32 lg:h-48 w-auto object-contain animate-in slide-in-from-left-6 duration-700 drop-shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  setHeroLogos(prev => ({ ...prev, [hero.id]: null }));
                }}
                fetchPriority="high"
              />
            ) : (
              <div className="h-16 md:h-32 lg:h-48 flex items-center">
                <h1 key={`h1-${hero.id}`} className="text-3xl md:text-7xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl animate-in slide-in-from-left-6 duration-700 opacity-20">
                  {hero.name}
                </h1>
              </div>
            )}
            <div className="flex items-center gap-3 animate-in fade-in duration-700">
              <span className="text-[#1ce783] text-sm md:text-lg font-black">★ {hero.vote_average.toFixed(1)}</span>
              <div className="h-[1px] w-8 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                {getGenreNames(hero.genre_ids || []).slice(0, 3).join(' • ')}
              </span>
            </div>
            <p key={`p-${hero.id}`} className="text-gray-300 text-[10px] md:text-base max-w-xl line-clamp-3 font-medium leading-relaxed animate-in slide-in-from-left-8 duration-1000">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-2 animate-in slide-in-from-bottom-4 duration-1000">
              <Link 
                to={`/details/${hero.media_type || 'tv'}/${hero.id}`}
                className="bg-[#1ce783] text-black px-8 md:px-12 py-2.5 md:py-3 rounded-sm font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl"
              >
                Watch Now
              </Link>
              <Link 
                to={`/details/${hero.media_type || 'tv'}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-6 md:px-10 py-2.5 md:py-3 rounded-sm font-black text-[10px] md:text-sm uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="space-y-16 md:space-y-24 mt-8 md:mt-12 px-6 md:px-16 relative z-30">
        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="flex items-baseline gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Combat & Power</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
                  Action Anime
                </h2>
              </div>
              <Link to="/category/anime-action" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#1ce783] transition-colors whitespace-nowrap">
                Explore All
              </Link>
            </div>
          </div>
          {loadingAction ? <GridSkeleton count={8} /> : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
              {action.slice(0, 16).map((item) => (
                <MediaCard key={item.id} media={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="flex items-baseline gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Other Worlds</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
                  Fantasy & Sci-Fi
                </h2>
              </div>
              <Link to="/category/anime-fantasy" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#1ce783] transition-colors whitespace-nowrap">
                Explore All
              </Link>
            </div>
          </div>
          {loadingFantasy ? <GridSkeleton count={8} /> : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
              {fantasy.slice(0, 16).map((item) => (
                <MediaCard key={item.id} media={item} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4">
            <div className="flex items-baseline gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Global Pulse</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
                  Trending Japan
                </h2>
              </div>
              <Link to="/category/anime" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#1ce783] transition-colors whitespace-nowrap">
                Explore All
              </Link>
            </div>
          </div>
          {loadingTrending ? <GridSkeleton count={8} /> : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
              {trending.slice(0, 16).map((item) => (
                <MediaCard key={item.id} media={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Anime;
