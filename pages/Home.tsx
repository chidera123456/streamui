
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrending, fetchAnime, fetchGenres, fetchNetflixContent } from '../services/tmdbService';
import { useHistory } from '../hooks/useHistory';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import { HeroSkeleton, GridSkeleton } from '../components/Skeleton';

const MediaSection: React.FC<{ title: string; subtitle?: string; movies: Movie[]; loading: boolean; color?: string }> = ({ title, subtitle, movies, loading, color = "#1ce783" }) => {
  if (!loading && movies.length === 0) return null;

  return (
    <section className="relative space-y-6 px-6 md:px-16">
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div className="space-y-1">
          {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
            {title.split(' ')[0]} <span style={{ color }}>{title.split(' ').slice(1).join(' ')}</span>
          </h2>
        </div>
        <Link to="/search" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
          Explore All
        </Link>
      </div>
      
      {loading ? (
        <GridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
          {movies.slice(0, 16).map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      )}
    </section>
  );
};

const Home: React.FC = () => {
  const { history } = useHistory();
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
  
  useEffect(() => {
    fetchGenres('movie').then(res => {
      const gMap: Record<number, string> = {};
      res.forEach(g => gMap[g.id] = g.name);
      setGenreMap(gMap);
    });

    fetchTrending('movie', 1).then(res => {
      if (res?.results && res.results.length > 0) {
        setTrending(res.results);
        // Filter to ensure we pick a movie with a valid backdrop for the hero section
        const backdropResults = res.results.filter(m => m.backdrop_path);
        const sourceList = backdropResults.length > 0 ? backdropResults : res.results;
        // Randomize hero selection from the top trending items for variety on reload
        const randomIndex = Math.floor(Math.random() * Math.min(sourceList.length, 12));
        setHero(sourceList[randomIndex]);
      }
      setLoadingHero(false);
      setLoadingTrending(false);
    });

    fetchNetflixContent(1).then(res => {
      if (res?.results) setNetflix(res.results);
      setLoadingNetflix(false);
    });

    fetchAnime(1).then(res => {
      if (res?.results) setAnime(res.results);
      setLoadingAnime(false);
    });

    fetchTrending('tv', 1).then(res => {
      if (res?.results) setTvTrending(res.results);
      setLoadingTV(false);
    });
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {loadingHero ? (
        <HeroSkeleton />
      ) : hero && (
        <section className="relative h-[70vh] md:h-[90vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover animate-in fade-in duration-1000"
              alt={hero.title}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[#1ce783] text-sm md:text-lg font-black">★ {hero.vote_average.toFixed(1)}</span>
              <div className="h-[1px] w-8 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                {hero.genre_ids?.slice(0, 2).map(id => genreMap[id]).join(' • ')}
              </span>
            </div>
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl animate-in slide-in-from-left-6 duration-700">
              {hero.title || hero.name}
            </h1>
            <p className="text-gray-300 text-xs md:text-lg max-w-2xl line-clamp-3 font-medium leading-relaxed animate-in slide-in-from-left-8 duration-1000">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-4 animate-in slide-in-from-bottom-4 duration-1000">
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-[#1ce783] text-black px-10 md:px-16 py-3 md:py-4 rounded-sm font-black text-xs md:text-base uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl"
              >
                Watch
              </Link>
              <Link 
                to={`/details/${hero.media_type}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-8 md:px-12 py-3 md:py-4 rounded-sm font-black text-xs md:text-base uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Grid Container */}
      <div className="space-y-16 md:space-y-24 mt-8 md:mt-12 relative z-30">
        
        {history.length > 0 && (
          <MediaSection 
            title="Continue Watching" 
            movies={history.map(h => h.media_data)} 
            loading={false} 
            color="#06b6d4" 
          />
        )}

        <MediaSection 
          title="Trending Now" 
          subtitle="Cinematic Pulse" 
          movies={trending} 
          loading={loadingTrending} 
        />

        <MediaSection 
          title="Netflix Originals" 
          subtitle="Global Premiere" 
          movies={netflix} 
          loading={loadingNetflix} 
          color="#e50914"
        />

        <MediaSection 
          title="Anime Hits" 
          subtitle="Rising Sun" 
          movies={anime} 
          loading={loadingAnime} 
          color="#22d3ee"
        />

        <MediaSection 
          title="Popular Series" 
          subtitle="Must Watch" 
          movies={tvTrending} 
          loading={loadingTV} 
        />
      </div>
    </div>
  );
};

export default Home;
