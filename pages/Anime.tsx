
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnime } from '../services/tmdbService';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import { GridSkeleton, HeroSkeleton } from '../components/Skeleton';

const Anime: React.FC = () => {
  const [hero, setHero] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [fantasy, setFantasy] = useState<Movie[]>([]);
  
  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingAction, setLoadingAction] = useState(true);
  const [loadingFantasy, setLoadingFantasy] = useState(true);

  useEffect(() => {
    // Priority: Trending + Hero
    fetchAnime(1).then(res => {
      setTrending(res.results);
      if (res.results.length > 0) {
        const validHeroes = res.results.filter(m => m.backdrop_path);
        const top = validHeroes.length > 0 
          ? validHeroes[Math.floor(Math.random() * Math.min(3, validHeroes.length))]
          : res.results[0];
        setHero(top);
      }
      setLoadingHero(false);
      setLoadingTrending(false);
    });

    // Sub-genres
    fetchAnime(1, 10759).then(res => {
      setAction(res.results);
      setLoadingAction(false);
    });

    fetchAnime(1, 10765).then(res => {
      setFantasy(res.results);
      setLoadingFantasy(false);
    });

    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pb-20 bg-[#040404]">
      {/* Anime Hero Banner */}
      {loadingHero ? (
        <HeroSkeleton />
      ) : hero && (
        <section className="relative h-[50vh] md:h-[85vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000"
              alt={hero.name}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-4 md:p-16 max-w-4xl space-y-4 md:space-y-6">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-cyan-400 text-sm md:text-xl font-black flex items-center gap-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                ★ {hero.vote_average.toFixed(1)}
              </span>
              <div className="h-[1px] w-12 bg-cyan-500/30"></div>
              <span className="text-white/60 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Anime Hub Exclusive</span>
            </div>
            <h1 className="text-3xl md:text-8xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl">
              {hero.name}
            </h1>
            <p className="text-gray-300 text-xs md:text-xl max-w-2xl line-clamp-2 md:line-clamp-3 font-medium leading-relaxed italic border-l-2 md:border-l-4 border-cyan-500 pl-4 md:pl-6 py-1 md:py-2">
              {hero.overview}
            </p>
            <div className="flex items-center gap-3 md:gap-4 pt-4 md:pt-8">
              <Link 
                to={`/details/tv/${hero.id}`}
                className="bg-cyan-500 text-black px-6 md:px-12 py-2.5 md:py-4 rounded-sm font-black text-[10px] md:text-base uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl shadow-cyan-900/40"
              >
                Watch
              </Link>
              <Link 
                to={`/details/tv/${hero.id}`}
                className="bg-white/5 backdrop-blur-md text-white px-5 md:px-10 py-2.5 md:py-4 rounded-sm font-black text-[10px] md:text-base uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Anime Hub Sections */}
      <div className="px-4 md:px-16 mt-8 md:mt-12 space-y-16 md:space-y-24">
        <section>
          <div className="flex items-end justify-between mb-6 md:mb-10 border-b border-white/5 pb-4 md:pb-6">
            <div className="flex flex-col">
              <p className="text-[8px] md:text-[10px] font-black text-[#1ce783] uppercase tracking-[0.4em] mb-1 md:mb-2">Simulcast</p>
              <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter">
                Highly <span className="text-[#1ce783]">Recommended</span>
              </h2>
            </div>
          </div>
          {loadingTrending ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
              {trending.slice(0, 18).map(movie => (
                <MediaCard key={movie.id} media={movie} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-6 md:mb-10 border-b border-white/5 pb-4 md:pb-6">
            <div className="flex flex-col">
              <p className="text-[8px] md:text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-1 md:mb-2">High Energy</p>
              <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Action & <span className="text-cyan-500">Shonen</span>
              </h2>
            </div>
          </div>
          {loadingAction ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
              {action.slice(0, 18).map(movie => (
                <MediaCard key={movie.id} media={movie} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between mb-6 md:mb-10 border-b border-white/5 pb-4 md:pb-6">
            <div className="flex flex-col">
              <p className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1 md:mb-2">Worlds Beyond</p>
              <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Fantasy & <span className="text-emerald-500">Isekai</span>
              </h2>
            </div>
          </div>
          {loadingFantasy ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
              {fantasy.slice(0, 18).map(movie => (
                <MediaCard key={movie.id} media={movie} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Anime;
