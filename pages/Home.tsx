
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrending, fetchAnime, fetchGenres, fetchNetflixContent } from '../services/tmdbService';
import { useHistory } from '../hooks/useHistory';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import { GridSkeleton, HeroSkeleton } from '../components/Skeleton';

const Home: React.FC = () => {
  const { history, clearHistory } = useHistory();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [netflix, setNetflix] = useState<Movie[]>([]);
  const [tvTrending, setTvTrending] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [hero, setHero] = useState<Movie | null>(null);
  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingNetflix, setLoadingNetflix] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(true);
  const [loadingTV, setLoadingTV] = useState(true);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  
  // Load Genres once
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          fetchGenres('movie'),
          fetchGenres('tv')
        ]);
        const gMap: Record<number, string> = {};
        [...movieGenres, ...tvGenres].forEach(g => gMap[g.id] = g.name);
        setGenreMap(gMap);
      } catch (e) {
        console.error("Genre fetch failed", e);
      }
    };
    loadGenres();
  }, []);

  // Sectional Loading
  useEffect(() => {
    // 1. Priority: Trending (for Hero + First Row)
    fetchTrending('movie', 1).then(res => {
      if (res?.results) {
        setTrending(res.results);
        const randomIndex = Math.floor(Math.random() * Math.min(5, res.results.length));
        setHero(res.results[randomIndex]);
      }
      setLoadingHero(false);
      setLoadingTrending(false);
    });

    // 2. Secondary: Netflix
    fetchNetflixContent(1).then(res => {
      if (res?.results) setNetflix(res.results);
      setLoadingNetflix(false);
    });

    // 3. Secondary: Anime
    fetchAnime(1).then(res => {
      if (res?.results) setAnime(res.results);
      setLoadingAnime(false);
    });

    // 4. Secondary: TV
    fetchTrending('tv', 1).then(res => {
      if (res?.results) setTvTrending(res.results);
      setLoadingTV(false);
    });
  }, []);

  return (
    <div className="pb-10 md:pb-20">
      {/* Mobile Top Brand */}
      <div className="md:hidden pt-6 px-6 pb-2">
        <span className="text-white font-black text-2xl tracking-tighter uppercase italic">
          ZEN<span className="text-[#1ce783]">STREAM</span>
        </span>
      </div>

      {/* Hero Section */}
      {loadingHero ? (
        <HeroSkeleton />
      ) : hero && (
        <section className="relative h-[60vh] md:h-[85vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover"
              alt={hero.title || hero.name}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-[#1ce783] text-sm md:text-base font-black flex items-center gap-1">
                ★ {hero.vote_average.toFixed(1)}
              </span>
              <div className="h-[1px] w-8 md:w-12 bg-[#1ce783]/50"></div>
              <div className="flex gap-2">
                {hero.genre_ids?.slice(0, 2).map(id => (
                  <span key={id} className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded-sm">
                    {genreMap[id]}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-3xl md:text-8xl font-black tracking-tighter leading-tight md:leading-none uppercase italic drop-shadow-2xl">
              {hero.title || hero.name}
            </h1>
            <p className="text-gray-300 text-xs md:text-lg max-w-2xl line-clamp-3 md:line-clamp-4 font-medium leading-relaxed">
              {hero.overview}
            </p>
            <div className="flex items-center gap-3 md:gap-4 pt-4">
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-[#1ce783] text-black px-6 md:px-12 py-3 md:py-4 rounded-sm font-black text-[10px] md:text-base uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-xl shadow-[#1ce783]/20"
              >
                Watch
              </Link>
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-5 md:px-10 py-3 md:py-4 rounded-sm font-black text-[10px] md:text-base uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Grid Rows */}
      <div className="space-y-16 md:space-y-24 mt-8 md:mt-12">
        
        {/* Continue Watching Section - DYNAMIC ROW */}
        {history.length > 0 && (
          <section className="relative">
            <div className="px-6 md:px-16 mb-6 md:mb-8 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter border-l-4 border-cyan-500 pl-4 md:pl-5">
                  Continue <span className="text-cyan-500">Watching</span>
                </h2>
              </div>
              <button 
                onClick={clearHistory}
                className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5"
              >
                Clear
              </button>
            </div>
            
            <div className="flex overflow-x-auto gap-3 md:gap-5 px-6 md:px-16 pb-6 snap-x snap-mandatory custom-scrollbar hide-scrollbar md:show-scrollbar">
              {history.map((item) => (
                <div key={`history-${item.media_id}-${item.media_type}`} className="min-w-[110px] md:min-w-[170px] max-w-[110px] md:max-w-[170px] snap-start group relative">
                  <MediaCard media={item.media_data} />
                  {item.media_type === 'tv' && item.season && item.episode && (
                    <div className="absolute bottom-2 left-1.5 right-1.5 pointer-events-none">
                      <div className="bg-cyan-500 text-black text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-lg w-fit">
                        S{item.season} E{item.episode}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="min-w-[20px] h-full shrink-0"></div>
            </div>
          </section>
        )}

        {/* Trending Section */}
        <section className="px-6 md:px-16">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="space-y-1">
              <p className="text-[#1ce783] text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Cinematic Pulse</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter border-l-4 border-[#1ce783] pl-4 md:pl-5">
                Trending <span className="text-[#1ce783]">Now</span>
              </h2>
            </div>
          </div>
          {loadingTrending ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-5">
              {trending.slice(0, 24).map((movie) => (
                <MediaCard key={`trending-${movie.id}`} media={movie} />
              ))}
            </div>
          )}
        </section>

        {/* Netflix Originals Section - SIDE SCROLL */}
        <section className="relative">
          <div className="px-6 md:px-16 mb-8 md:mb-10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-red-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Global Premiere</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter border-l-4 border-red-600 pl-4 md:pl-5">
                Netflix <span className="text-red-600">Originals</span>
              </h2>
            </div>
          </div>
          
          <div className="flex overflow-x-auto gap-3 md:gap-5 px-6 md:px-16 pb-6 snap-x snap-mandatory custom-scrollbar hide-scrollbar md:show-scrollbar">
            {loadingNetflix ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="min-w-[120px] md:min-w-[200px] max-w-[120px] md:max-w-[200px] aspect-[2/3] bg-white/5 animate-pulse" />
              ))
            ) : (
              netflix.map((item) => (
                <div key={`netflix-${item.id}`} className="min-w-[120px] md:min-w-[200px] max-w-[120px] md:max-w-[200px] snap-start">
                  <MediaCard media={item} />
                </div>
              ))
            )}
            <div className="min-w-[1px] h-full"></div>
          </div>
        </section>

        {/* Anime Section */}
        <section className="px-6 md:px-16">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="space-y-1">
              <p className="text-cyan-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Rising Sun</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter border-l-4 border-cyan-500 pl-4 md:pl-5">
                Anime <span className="text-cyan-500">Hits</span>
              </h2>
            </div>
            <Link to="/anime" className="text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5">View Hub</Link>
          </div>
          {loadingAnime ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-5">
              {anime.slice(0, 18).map(item => (
                <MediaCard key={`anime-${item.id}`} media={item} />
              ))}
            </div>
          )}
        </section>

        {/* Popular Series */}
        <section className="px-6 md:px-16">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="space-y-1">
              <p className="text-[#1ce783] text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Must Watch</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter border-l-4 border-[#1ce783] pl-4 md:pl-5">
                Popular <span className="text-[#1ce783]">Series</span>
              </h2>
            </div>
          </div>
          {loadingTV ? (
            <GridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-5">
              {tvTrending.slice(0, 24).map((tv) => (
                <MediaCard key={`tv-${tv.id}`} media={tv} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
