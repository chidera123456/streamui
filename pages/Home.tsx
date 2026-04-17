
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrending, fetchAnime, fetchGenres, fetchNetflixContent, fetchAwardWinning, fetchComedyTV, fetchTopRatedTV, getFromCache, fetchLogos } from '../services/tmdbService';
import { useHistory } from '../hooks/useHistory';
import { Movie } from '../types';
import { BACKDROP_URL, LOGO_URL } from '../constants';
import MediaCard from '../components/MediaCard';
import FeaturedCollections from '../components/FeaturedCollections';
import { HeroSkeleton, GridSkeleton } from '../components/Skeleton';

const HorizontalSection: React.FC<{ 
  title: string; 
  subtitle?: string; 
  movies: Movie[]; 
  color?: string;
  onRemoveItem?: (id: number) => void;
}> = ({ title, subtitle, movies, color = "#1ce783", onRemoveItem }) => {
  if (movies.length === 0) return null;

  return (
    <section className="relative space-y-6">
      <div className="flex items-end justify-between px-6 md:px-16 border-b border-white/5 pb-4">
        <div className="space-y-1">
          {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter" style={{ color }}>
            {title}
          </h2>
        </div>
      </div>
      
      <div className="flex overflow-x-auto gap-4 md:gap-6 px-6 md:px-16 pb-6 hide-scrollbar snap-x snap-mandatory">
        {movies.map((item) => (
          /* Fixed width and shrink-0 ensure posters stay the same size even when others are removed */
          <div key={`${item.id}-${item.media_type}`} className="w-[120px] md:w-[160px] lg:w-[180px] shrink-0 snap-start">
            <MediaCard 
              media={item} 
              onRemove={onRemoveItem ? (e) => {
                e.preventDefault();
                onRemoveItem(item.id);
              } : undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

const MediaSection: React.FC<{ 
  title: string; 
  subtitle?: string; 
  movies: Movie[]; 
  loading: boolean; 
  color?: string;
  categoryId?: string;
}> = ({ title, subtitle, movies, loading, color = "#1ce783", categoryId }) => {
  const showSkeleton = loading && movies.length === 0;

  if (!loading && movies.length === 0) return null;

  return (
    <section className="relative space-y-6 px-6 md:px-16">
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div className="space-y-1">
          {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color }}>{subtitle}</p>}
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter" style={{ color }}>
            {title}
          </h2>
        </div>
        <Link to={categoryId ? `/category/${categoryId}` : "/search"} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
          Explore All
        </Link>
      </div>
      
      {showSkeleton ? (
        <GridSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
          {movies.slice(0, 16).map((item) => (
            <MediaCard key={`${item.id}-${item.media_type}`} media={item} />
          ))}
        </div>
      )}
    </section>
  );
};

const Home: React.FC = () => {
  const { history, removeFromHistory } = useHistory();
  const rotationTimerRef = useRef<number | null>(null);
  
  const [trending, setTrending] = useState<Movie[]>(() => getFromCache('trending-movie-1')?.results || []);
  const [netflix, setNetflix] = useState<Movie[]>(() => getFromCache('netflix-originals-1')?.results || []);
  const [tvTrending, setTvTrending] = useState<Movie[]>(() => getFromCache('trending-tv-1')?.results || []);
  const [anime, setAnime] = useState<Movie[]>(() => getFromCache('anime-1-all')?.results || []);
  const [awardWinning, setAwardWinning] = useState<Movie[]>(() => getFromCache('award-winning-movie-1')?.results || []);
  const [comedyTV, setComedyTV] = useState<Movie[]>(() => getFromCache('comedy-tv-1')?.results || []);
  const [topRatedTV, setTopRatedTV] = useState<Movie[]>(() => getFromCache('top-rated-tv-1')?.results || []);
  
  const [heroIndex, setHeroIndex] = useState(() => {
    const saved = sessionStorage.getItem('zenstream-hero-index');
    if (saved !== null) return parseInt(saved, 10);
    const index = Math.floor(Math.random() * 10);
    sessionStorage.setItem('zenstream-hero-index', index.toString());
    return index;
  });
  const [heroLogos, setHeroLogos] = useState<Record<number, string | null>>(() => {
    const initialLogos: Record<number, string | null> = {};
    const trendingCache = getFromCache('trending-movie-1');
    if (trendingCache && trendingCache.results) {
      trendingCache.results.slice(0, 10).forEach((m: { media_type?: string; id: number }) => {
        const cacheKey = `logos-${m.media_type || 'movie'}-${m.id}`;
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
  const [loadingNetflix, setLoadingNetflix] = useState(netflix.length === 0);
  const [loadingAnime, setLoadingAnime] = useState(anime.length === 0);
  const [loadingTV, setLoadingTV] = useState(tvTrending.length === 0);
  const [loadingAwards, setLoadingAwards] = useState(awardWinning.length === 0);
  const [loadingComedy, setLoadingComedy] = useState(comedyTV.length === 0);
  const [loadingTopRatedTV, setLoadingTopRatedTV] = useState(topRatedTV.length === 0);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});

  const heroList = useMemo(() => {
    if (trending.length === 0) return [];
    const backdropResults = trending.filter(m => m.backdrop_path);
    return (backdropResults.length > 0 ? backdropResults : trending).slice(0, 6);
  }, [trending]);

  const hero = useMemo(() => {
    if (heroList.length === 0) return null;
    return heroList[heroIndex % heroList.length];
  }, [heroList, heroIndex]);
  
  useEffect(() => {
    fetchGenres('movie').then(res => {
      const gMap: Record<number, string> = {};
      res.forEach(g => gMap[g.id] = g.name);
      setGenreMap(gMap);
    });

    fetchTrending('movie', 1).then(res => {
      if (res?.results && res.results.length > 0) {
        setTrending(res.results);
        // Pre-fetch logos for the entire hero list immediately
        res.results.slice(0, 6).forEach(m => {
          fetchLogos(m.id, m.media_type || 'movie').then(logo => {
            if (logo) setHeroLogos(prev => ({ ...prev, [m.id]: logo }));
          });
        });
      }
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

    fetchAwardWinning('movie', 1).then(res => {
      if (res?.results) setAwardWinning(res.results);
      setLoadingAwards(false);
    });

    fetchComedyTV(1).then(res => {
      if (res?.results) setComedyTV(res.results);
      setLoadingComedy(false);
    });

    fetchTopRatedTV(1).then(res => {
      if (res?.results) setTopRatedTV(res.results);
      setLoadingTopRatedTV(false);
    });
  }, []);

  useEffect(() => {
    if (hero && !heroLogos[hero.id]) {
      fetchLogos(hero.id, hero.media_type || 'movie').then(logo => {
        if (logo) setHeroLogos(prev => ({ ...prev, [hero.id]: logo }));
      });
    }
  }, [hero, heroLogos]);

  useEffect(() => {
    if (heroList.length > 0) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      
      rotationTimerRef.current = window.setInterval(() => {
        setHeroIndex(prev => (prev + 1));
      }, 180000);
    }
    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [heroList]);

  return (
    <div className="pb-20">
      {!hero && (loadingTrending) ? (
        <HeroSkeleton />
      ) : hero && (
        <section className="relative h-[70vh] md:h-[90vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              key={hero.id}
              src={`${BACKDROP_URL}${hero.backdrop_path}`}
              className="w-full h-full object-cover animate-crossfade"
              alt={hero.title || hero.name}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6 z-20">
            {heroLogos[hero.id] ? (
              <img 
                src={`${LOGO_URL}${heroLogos[hero.id]}`} 
                alt={hero.title || hero.name}
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
                  {hero.title || hero.name}
                </h1>
              </div>
            )}
            <div className="flex items-center gap-3 animate-in fade-in duration-700">
              <span className="text-[#1ce783] text-sm md:text-lg font-black">★ {hero.vote_average.toFixed(1)}</span>
              <div className="h-[1px] w-8 bg-white/20"></div>
              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                {hero.genre_ids?.slice(0, 2).map(id => genreMap[id]).join(' • ')}
              </span>
            </div>
            <p key={`p-${hero.id}`} className="text-gray-300 text-[10px] md:text-base max-w-xl line-clamp-3 font-medium leading-relaxed animate-in slide-in-from-left-8 duration-1000">
              {hero.overview}
            </p>
            <div className="flex items-center gap-4 pt-2 animate-in slide-in-from-bottom-4 duration-1000">
              <Link 
                to={`/details/${hero.media_type || 'movie'}/${hero.id}`}
                className="bg-[#1ce783] text-black px-8 md:px-12 py-2.5 md:py-3 rounded-sm font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl"
              >
                Watch
              </Link>
              <Link 
                to={`/details/${hero.media_type || 'movie'}/${hero.id}`}
                className="bg-white/10 backdrop-blur-md text-white px-6 md:px-10 py-2.5 md:py-3 rounded-sm font-black text-[10px] md:text-sm uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
              >
                Details
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="space-y-16 md:space-y-24 mt-8 md:mt-12 relative z-30">
        {history.length > 0 && (
          <HorizontalSection 
            title="Continue Watching" 
            movies={history.map(h => h.media_data)} 
            color="#1ce783" 
            onRemoveItem={(id) => removeFromHistory(id)}
          />
        )}

        <MediaSection 
          title="Trending Now" 
          subtitle="Cinematic Pulse" 
          movies={trending} 
          loading={loadingTrending} 
          categoryId="trending"
          color="#1ce783"
        />

        <FeaturedCollections />

        <MediaSection 
          title="Award Winning" 
          subtitle="Critically Acclaimed" 
          movies={awardWinning} 
          loading={loadingAwards} 
          color="#1ce783"
          categoryId="awards"
        />

        <MediaSection 
          title="Netflix Originals" 
          subtitle="Global Premiere" 
          movies={netflix} 
          loading={loadingNetflix} 
          color="#1ce783"
          categoryId="netflix"
        />

        <MediaSection 
          title="Anime Hits" 
          subtitle="Rising Sun" 
          movies={anime} 
          loading={loadingAnime} 
          color="#1ce783"
          categoryId="anime"
        />

        <MediaSection 
          title="Popular Series" 
          subtitle="Must Watch" 
          movies={tvTrending} 
          loading={loadingTV} 
          categoryId="tv"
          color="#1ce783"
        />

        <MediaSection 
          title="Comedy Series" 
          subtitle="Laughter Guaranteed" 
          movies={comedyTV} 
          loading={loadingComedy} 
          color="#1ce783"
          categoryId="comedy-tv"
        />

        <MediaSection 
          title="Top Rated TV Shows" 
          subtitle="All Time Greats" 
          movies={topRatedTV} 
          loading={loadingTopRatedTV} 
          color="#1ce783"
          categoryId="top-rated-tv"
        />
      </div>
    </div>
  );
};

export default Home;
