
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDetails, getSeasonEpisodes, fetchSimilar, fetchLogos, getFromCache } from '../services/tmdbService';
import { Movie, Episode } from '../types';
import { BACKDROP_URL, IMG_URL, LOGO_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import { useHistory } from '../hooks/useHistory';
import MediaCard from '../components/MediaCard';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const Details: React.FC = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const navigate = useNavigate();
  const { history, addToHistory } = useHistory();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [media, setMedia] = useState<Movie | null>(null);
  const [mediaLogo, setMediaLogo] = useState<string | null>(() => {
    // Attempt to pre-load from cache if available
    const cacheKey = `logos-${type}-${id}`;
    const cached = getFromCache(cacheKey);
    if (cached && cached.logos && cached.logos.length > 0) {
      const englishLogo = (cached.logos as { iso_639_1: string, file_path: string }[]).find(l => l.iso_639_1 === 'en');
      const logo = englishLogo || cached.logos[0];
      return logo.file_path;
    }
    return null;
  });
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState('');
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setPlayerLoading] = useState(true);
  const [autoPreviewActive, setAutoPreviewActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [similarMedia, setSimilarMedia] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  
  const previewTimerRef = useRef<number | null>(null);
  const sleepIntervalRef = useRef<number | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerIframeRef = useRef<HTMLIFrameElement>(null);
  const episodeListRef = useRef<HTMLDivElement>(null);

  const isTv = type?.toLowerCase() === 'tv';

  const lastWatched = useMemo(() => {
    if (!isTv || !history) return null;
    return history.find(h => h.media_id === Number(id));
  }, [history, id, isTv]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    if (!id || !type) return;
    
    const loadMedia = async () => {
      setLoading(true);
      setSimilarMedia([]);
      setIsPlaying(false);
      setAutoPreviewActive(false);
      setSleepTimeRemaining(null);
      
      try {
        const data = await getDetails(Number(id), type as 'movie' | 'tv');
        setMedia(data);
        
        fetchLogos(Number(id), type as 'movie' | 'tv').then(setMediaLogo);
        
        const initialSeason = lastWatched?.season || 1;
        const initialEpisode = lastWatched?.episode || 1;
        
        setCurrentSeason(initialSeason);
        setCurrentEpisode(initialEpisode);

        if (isTv && data.number_of_seasons) {
          const epData = await getSeasonEpisodes(Number(id), initialSeason);
          setEpisodes(epData);
          
          if (initialSeason < data.number_of_seasons) {
            getSeasonEpisodes(Number(id), initialSeason + 1);
          }
        }

        loadRecommendations(Number(id), type as 'movie' | 'tv');

        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = window.setTimeout(() => {
          setAutoPreviewActive(true);
        }, 3500);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadMedia();
    window.scrollTo(0, 0);

    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (ytPlayerRef.current) ytPlayerRef.current.destroy();
      if (sleepIntervalRef.current) window.clearInterval(sleepIntervalRef.current);
    };
  }, [id, type]);

  useEffect(() => {
    if (episodes.length > 0 && episodeListRef.current) {
      const activeEl = episodeListRef.current.querySelector(`[data-episode="${currentEpisode}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [episodes, currentEpisode]);

  useEffect(() => {
    if (sleepTimeRemaining !== null && sleepTimeRemaining > 0 && isPlaying) {
      sleepIntervalRef.current = window.setInterval(() => {
        setSleepTimeRemaining(prev => {
          if (prev !== null && prev <= 1) {
            setIsPlaying(false);
            setAutoPreviewActive(false);
            if (sleepIntervalRef.current) window.clearInterval(sleepIntervalRef.current);
            navigate('/');
            return null;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      if (sleepIntervalRef.current) window.clearInterval(sleepIntervalRef.current);
    }
    return () => { if (sleepIntervalRef.current) window.clearInterval(sleepIntervalRef.current); };
  }, [sleepTimeRemaining, isPlaying, navigate]);

  useEffect(() => {
    if (autoPreviewActive && iframeRef.current && window.YT && window.YT.Player) {
      ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0) setAutoPreviewActive(false);
          }
        }
      });
    }
  }, [autoPreviewActive]);

  const loadRecommendations = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    setLoadingSimilar(true);
    try {
      const results = await fetchSimilar(mediaId, mediaType);
      setSimilarMedia(results);
    } catch (err) {
      console.error("Recommendations failed", err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const changeSeason = async (season: number) => {
    if (!id) return;
    setCurrentSeason(season);
    const data = await getSeasonEpisodes(Number(id), season);
    setEpisodes(data);
    const resumeEp = (lastWatched?.season === season) ? lastWatched.episode || 1 : 1;
    setCurrentEpisode(resumeEp);
    
    if (media && season < media.number_of_seasons!) getSeasonEpisodes(Number(id), season + 1);
  };

  const playMedia = (ep?: number) => {
    const epToPlay = ep || currentEpisode;
    if (ep) setCurrentEpisode(ep);
    
    setPlayerLoading(true);
    setAutoPreviewActive(false); 
    setIsPlaying(true);
    
    if (media) {
      addToHistory(media, isTv ? currentSeason : undefined, epToPlay);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextEpisode = () => {
    if (currentEpisode < episodes.length) {
      playMedia(currentEpisode + 1);
    } else if (media && currentSeason < (media.number_of_seasons || 0)) {
      changeSeason(currentSeason + 1).then(() => playMedia(1));
    }
  };

  const handleSetSleepTimer = (minutes: number | null) => {
    setSleepTimeRemaining(minutes ? minutes * 60 : null);
    setShowTimerMenu(false);
  };

  const isEpisodeWatched = (epNumber: number) => {
    if (!lastWatched) return false;
    if (lastWatched.season! > currentSeason) return true;
    if (lastWatched.season === currentSeason && lastWatched.episode! >= epNumber) return true;
    return false;
  };

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearchQuery.trim()) return episodes;
    const q = episodeSearchQuery.toLowerCase();
    return episodes.filter(ep => 
      ep.name.toLowerCase().includes(q) || 
      `episode ${ep.episode_number}`.includes(q) || 
      ep.episode_number.toString() === q
    );
  }, [episodes, episodeSearchQuery]);

  const inList = media ? isInWatchlist(media.id) : false;
  const trailer = media?.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') || 
                  media?.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));

  const embedUrl = useMemo(() => {
    const tmdbId = id;
    const params = "color=1db954&autoPlay=true&nextEpisode=true&episodeSelector=true";
    
    if (isTv) {
      return `https://www.vidking.net/embed/tv/${tmdbId}/${currentSeason}/${currentEpisode}?${params}`;
    }
    return `https://www.vidking.net/embed/movie/${tmdbId}?${params}`;
  }, [id, currentSeason, currentEpisode, isTv]);

  const releaseYear = (media?.release_date || media?.first_air_date || '').substring(0, 4);
  const backgroundTrailerUrl = trailer 
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`
    : '';

  const handleLandscape = async () => {
    const target = playerIframeRef.current || iframeRef.current;
    if (!target) return;
    
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen();
        } else if ((target as any).msRequestFullscreen) {
          await (target as any).msRequestFullscreen();
        }

        if (window.screen?.orientation?.lock) {
          await (window.screen.orientation as any).lock('landscape').catch(() => {
            console.log("Orientation lock not supported or failed");
          });
        }
      }
    } catch (err) {
      console.error("Landscape transition failed:", err);
    }
  };

  return (
    <div className="min-h-screen pt-0 md:pt-20 pb-20 bg-[#121212]">
      <div className="relative h-[60vh] md:h-[90vh] w-full bg-[#121212] overflow-hidden shadow-2xl group/hero">
        {loading || !media ? (
          <div className="absolute inset-0 bg-[#181818] animate-pulse" />
        ) : (
          <div className="w-full h-full relative">
            {/* Background Layer (Player or Preview) */}
            {isPlaying ? (
              <div className="w-full h-full group/player relative animate-in fade-in duration-500">
                <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleLandscape}
                      className="bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-[#1ce783] hover:text-black p-2 rounded-full md:hidden transition-all"
                      title="Landscape Mode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowTimerMenu(!showTimerMenu)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showTimerMenu || sleepTimeRemaining !== null ? 'bg-[#1ce783] text-black shadow-lg shadow-[#1ce783]/20' : 'bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white/10'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </button>

                      {showTimerMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#0c0c0c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest p-2 mb-1">Set Sleep Timer</p>
                          {[1, 15, 30, 45, 60].map(mins => (
                            <button key={mins} onClick={() => handleSetSleepTimer(mins)} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-[#1ce783] hover:text-black transition-all text-xs font-black uppercase tracking-widest text-gray-300">
                              {mins} {mins === 1 ? 'Minute' : 'Minutes'}
                            </button>
                          ))}
                          <button onClick={() => handleSetSleepTimer(null)} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-500/20 text-red-500 transition-all text-xs font-black uppercase tracking-widest mt-1 border-t border-white/5 pt-2">Turn Off</button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isTv && (
                      <button 
                        onClick={nextEpisode}
                        className="bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-[#1ce783] hover:text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Next Episode
                      </button>
                    )}
                  </div>
                </div>

                <iframe 
                  key={embedUrl}
                  ref={playerIframeRef}
                  src={embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  onLoad={() => setPlayerLoading(false)}
                  title="Player"
                />
              </div>
            ) : (
              <>
                <div className={`absolute inset-0 z-0 transition-opacity duration-[1500ms] ${autoPreviewActive && trailer ? 'opacity-0' : 'opacity-100'}`}>
                  <img src={`${BACKDROP_URL}${media.backdrop_path}`} alt="" className="w-full h-full object-cover object-top" />
                </div>
                {trailer && autoPreviewActive && (
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <iframe 
                      ref={iframeRef}
                      src={backgroundTrailerUrl}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full scale-125 md:scale-105 pointer-events-none"
                      frameBorder="0" allow="autoplay; encrypted-media" title="Cinematic Preview"
                    />
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-[#121212]/40 z-10 transition-opacity duration-1000 ${autoPreviewActive ? 'opacity-40' : 'opacity-100'}`} />
                <div className={`absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/40 to-transparent z-10 transition-opacity duration-1000 ${autoPreviewActive ? 'opacity-40' : 'opacity-100'}`} />
              </>
            )}

            {trailer && (
              <div className={`absolute top-6 right-6 md:top-24 md:right-16 z-30 flex flex-col items-center gap-2 md:gap-3 transition-all duration-700 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <button 
                  onClick={() => setAutoPreviewActive(!autoPreviewActive)}
                  className={`relative w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden shadow-2xl group/toggle ${autoPreviewActive ? 'bg-[#1ce783] text-black scale-110 ring-4 ring-[#1ce783]/20' : 'bg-black/40 backdrop-blur-xl border border-white/20 text-white hover:bg-[#1ce783] hover:text-black'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-tr from-[#1ce783] to-cyan-500 opacity-0 group-hover/toggle:opacity-100 transition-opacity ${autoPreviewActive ? 'opacity-100' : ''}`} />
                  <div className="relative z-10">
                    {autoPreviewActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-8 md:h-8">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-8 md:h-8">
                        <polygon points="5 3 19 12 5 21" />
                      </svg>
                    )}
                  </div>
                </button>
                <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-opacity duration-500 ${autoPreviewActive ? 'text-[#1ce783]' : 'text-white/40'}`}>
                  {autoPreviewActive ? 'Active' : 'Trailer'}
                </span>
              </div>
            )}

            {/* Persistent Metadata Layer */}
            <div className={`absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-5xl z-20 transition-all duration-700 ${isPlaying ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
              {mediaLogo && (
                <img 
                  src={`${LOGO_URL}${mediaLogo}`} 
                  alt={media.title || media.name}
                  className={`h-16 md:h-32 lg:h-48 w-auto object-contain animate-in slide-in-from-left-6 duration-700 drop-shadow-2xl mb-6 md:mb-8 transition-all duration-700 ${isPlaying ? 'h-10 md:h-20 mb-2' : ''}`}
                  onError={() => setMediaLogo(null)}
                  fetchPriority="high"
                />
              )}
              {!mediaLogo && (
                <h1 className={`text-3xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 md:mb-8 leading-none drop-shadow-2xl animate-in slide-in-from-left-6 duration-700 line-clamp-2 transition-all duration-700 opacity-20 ${isPlaying ? 'text-xl md:text-4xl mb-2' : ''}`}>
                  {media.title || media.name}
                </h1>
              )}
              <div className={`flex items-center gap-3 md:gap-4 mb-6 animate-in slide-in-from-left-4 duration-700 transition-all duration-700 ${isPlaying ? 'mb-0' : ''}`}>
                <span className="text-[#1ce783] text-sm md:text-xl font-black flex items-center gap-1 drop-shadow-[0_0_10px_rgba(28,231,131,0.5)]">★ {media.vote_average.toFixed(1)}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <span className="text-white font-black text-xs md:text-sm uppercase tracking-widest">{releaseYear}</span>
                {lastWatched && !isPlaying && (
                  <span className="ml-2 px-3 py-1 bg-[#1ce783] text-black text-[9px] font-black uppercase rounded-full animate-pulse">Resuming S{currentSeason}:E{currentEpisode}</span>
                )}
              </div>
              {!isPlaying && (
                <div className="flex flex-nowrap gap-2 md:gap-4 animate-in slide-in-from-bottom-4 duration-1000">
                  <button onClick={() => playMedia()} className="flex-1 md:flex-none bg-white text-black px-4 md:px-10 py-3 md:py-4 rounded-sm font-black text-[10px] md:text-lg hover:bg-[#1ce783] transition-all transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 uppercase tracking-widest shadow-2xl whitespace-nowrap">
                    {lastWatched ? 'Continue' : 'Watch Now'}
                  </button>
                  <button onClick={() => toggleWatchlist(media)} className="flex-1 md:flex-none bg-white/10 backdrop-blur-xl text-white border border-white/20 px-4 md:px-10 py-3 md:py-4 rounded-sm font-black text-[10px] md:text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 md:gap-3 uppercase tracking-widest whitespace-nowrap">
                    {inList ? 'Saved' : 'Add To List'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-16 py-10 md:py-16">
        <div className="space-y-12 md:space-y-16">
          {media && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <span className="text-[#1ce783] font-bold uppercase text-[10px] md:text-xs tracking-widest">IMDb Score ★ {media.vote_average.toFixed(1)}</span>
                  <span className="text-gray-400 font-bold text-xs md:text-base">{releaseYear}</span>
                  <div className="flex gap-2">
                    {media.genres?.slice(0, 3).map(g => (
                      <span key={g.id} className="text-[#1ce783]/60 text-[9px] md:text-[10px] font-black uppercase tracking-tighter bg-white/5 px-2.5 py-1 rounded-md">{g.name}</span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-200 text-sm md:text-lg leading-relaxed max-w-5xl">{media.overview}</p>
            </section>
          )}

          {isTv && media && (
            <section className="space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Episodes</h2>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1ce783]"></span>
                    <span className="text-[10px] font-black text-[#1ce783] uppercase tracking-widest">S{currentSeason}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 md:gap-6">
                  {/* Episode Search Bar */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 group-focus-within:text-[#1ce783] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input 
                      type="text"
                      placeholder="Search episodes..."
                      value={episodeSearchQuery}
                      onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-white outline-none focus:border-[#1ce783]/50 focus:bg-white/10 transition-all w-40 md:w-64"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Season</span>
                    <select 
                      value={currentSeason} onChange={(e) => {
                        changeSeason(Number(e.target.value));
                        setEpisodeSearchQuery(''); // Reset search when changing season
                      }}
                      className="bg-black border border-white/20 rounded px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-black uppercase outline-none focus:border-[#1ce783] transition-colors cursor-pointer text-white"
                    >
                      {[...Array(media.number_of_seasons)].map((_, i) => (<option key={i} value={i + 1}>Season {i + 1}</option>))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div 
                ref={episodeListRef}
                className="flex flex-nowrap overflow-x-auto gap-4 md:gap-6 pb-6 hide-scrollbar scroll-smooth snap-x snap-mandatory"
              >
                {filteredEpisodes.length > 0 ? (
                  filteredEpisodes.map((ep) => {
                    const watched = isEpisodeWatched(ep.episode_number);
                    const isActive = currentEpisode === ep.episode_number && isPlaying;
                    return (
                      <div 
                        key={ep.id} 
                        data-episode={ep.episode_number}
                        onClick={() => playMedia(ep.episode_number)}
                        className={`min-w-[260px] md:min-w-[340px] max-w-[260px] md:max-w-[340px] flex flex-col gap-3 p-3 rounded-2xl transition-all cursor-pointer group shrink-0 snap-center border-2 ${isActive ? 'bg-[#1ce783]/10 border-[#1ce783]' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'}`}
                      >
                        <div className="w-full aspect-video relative rounded-xl overflow-hidden bg-black/40">
                          <img src={ep.still_path ? `${IMG_URL}${ep.still_path}` : 'https://via.placeholder.com/400x225/111/444?text=Preview'} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 bg-[#1ce783]/20' : ''}`}>
                            <div className={`p-3 rounded-full ${isActive ? 'bg-[#1ce783] text-black' : 'bg-white/20 backdrop-blur-md text-white'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                          </div>
                          {watched && !isActive && (
                            <div className="absolute top-2 right-2 bg-[#1ce783] text-black p-1 rounded-full shadow-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#1ce783] animate-pulse"></div>
                          )}
                        </div>
                        <div className="px-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-[12px] md:text-sm font-black text-white uppercase tracking-tight truncate flex-1 pr-4">{ep.name}</h4>
                            <span className={`text-[10px] font-black ${isActive ? 'text-[#1ce783]' : 'text-gray-500'} shrink-0`}>EP {ep.episode_number}</span>
                          </div>
                          <p className="text-[10px] md:text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">{ep.overview || "No description available."}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center w-full py-12 text-center">
                    <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.3em]">No episodes match your search</p>
                    <button onClick={() => setEpisodeSearchQuery('')} className="mt-2 text-[#1ce783] text-[9px] font-black uppercase tracking-widest hover:underline">Clear Search</button>
                  </div>
                )}
                <div className="min-w-[40px] shrink-0"></div>
              </div>
            </section>
          )}

          <section className="space-y-8 pt-4">
            <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Recommended</h2>
            </div>
            {loadingSimilar ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (<div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-xl" />))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {similarMedia.filter(Boolean).slice(0, 16).map((item) => (<MediaCard key={item.id} media={item} />))}
                </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Details;
