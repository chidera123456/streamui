
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrending, fetchAnime, fetchGenres } from '../services/tmdbService';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';

const Home: React.FC = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [tvTrending, setTvTrending] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [hero, setHero] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [moviesRes, tvRes, animeRes, movieGenres, tvGenres] = await Promise.all([
          fetchTrending('movie', 1),
          fetchTrending('tv', 1),
          fetchAnime(1),
          fetchGenres('movie'),
          fetchGenres('tv')
        ]).catch(err => {
          console.error("Critical fetch error in Home:", err.message || err);
          return [[], [], [], [], []] as any;
        });
        
        const gMap: Record<number, string> = {};
        if (movieGenres && tvGenres) {
          [...movieGenres, ...tvGenres].forEach(g => gMap[g.id] = g.name);
        }
        setGenreMap(gMap);

        if (moviesRes?.results) setTrending(moviesRes.results);
        if (tvRes?.results) setTvTrending(tvRes.results);
        if (animeRes?.results) setAnime(animeRes.results);
        
        if (moviesRes?.results?.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, moviesRes.results.length));
          setHero(moviesRes.results[randomIndex]);
        }
      } catch (err: any) {
        console.error("Home initialization failed:", err.message || err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#040404]">
      <div className="w-10 h-10 border-2 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {hero && (
        <section className="relative h-[50vh] md:h-[85vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover"
              alt={hero.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-4 md:p-16 max-w-4xl space-y-3 md:space-y-6">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-[#1ce783] text-[8px] md:text-xs font-black uppercase tracking-[0.3em]">Featured Now</span>
              <div className="h-[1px] w-6 md:w-12 bg-[#1ce783]/50"></div>
              <div className="flex gap-2">
                {hero.genre_ids?.slice(0, 2).map(id => (
                  <span key={id} className="text-white/40 text-[7px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded-sm">
                    {genreMap[id]}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-2xl md:text-8xl font-black tracking-tighter leading-tight md:leading-none uppercase italic drop-shadow-2xl">
              {hero.title || hero.name}
            </h1>
            <p className="text-gray-300 text-[10px] md:text-lg max-w-2xl line-clamp-2 md:line-clamp-4 font-medium leading-relaxed">
              {hero.overview}
            </p>
            <div className="flex items-center gap-2 md:gap-4 pt-2">
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-[#1ce783] text-black px-5 md:px-12 py-2 md:py-4 rounded-sm font-black text-[9px] md:text-base uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-xl"
              >
                Watch
              </Link>
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-4 md:px-10 py-2 md:py-4 rounded-sm font-black text-[9px] md:text-base uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Rows */}
      <div className="space-y-10 md:space-y-16 mt-6 md:mt-12 px-4 md:px-16">
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-base md:text-3xl font-black uppercase italic tracking-tighter border-l-4 border-[#1ce783] pl-3 md:pl-4">
              Trending <span className="text-[#1ce783]">Now</span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
            {trending.slice(1, 17).map(movie => (
              <MediaCard key={movie.id} media={movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-base md:text-3xl font-black uppercase italic tracking-tighter border-l-4 border-cyan-500 pl-3 md:pl-4">
              Anime <span className="text-cyan-500">Hits</span>
            </h2>
            <Link to="/anime" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
            {anime.slice(0, 9).map(item => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-base md:text-3xl font-black uppercase italic tracking-tighter border-l-4 border-[#1ce783] pl-3 md:pl-4">
              Popular <span className="text-[#1ce783]">Series</span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
            {tvTrending.slice(0, 15).map((tv, index) => (
              <MediaCard key={`${tv.id}-${index}`} media={tv} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
