
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrending, fetchAnime } from '../services/tmdbService';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';

const Home: React.FC = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [tvTrending, setTvTrending] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [hero, setHero] = useState<Movie | null>(null);
  const [animeHero, setAnimeHero] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [moviesRes, tvRes, animeRes] = await Promise.all([
          fetchTrending('movie', 1),
          fetchTrending('tv', 1),
          fetchAnime(1)
        ]);
        setTrending(moviesRes.results);
        setTvTrending(tvRes.results);
        setAnime(animeRes.results);
        
        if (moviesRes.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(5, moviesRes.results.length));
          setHero(moviesRes.results[randomIndex]);
        }

        if (animeRes.results.length > 0) {
          setAnimeHero(animeRes.results[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {hero && (
        <section className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover"
              alt={hero.title}
            />
            <div className="absolute inset-0 hero-gradient" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-12 max-w-4xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-xs font-black px-2 py-1 rounded shadow-lg shadow-red-600/20">FEATURED</span>
              <span className="text-white/80 text-sm font-bold flex items-center gap-1">
                <span className="text-yellow-500">★</span> {hero.vote_average.toFixed(1)}
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl">
              {hero.title || hero.name}
            </h1>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl line-clamp-3 font-medium">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-6">
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase italic tracking-tighter hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-xl"
              >
                Watch Now
              </Link>
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-xl font-black uppercase italic tracking-tighter border border-white/20 hover:bg-white/20 transition-all shadow-xl"
              >
                More Info
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trending Movies */}
      <section className="px-4 md:px-12 mt-12">
        <div className="flex items-center justify-between mb-8 border-l-4 border-red-600 pl-4">
          <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">
            Trending <span className="text-red-600">Movies</span>
          </h2>
          <Link to="/search" className="text-[10px] bg-red-600/10 border border-red-600/30 text-red-500 font-black uppercase tracking-widest px-3 py-1 rounded-full hover:bg-red-600 hover:text-white transition-all">Discovery Mode</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {trending.slice(1, 17).map(movie => (
            <MediaCard key={movie.id} media={movie} />
          ))}
        </div>
      </section>

      {/* Anime Highlights Row */}
      <section className="px-4 md:px-12 mt-12">
        <div className="flex items-center justify-between mb-8 border-l-4 border-indigo-500 pl-4">
          <div className="flex flex-col">
            <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">
              Anime <span className="text-indigo-500">Highlights</span>
            </h2>
          </div>
          <Link 
            to="/anime" 
            className="text-[10px] font-black uppercase bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 px-3 py-1 rounded-full hover:bg-indigo-500 hover:text-white transition-all"
          >
            Full Anime Section
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {anime.slice(0, 8).map(item => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      </section>

      {/* Trending TV */}
      <section className="px-4 md:px-12 mt-20">
        <div className="flex items-center justify-between mb-8 border-l-4 border-red-600 pl-4">
          <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter">
            Hot <span className="text-red-600">TV Series</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {tvTrending.slice(0, 16).map((tv, index) => (
            <MediaCard key={`${tv.id}-${index}`} media={tv} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
