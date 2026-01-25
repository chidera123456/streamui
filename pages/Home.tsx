
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrending, fetchAnime, fetchGenres, fetchNetflixContent, fetchAwardWinning } from '../services/tmdbService';
import { useHistory } from '../hooks/useHistory';
import { useData } from '../context/DataContext';
import { Movie } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import { HeroSkeleton, GridSkeleton } from '../components/Skeleton';

const HorizontalSection: React.FC<{ title: string; subtitle?: string; movies: Movie[]; color?: string }> = ({ title, subtitle, movies, color = "#1ce783" }) => {
  if (movies.length === 0) return null;

  return (
    <section className="relative space-y-6">
      <div className="flex items-end justify-between px-6 md:px-16 border-b border-white/5 pb-4">
        <div className="space-y-1">
          {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
            {title.split(' ')[0]} <span style={{ color }}>{title.split(' ').slice(1).join(' ')}</span>
          </h2>
        </div>
      </div>
      
      <div className="flex overflow-x-auto gap-4 md:gap-6 px-6 md:px-16 pb-6 hide-scrollbar snap-x snap-mandatory">
        {movies.map((item) => (
          <div key={item.id} className="min-w-[140px] md:min-w-[180px] lg:min-w-[200px] snap-start">
            <MediaCard media={item} />
          </div>
        ))}
      </div>
    </section>
  );
};

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
      
      {loading && movies.length === 0 ? (
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
  const { homeData, setHomeData, genreMap, setGenreMap } = useData();
  
  // Set initial loading based on whether we already have data in context
  const [isInitialLoading, setIsInitialLoading] = useState(!homeData.loaded);

  useEffect(() => {
    // CRITICAL: If data is already loaded, skip fetching entirely.
    // This prevents re-renders and image "reloads" when navigating back.
    if (homeData.loaded) {
      setIsInitialLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const genresPromise = fetchGenres('movie').then(res => {
          const gMap: Record<number, string> = {};
          res.forEach(g => gMap[g.id] = g.name);
          setGenreMap(gMap);
        });

        const trendingPromise = fetchTrending('movie', 1).then(res => {
          if (res?.results && res.results.length > 0) {
            const newData: Partial<typeof homeData> = { trending: res.results };
            // Ensure hero is only selected once per session
            if (!homeData.hero) {
              const backdropResults = res.results.filter(m => m.backdrop_path);
              const sourceList = backdropResults.length > 0 ? backdropResults : res.results;
              const randomIndex = Math.floor(Math.random() * Math.min(sourceList.length, 12));
              newData.hero = sourceList[randomIndex];
            }
            setHomeData(newData);
          }
        });

        const netflixPromise = fetchNetflixContent(1).then(res => {
          if (res?.results) setHomeData({ netflix: res.results });
        });

        const animePromise = fetchAnime(1).then(res => {
          if (res?.results) setHomeData({ anime: res.results });
        });

        const tvPromise = fetchTrending('tv', 1).then(res => {
          if (res?.results) setHomeData({ tvTrending: res.results });
        });

        const awardPromise = fetchAwardWinning('movie', 1).then(res => {
          if (res?.results) setHomeData({ awardWinning: res.results });
        });

        await Promise.all([genresPromise, trendingPromise, netflixPromise, animePromise, tvPromise, awardPromise]);
        setHomeData({ loaded: true });
      } catch (err) {
        console.error("Home data load failed", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [homeData.loaded, setHomeData, setGenreMap, homeData.hero]);

  const { hero, trending, awardWinning, netflix, anime, tvTrending } = homeData;

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {isInitialLoading && !hero ? (
        <HeroSkeleton />
      ) : hero && (
        <section className="relative h-[70vh] md:h-[90vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover"
              alt={hero.title || hero.name}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6 z-20">
            <div className="flex items-center gap-3">
              <span className="text-[#1ce783] text-sm md:text-lg font-black">★ {hero.vote_average.toFixed(1)}</span>
              <div className="h-[1px] w-8 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                {hero.genre_ids?.slice(0, 2).map(id => genreMap[id]).join(' • ')}
              </span>
            </div>
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl">
              {hero.title || hero.name}
            </h1>
            <p className="text-gray-300 text-xs md:text-lg max-w-2xl line-clamp-3 font-medium leading-relaxed">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link 
                to={`/details/${hero.media_type || 'movie'}/${hero.id}`}
                className="bg-[#1ce783] text-black px-10 md:px-16 py-3 md:py-4 rounded-sm font-black text-xs md:text-base uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl"
              >
                Watch
              </Link>
              <Link 
                to={`/details/${hero.media_type || 'movie'}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-8 md:px-12 py-3 md:py-4 rounded-sm font-black text-xs md:text-base uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <div className="space-y-16 md:space-y-24 mt-8 md:mt-12 relative z-30">
        
        {history.length > 0 && (
          <HorizontalSection 
            title="Continue Watching" 
            movies={history.map(h => h.media_data)} 
            color="#06b6d4" 
          />
        )}

        <MediaSection 
          title="Trending Now" 
          subtitle="Cinematic Pulse" 
          movies={trending} 
          loading={isInitialLoading && trending.length === 0} 
        />

        <MediaSection 
          title="Award Winning" 
          subtitle="Critically Acclaimed" 
          movies={awardWinning} 
          loading={isInitialLoading && awardWinning.length === 0} 
          color="#fbbf24"
        />

        <MediaSection 
          title="Netflix Originals" 
          subtitle="Global Premiere" 
          movies={netflix} 
          loading={isInitialLoading && netflix.length === 0} 
          color="#e50914"
        />

        <MediaSection 
          title="Anime Hits" 
          subtitle="Rising Sun" 
          movies={anime} 
          loading={isInitialLoading && anime.length === 0} 
          color="#22d3ee"
        />

        <MediaSection 
          title="Popular Series" 
          subtitle="Must Watch" 
          movies={tvTrending} 
          loading={isInitialLoading && tvTrending.length === 0} 
        />
      </div>
    </div>
  );
};

export default Home;
