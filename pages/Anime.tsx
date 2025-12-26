
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnime } from '../services/tmdbService';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';

const Anime: React.FC = () => {
  const [hero, setHero] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [action, setAction] = useState<Movie[]>([]);
  const [fantasy, setFantasy] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnimeData = async () => {
      try {
        setLoading(true);
        // Action & Adventure (TV) = 10759
        // Sci-Fi & Fantasy (TV) = 10765
        const [trendRes, actionRes, fantasyRes] = await Promise.all([
          fetchAnime(1),
          fetchAnime(1, 10759),
          fetchAnime(1, 10765)
        ]);

        setTrending(trendRes.results);
        setAction(actionRes.results);
        setFantasy(fantasyRes.results);

        if (trendRes.results.length > 0) {
          const validHeroes = trendRes.results.filter(m => m.backdrop_path);
          const top = validHeroes.length > 0 
            ? validHeroes[Math.floor(Math.random() * Math.min(3, validHeroes.length))]
            : trendRes.results[0];
          setHero(top);
        }
      } catch (err) {
        console.error("Anime page data load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnimeData();
    window.scrollTo(0, 0);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="pb-20 bg-[#050505]">
      {/* Anime Hero Banner */}
      {hero && (
        <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000"
              alt={hero.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-600 text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-600/20 uppercase tracking-widest">Masterpiece Collection</span>
              <span className="text-white/80 text-sm font-bold flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="text-yellow-500">★</span> {hero.vote_average.toFixed(1)}
              </span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl">
              {hero.name}
            </h1>
            <p className="text-gray-300 text-sm md:text-xl max-w-2xl line-clamp-3 font-medium leading-relaxed italic border-l-4 border-indigo-500 pl-6 py-2">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-8">
              <Link 
                to={`/details/tv/${hero.id}`}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-indigo-500 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-indigo-900/40"
              >
                Start Watching
              </Link>
              <Link 
                to={`/details/tv/${hero.id}`}
                className="bg-white/5 backdrop-blur-md text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-tighter border border-white/10 hover:bg-white/10 transition-all shadow-xl"
              >
                Series Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Anime Hub Sections */}
      <div className="px-4 md:px-16 -mt-10 relative z-10 space-y-20">
        <section>
          <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Weekly Picks</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">
                Most <span className="text-indigo-500 underline decoration-4 underline-offset-8">Trending</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {trending.slice(0, 16).map(movie => (
              <MediaCard key={movie.id} media={movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-1">Adrenaline</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Action & <span className="text-red-600">Adventure</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {action.slice(0, 16).map(movie => (
              <MediaCard key={movie.id} media={movie} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-1">Otherworlds</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Fantasy & <span className="text-purple-600">Magic</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {fantasy.slice(0, 16).map(movie => (
              <MediaCard key={movie.id} media={movie} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-20 px-4 md:px-16">
        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-[3rem] p-12 text-center max-w-5xl mx-auto space-y-6">
          <h3 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Craving something <span className="text-indigo-500">Specific?</span></h3>
          <p className="text-indigo-200/50 max-w-xl mx-auto font-medium">Use our AI discovery engine to find anime based on your mood, vibes, or complex plot requirements.</p>
          <Link to="/ai-suggest" className="inline-block bg-white text-black px-12 py-4 rounded-2xl font-black uppercase italic tracking-widest hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">Ask Gemini ✨</Link>
        </div>
      </div>
    </div>
  );
};

export default Anime;
