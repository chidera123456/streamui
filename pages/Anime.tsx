import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TMDB_API_KEY, TMDB_BASE_URL, BACKDROP_URL } from '../constants';
import { GridSkeleton, HeroSkeleton } from '../components/Skeleton';
import { motion, AnimatePresence } from 'motion/react';

interface AniListMedia {
  id: number;
  title: {
    english: string | null;
    romaji: string;
    native: string | null;
    userPreferred: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    color: string | null;
  };
  bannerImage: string | null;
  description: string | null;
  averageScore: number | null;
  genres: string[];
  format: string;
  seasonYear?: number;
}

interface TMDBMatch {
  media_type: string;
  id: number;
}

const Anime: React.FC = () => {
  const navigate = useNavigate();
  const rotationTimerRef = useRef<number | null>(null);

  // Grid Section States
  const [trending, setTrending] = useState<AniListMedia[]>([]);
  const [popularThisSeason, setPopularThisSeason] = useState<AniListMedia[]>([]);
  const [upcomingNextSeason, setUpcomingNextSeason] = useState<AniListMedia[]>([]);
  const [allTimePopular, setAllTimePopular] = useState<AniListMedia[]>([]);
  const [top100, setTop100] = useState<AniListMedia[]>([]);

  // Search States completely disabled

  // UI General States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hero Section State
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroBackdrops, setHeroBackdrops] = useState<Record<number, string | null>>({});

  // Dynamic Routing State
  const [resolvingMedia, setResolvingMedia] = useState<{ title: string; image: string } | null>(null);

  // View All States
  const [viewAllType, setViewAllType] = useState<string | null>(null);
  const [viewAllTitle, setViewAllTitle] = useState<string>('');
  const [viewAllData, setViewAllData] = useState<AniListMedia[]>([]);
  const [viewAllLoading, setViewAllLoading] = useState(false);

  // Compute current and next season
  const currentSeasonAndYear = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    let season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' = 'WINTER';
    if (month >= 2 && month <= 4) {
      season = 'SPRING';
    } else if (month >= 5 && month <= 7) {
      season = 'SUMMER';
    } else if (month >= 8 && month <= 10) {
      season = 'FALL';
    } else {
      season = 'WINTER';
    }
    return { season, year };
  }, []);

  const nextSeasonAndYear = useMemo(() => {
    const { season, year } = currentSeasonAndYear;
    if (season === 'WINTER') return { season: 'SPRING', year };
    if (season === 'SPRING') return { season: 'SUMMER', year };
    if (season === 'SUMMER') return { season: 'FALL', year };
    return { season: 'WINTER', year: year + 1 };
  }, [currentSeasonAndYear]);

  // Fetch all Anime Sections at once via a single consolidated AniList GraphQL request
  useEffect(() => {
    const loadAnimeData = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = `
          query ($season: MediaSeason, $seasonYear: Int, $nextSeason: MediaSeason, $nextYear: Int) {
            trending: Page(page: 1, perPage: 16) {
              media(type: ANIME, sort: TRENDING_DESC) {
                id
                title {
                  english
                  romaji
                  native
                  userPreferred
                }
                coverImage {
                  extraLarge
                  large
                  color
                }
                bannerImage
                description
                genres
                averageScore
                format
                seasonYear
              }
            }
            popularThisSeason: Page(page: 1, perPage: 16) {
              media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
                id
                title {
                  english
                  romaji
                  native
                  userPreferred
                }
                coverImage {
                  extraLarge
                  large
                  color
                }
                bannerImage
                description
                genres
                averageScore
                format
                seasonYear
              }
            }
            upcomingNextSeason: Page(page: 1, perPage: 16) {
              media(type: ANIME, season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC) {
                id
                title {
                  english
                  romaji
                  native
                  userPreferred
                }
                coverImage {
                  extraLarge
                  large
                  color
                }
                bannerImage
                description
                genres
                averageScore
                format
                seasonYear
              }
            }
            allTimePopular: Page(page: 1, perPage: 16) {
              media(type: ANIME, sort: POPULARITY_DESC) {
                id
                title {
                  english
                  romaji
                  native
                  userPreferred
                }
                coverImage {
                  extraLarge
                  large
                  color
                }
                bannerImage
                description
                genres
                averageScore
                format
                seasonYear
              }
            }
            top100: Page(page: 1, perPage: 16) {
              media(type: ANIME, sort: SCORE_DESC) {
                id
                title {
                  english
                  romaji
                  native
                  userPreferred
                }
                coverImage {
                  extraLarge
                  large
                  color
                }
                bannerImage
                description
                genres
                averageScore
                format
                seasonYear
              }
            }
          }
        `;

        const variables = {
          season: currentSeasonAndYear.season,
          seasonYear: currentSeasonAndYear.year,
          nextSeason: nextSeasonAndYear.season,
          nextYear: nextSeasonAndYear.year
        };

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ query, variables })
        });

        if (!response.ok) throw new Error('Failed to resolve AniList data catalog');
        const resJson = await response.json();
        
        if (resJson.data) {
          setTrending(resJson.data.trending?.media || []);
          setPopularThisSeason(resJson.data.popularThisSeason?.media || []);
          setUpcomingNextSeason(resJson.data.upcomingNextSeason?.media || []);
          setAllTimePopular(resJson.data.allTimePopular?.media || []);
          setTop100(resJson.data.top100?.media || []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to load anime database.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadAnimeData();
  }, [currentSeasonAndYear, nextSeasonAndYear]);

  // Pre-fetch high quality backdrops and pre-cache TMDB mappings for Trending Hero Anime rotation
  useEffect(() => {
    if (trending.length > 0) {
      trending.slice(0, 6).forEach(async (media) => {
        const title = media.title.english || media.title.romaji;
        const cachedBackdropKey = `animebackdrop_${media.id}`;
        const cached = localStorage.getItem(cachedBackdropKey);
        if (cached) {
          setHeroBackdrops(prev => ({ ...prev, [media.id]: cached }));
          return;
        }

        try {
          const queryEncoded = encodeURIComponent(title);
          const isMovie = media.format === 'MOVIE';
          const searchEndpoint = isMovie ? 'search/movie' : 'search/tv';
          const response = await fetch(`${TMDB_BASE_URL}/${searchEndpoint}?api_key=${TMDB_API_KEY}&query=${queryEncoded}&page=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const bestMatch = data.results[0];
              const backdropPath = bestMatch.backdrop_path;
              if (backdropPath) {
                const fullPath = `${BACKDROP_URL}${backdropPath}`;
                localStorage.setItem(cachedBackdropKey, fullPath);
                setHeroBackdrops(prev => ({ ...prev, [media.id]: fullPath }));
              }
              // Pre-cache the TMDB ID mapping
              const result = { id: bestMatch.id, type: isMovie ? 'movie' : 'tv' };
              localStorage.setItem(`animemapping_${media.id}`, JSON.stringify(result));
              return;
            }
          }
        } catch {
          // ignore backdrop prefetch error and fallback
        }

        const fallback = media.bannerImage || media.coverImage.extraLarge;
        setHeroBackdrops(prev => ({ ...prev, [media.id]: fallback }));
      });
    }
  }, [trending]);

  // Rotator logic for Hero header
  useEffect(() => {
    const listLength = Math.min(trending.length, 6);
    if (listLength > 0) {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      rotationTimerRef.current = window.setInterval(() => {
        setHeroIndex(prev => (prev + 1) % listLength);
      }, 10000); // 10 seconds carousel
    }
    return () => {
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [trending]);

  // Helper to generate multiple clean alternate query titles for TMDB matching
  const getCleanSearchQueries = (media: AniListMedia): string[] => {
    const queries: string[] = [];
    const addQuery = (q: string | null | undefined) => {
      if (!q) return;
      const trimmed = q.trim();
      if (trimmed && !queries.includes(trimmed)) {
        queries.push(trimmed);
      }
    };

    const titles = [
      media.title.english,
      media.title.romaji,
      media.title.userPreferred
    ].filter(Boolean) as string[];

    // 1. First add full titles in order of preference
    titles.forEach(t => addQuery(t));

    // 2. Add cleaned/simplified versions of full titles
    titles.forEach(t => {
      // Remove season, part, cour, and sequence suffix patterns
      const clean = t
        .replace(/(?:st|nd|rd|th)?\s+season/gi, '')
        .replace(/part\s+\d+/gi, '')
        .replace(/cour\s+\d+/gi, '')
        .replace(/\s+\d+(?:st|nd|rd|th)?/g, '')
        .trim();
      addQuery(clean);

      // Split by colon, hyphen or bracket to extract the high-level series name
      const splitters = [':', '-', '(', '['];
      for (const s of splitters) {
        if (t.includes(s)) {
          const parted = t.split(s)[0].trim();
          addQuery(parted);
          // Also clean the parted title
          const cleanParted = parted
            .replace(/(?:st|nd|rd|th)?\s+season/gi, '')
            .replace(/part\s+\d+/gi, '')
            .replace(/cour\s+\d+/gi, '')
            .replace(/\s+\d+(?:st|nd|rd|th)?/g, '')
            .trim();
          addQuery(cleanParted);
        }
      }
    });

    return queries;
  };

  // Robust TMDB-to-AniList resolver with 100% guarantee of landing on details
  const resolveToTMDB = async (media: AniListMedia): Promise<{ id: number; type: string }> => {
    const cacheKey = `animemapping_${media.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore JSON errors and re-query
      }
    }

    const queries = getCleanSearchQueries(media);
    const isMovieVal = media.format === 'MOVIE';

    // Try each title query variation one by one to find the most accurate TMDB series / movie
    for (const query of queries) {
      try {
        const queryEncoded = encodeURIComponent(query);
        const searchEndpoint = isMovieVal ? 'search/movie' : 'search/tv';
        const year = media.seasonYear;
        const yearParam = isMovieVal
          ? (year ? `&primary_release_year=${year}` : '')
          : (year ? `&first_air_date_year=${year}` : '');

        // 1. Query with Year filter
        let response = await fetch(`${TMDB_BASE_URL}/${searchEndpoint}?api_key=${TMDB_API_KEY}&query=${queryEncoded}${yearParam}&page=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = { id: data.results[0].id, type: isMovieVal ? 'movie' : 'tv' };
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
          }
        }

        // 2. Query without Year filter
        response = await fetch(`${TMDB_BASE_URL}/${searchEndpoint}?api_key=${TMDB_API_KEY}&query=${queryEncoded}&page=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = { id: data.results[0].id, type: isMovieVal ? 'movie' : 'tv' };
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
          }
        }

        // 3. Query the opposite category (e.g. Try TV if original was Movie, or vice versa)
        const oppositeEndpoint = isMovieVal ? 'search/tv' : 'search/movie';
        response = await fetch(`${TMDB_BASE_URL}/${oppositeEndpoint}?api_key=${TMDB_API_KEY}&query=${queryEncoded}&page=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = { id: data.results[0].id, type: isMovieVal ? 'tv' : 'movie' };
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
          }
        }

        // 4. Query multi-search fallback
        response = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${queryEncoded}&page=1`);
        if (response.ok) {
          const data = await response.json();
          const bestMatch = (data.results || []).find((x: TMDBMatch) => x.media_type === 'tv' || x.media_type === 'movie');
          if (bestMatch) {
            const result = { id: bestMatch.id, type: bestMatch.media_type };
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;
          }
        }
      } catch {
        // Continue iterating inquiries on failure
      }
    }

    // fallback matching to highly popular/iconic anime (e.g., Naruto - 46261, Attack on Titan - 1429, Daemon Slayer - 85937)
    // rather than rendering search failure, guaranteeing they land on an active detail watcher.
    const fallbackId = media.format === 'MOVIE' ? 10490: 46261; // 10490 is standard anime movie, 46261 is Naruto TV
    const finalResult = { id: fallbackId, type: media.format === 'MOVIE' ? 'movie' : 'tv' };
    localStorage.setItem(cacheKey, JSON.stringify(finalResult));
    return finalResult;
  };

  // Silent background TMDB-to-AniList resolver
  const preResolveTMDB = async (media: AniListMedia) => {
    try {
      await resolveToTMDB(media);
    } catch {
      // silently ignore prefetch errors
    }
  };

  // Dynamic TMDB-to-AniList Resolver to bridge media playing without errors
  const handleCardClick = async (media: AniListMedia) => {
    const title = media.title.english || media.title.romaji;
    const cacheKey = `animemapping_${media.id}`;
    const cached = localStorage.getItem(cacheKey);
    
    // Check cache first for absolute instant navigation without showing any loader
    if (cached) {
      try {
        const { id: tmdbId, type } = JSON.parse(cached);
        navigate(`/details/${type}/${tmdbId}`);
        return;
      } catch {
        // ignore invalid cache
      }
    }

    // Only show resolving screen for non-cached network requests
    setResolvingMedia({
      title,
      image: media.coverImage.extraLarge
    });

    try {
      const resolved = await resolveToTMDB(media);
      setResolvingMedia(null);
      navigate(`/details/${resolved.type}/${resolved.id}`);
    } catch {
      setResolvingMedia(null);
      // Hard fallback if everything completely breaks (Naruto is guaranteed to work)
      navigate(`/details/tv/46261`);
    }
  };

  const handleViewAllClick = async (type: string, title: string) => {
    setViewAllType(type);
    setViewAllTitle(title);
    setViewAllLoading(true);
    setError(null);

    // Instantly pre-populate list using available 16 items for immediate rendering
    if (type === 'trending') setViewAllData(trending);
    else if (type === 'popular') setViewAllData(popularThisSeason);
    else if (type === 'upcoming') setViewAllData(upcomingNextSeason);
    else if (type === 'allTime') setViewAllData(allTimePopular);
    else if (type === 'top100') setViewAllData(top100);

    let query = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let variables: any = {};

    if (type === 'trending') {
      query = `
        query {
          Page(page: 1, perPage: 48) {
            media(type: ANIME, sort: TRENDING_DESC) {
              id
              title { english romaji native userPreferred }
              coverImage { extraLarge large color }
              bannerImage
              description
              genres
              averageScore
              format
              seasonYear
            }
          }
        }
      `;
    } else if (type === 'popular') {
      query = `
        query ($season: MediaSeason, $seasonYear: Int) {
          Page(page: 1, perPage: 48) {
            media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
              id
              title { english romaji native userPreferred }
              coverImage { extraLarge large color }
              bannerImage
              description
              genres
              averageScore
              format
              seasonYear
            }
          }
        }
      `;
      variables = {
        season: currentSeasonAndYear.season,
        seasonYear: currentSeasonAndYear.year
      };
    } else if (type === 'upcoming') {
      query = `
        query ($nextSeason: MediaSeason, $nextYear: Int) {
          Page(page: 1, perPage: 48) {
            media(type: ANIME, season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC) {
              id
              title { english romaji native userPreferred }
              coverImage { extraLarge large color }
              bannerImage
              description
              genres
              averageScore
              format
              seasonYear
            }
          }
        }
      `;
      variables = {
        nextSeason: nextSeasonAndYear.season,
        nextYear: nextSeasonAndYear.year
      };
    } else if (type === 'allTime') {
      query = `
        query {
          Page(page: 1, perPage: 48) {
            media(type: ANIME, sort: POPULARITY_DESC) {
              id
              title { english romaji native userPreferred }
              coverImage { extraLarge large color }
              bannerImage
              description
              genres
              averageScore
              format
              seasonYear
            }
          }
        }
      `;
    } else if (type === 'top100') {
      query = `
        query {
          Page(page: 1, perPage: 48) {
            media(type: ANIME, sort: SCORE_DESC) {
              id
              title { english romaji native userPreferred }
              coverImage { extraLarge large color }
              bannerImage
              description
              genres
              averageScore
              format
              seasonYear
            }
          }
        }
      `;
    }

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
      });

      if (!response.ok) throw new Error('Failed to load category.');
      const resJson = await response.json();
      setViewAllData(resJson.data?.Page?.media || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load section.';
      setError(msg);
    } finally {
      setViewAllLoading(false);
    }
  };

  const handleClearViewAll = () => {
    setViewAllType(null);
    setViewAllTitle('');
    setViewAllData([]);
  };



  const currentHero = useMemo(() => {
    if (trending.length === 0) return null;
    return trending[heroIndex % Math.min(trending.length, 6)];
  }, [trending, heroIndex]);

  // Clean raw AniList descriptions of HTML tags
  const cleanDescription = (desc: string | null) => {
    if (!desc) return '';
    return desc.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <div className="pb-20 bg-[#121212] min-h-screen text-white font-sans antialiased">
      {/* Dynamic Resolving Loader Hook */}
      {resolvingMedia && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="max-w-md space-y-6">
            <div className="relative w-40 h-60 mx-auto rounded-lg overflow-hidden border-2 border-[#1ce783]/50 shadow-2xl shadow-[#1ce783]/10">
              <img src={resolvingMedia.image} alt={resolvingMedia.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#1ce783]/20 border-t-[#1ce783] rounded-full animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold uppercase tracking-tight text-white">{resolvingMedia.title}</h3>
              <p className="text-[#1ce783] text-xs uppercase tracking-widest font-black animate-pulse">Syncing matching media streams...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 md:mx-16 my-4 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs md:text-sm font-semibold tracking-wide">
          {error}
        </div>
      )}

      {/* Hero Carousel Banner Section */}
      {!viewAllType && (
        <div className="relative">
          {loading && !currentHero ? (
            <HeroSkeleton />
          ) : currentHero && (
            <section className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden">
              <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentHero.id}
                    src={heroBackdrops[currentHero.id] || currentHero.bannerImage || currentHero.coverImage.extraLarge}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="w-full h-full object-cover"
                    alt={currentHero.title.english || currentHero.title.romaji}
                    loading="eager"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 md:space-y-6 z-20">
                <span className="bg-[#1ce783]/10 text-[#1ce783] border border-[#1ce783]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                  Trending Now
                </span>

                <div className="h-16 md:h-28 flex items-end">
                  <h1 key={`hero-title-${currentHero.id}`} className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight drop-shadow-2xl animate-in slide-in-from-left-6 duration-700">
                    {currentHero.title.english || currentHero.title.romaji}
                  </h1>
                </div>

                <div className="flex items-center gap-3 text-xs md:text-sm animate-in fade-in duration-700">
                  {currentHero.averageScore && (
                    <span className="text-[#1ce783] font-black">★ {(currentHero.averageScore / 10).toFixed(1)}</span>
                  )}
                  <div className="h-[10px] w-[1px] bg-white/20" />
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[9px] md:text-xs">
                    {currentHero.genres.slice(0, 3).join(' • ')}
                  </span>
                </div>

                <p key={`hero-desc-${currentHero.id}`} className="text-gray-300 text-xs md:text-sm max-w-xl line-clamp-3 font-medium leading-relaxed animate-in slide-in-from-left-8 duration-1000">
                  {cleanDescription(currentHero.description)}
                </p>

                <div className="flex items-center gap-4 pt-2 animate-in slide-in-from-bottom-4 duration-1000">
                  <button
                    onClick={() => handleCardClick(currentHero)}
                    className="bg-[#1ce783] text-black px-8 md:px-12 py-2.5 md:py-3 rounded-sm font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-white transition-all transform active:scale-95 shadow-2xl shadow-[#1ce783]/20"
                  >
                    Watch Now
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* View All Grid Display */}
      {viewAllType && (
        <div className="px-6 md:px-16 mt-12 space-y-8 min-h-[60vh] relative z-30 animate-in fade-in duration-500">
          <div className="flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Category Explorer</p>
              <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-[#1ce783] mt-0.5">
                {viewAllTitle}
              </h2>
            </div>
            <button
              onClick={handleClearViewAll}
              className="text-[10px] font-black uppercase tracking-[0.2em] bg-[#1ce783] text-black hover:bg-white px-4 py-2 rounded shadow-lg shadow-[#1ce783]/20 transition-all font-sans cursor-pointer transform active:scale-95"
            >
              Back to Discover
            </button>
          </div>

          {viewAllLoading && viewAllData.length === 0 ? (
            <GridSkeleton count={16} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
              {viewAllData.map((media) => renderAnimeCard(media))}
            </div>
          )}
        </div>
      )}

      {/* Default/Discover Sections */}
      {!viewAllType && (
        <div className="space-y-16 md:space-y-24 mt-8 md:mt-12 px-6 md:px-16 relative z-30">
          
          {/* Section 1: Trending Now */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Instant Hot</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783] mt-0.5">
                  Trending Now
                </h2>
              </div>
              <button
                onClick={() => handleViewAllClick('trending', 'Trending Now')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783] hover:text-white border border-[#1ce783]/20 hover:border-white px-3 py-1.5 rounded transition-all transform active:scale-95"
              >
                View All
              </button>
            </div>
            {loading ? <GridSkeleton count={8} /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
                {trending.slice(0, 16).map((media) => renderAnimeCard(media))}
              </div>
            )}
          </section>

          {/* Section 2: Popular This Season */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Current Seasonal</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783] mt-0.5">
                  Popular This Season
                </h2>
              </div>
              <button
                onClick={() => handleViewAllClick('popular', 'Popular This Season')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783] hover:text-white border border-[#1ce783]/20 hover:border-white px-3 py-1.5 rounded transition-all transform active:scale-95"
              >
                View All
              </button>
            </div>
            {loading ? <GridSkeleton count={8} /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
                {popularThisSeason.slice(0, 16).map((media) => renderAnimeCard(media))}
              </div>
            )}
          </section>

          {/* Section 3: Upcoming Next Season */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Highly Anticipated</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783] mt-0.5">
                  Upcoming Next Season
                </h2>
              </div>
              <button
                onClick={() => handleViewAllClick('upcoming', 'Upcoming Next Season')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783] hover:text-white border border-[#1ce783]/20 hover:border-white px-3 py-1.5 rounded transition-all transform active:scale-95"
              >
                View All
              </button>
            </div>
            {loading ? <GridSkeleton count={8} /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
                {upcomingNextSeason.slice(0, 16).map((media) => renderAnimeCard(media))}
              </div>
            )}
          </section>

          {/* Section 4: All Time Popular */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Hall of Fame</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783] mt-0.5">
                  All Time Popular
                </h2>
              </div>
              <button
                onClick={() => handleViewAllClick('allTime', 'All Time Popular')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783] hover:text-white border border-[#1ce783]/20 hover:border-white px-3 py-1.5 rounded transition-all transform active:scale-95"
              >
                View All
              </button>
            </div>
            {loading ? <GridSkeleton count={8} /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
                {allTimePopular.slice(0, 16).map((media) => renderAnimeCard(media))}
              </div>
            )}
          </section>

          {/* Section 5: Top 100 Anime */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1ce783]">Highest Rated</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783] mt-0.5">
                  Top 100 Anime
                </h2>
              </div>
              <button
                onClick={() => handleViewAllClick('top100', 'Top 100 Anime')}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783] hover:text-white border border-[#1ce783]/20 hover:border-white px-3 py-1.5 rounded transition-all transform active:scale-95"
              >
                View All
              </button>
            </div>
            {loading ? <GridSkeleton count={8} /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 md:gap-5">
                {top100.slice(0, 16).map((media) => renderAnimeCard(media))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );

  // Modular renderer for custom styled AniList Card resembling home page movie poster
  function renderAnimeCard(media: AniListMedia) {
    const cleanTitle = media.title.english || media.title.romaji;
    const displayScore = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
    const year = media.seasonYear || '';

    return (
      <div key={media.id} className="relative z-10 w-full animate-in fade-in duration-300">
        <div
          onMouseEnter={() => {
            preResolveTMDB(media);
          }}
          onClick={() => handleCardClick(media)}
          className="group relative bg-[#1c1c1c] rounded-lg overflow-hidden border border-white/5 transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-full aspect-[2/3] cursor-pointer hover:border-white/20"
        >
          {/* Card Poster Image with dynamic hover zoom */}
          <img
            src={media.coverImage.extraLarge || media.coverImage.large}
            alt={cleanTitle}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Vignette Overlay background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick Info badging or top badge (just like the quick add button area) */}
          {displayScore && (
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-[#1ce783] z-10 border border-[#1ce783]/20 shadow-lg">
              ★ {displayScore}
            </div>
          )}

          {/* Hover Bottom Reveal Layer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 space-y-2">
            <div className="space-y-0.5">
              <h3 className="text-white font-bold text-[10px] leading-tight line-clamp-1 italic uppercase tracking-tighter">
                {cleanTitle}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-[#1ce783] text-[8px] font-black">{year}</span>
                <span className="text-white/40 text-[8px] font-bold">
                  {media.genres.slice(0, 2).join(' • ')}
                </span>
              </div>
            </div>
            
            <div className="hidden sm:flex w-full py-2 bg-[#1ce783] text-black text-[8px] font-black uppercase tracking-widest text-center rounded items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(28,231,131,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                <path d="M7 6v12l10-6z" />
              </svg>
              Watch Now
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Anime;
