
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnime, getFromCache, fetchLogos } from '../services/tmdbService';
import { Movie } from '../types';
import { BACKDROP_URL, LOGO_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import { GridSkeleton, HeroSkeleton } from '../components/Skeleton';

const Anime: React.FC = () => {
  const rotationTimerRef = useRef<number | null>(null);
  
  const [trending, setTrending] = useState<Movie[]>(() => getFromCache('anime-1-all')?.results || []);
  const [action, setAction] = useState<Movie[]>(() => getFromCache('anime-1-10759')?.results || []);
  const [fantasy, setFantasy] = useState<Movie[]>(() => getFromCache('anime-1-10765')?.results || []);
  
  // Initialize with a random index to satisfy "change after reloading app"
  const [heroIndex, setHeroIndex] = useState(() => Math.floor(Math.random() * 10));
  const [heroLogo, setHeroLogo] = useState<string | null>(null);

  const [loadingTrending, setLoadingTrending] = useState(trending.length === 0);
  const [loadingAction, setLoadingAction] = useState(action.length === 0);
  const [loadingFantasy, setLoadingFantasy] = useState(fantasy.length === 0);

  const heroList = useMemo(() => {
    if (trending.length === 0) return [];
    const validHeroes = trending.filter(m => m.backdrop_path);
    return (validHeroes.length > 0 ? validHeroes : trending).slice(0, 6);
  }, [trending]);

  const hero = useMemo(() => {
    if (heroList.length === 0) return null;
    return heroList[heroIndex % heroList.length];
  }, [heroList, heroIndex]);

  useEffect(() => {
    fetchAnime(1).then(res => {
      if (res?.results) {
        setTrending(res.results);
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
  }, []);

  useEffect(() => {
    if (hero) {
      fetchLogos(hero.id, 'tv').then(setHeroLogo);
    }
  }, [hero]);

  useEffect(() => {
    if (heroList.length > 0) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      
      rotationTimerRef.current = window.setInterval(() => {
        setHeroIndex(prev => (prev + 1));
      }, 180000); // 3 minutes
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
            <img 
              key={hero.id}
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover animate-crossfade"
              alt={hero.name}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6 z-20">
            <div className="flex items-center gap-3 animate-in fade-in duration-700">
              <span className="text-[#1ce783] text-sm md:text-lg font-black">★ {hero.vote_average.toFixed(1)}</span>
              <div className="h-[1px] w-8 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                Action • Fantasy • Anime
              </span>
            </div>
            {heroLogo ? (
              <img 
                src={`${LOGO_URL}${heroLogo}`} 
                alt={hero.name}
                className="h-16 md:h-32 lg:h-48 w-auto object-contain animate-in slide-in-from-left-6 duration-700 drop-shadow-2xl"
              />
            ) : (
              <h1 key={`h1-${hero.id}`} className="text-3xl md:text-7xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl animate-in slide-in-from-left-6 duration-700">
                {hero.name}
              </h1>
            )}
            <p key={`p-${hero.id}`} className="text-gray-300 text-[10px] md:text-base max-w-xl line-clamp-3 font-medium leading-relaxed animate-in slide-in-from-left-8 duration-1000">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-2 animate-in slide-in-from-bottom-4 duration-1000">
              <Link 
                to={`/details/tv/${hero.id}`}
                className="bg-[#1ce783] text-black px-8 md:px-12 py-2.5 md:py-3 rounded-sm font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl"
              >
                Watch Now
              </Link>
              <Link 
                to={`/details/tv/${hero.id}`}
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
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Combat & Power</p>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
                Action Anime
              </h2>
            </div>
            <Link to="/category/anime-action" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
              Explore All
            </Link>
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
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Other Worlds</p>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
                Fantasy & Sci-Fi
              </h2>
            </div>
            <Link to="/category/anime-fantasy" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
              Explore All
            </Link>
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
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Global Pulse</p>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
                Trending Japan
              </h2>
            </div>
            <Link to="/category/anime" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
              Explore All
            </Link>
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
