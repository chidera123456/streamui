
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getSeasonEpisodes, fetchSimilar } from '../services/tmdbService';
import { Movie, Episode } from '../types';
import { BACKDROP_URL, IMG_URL, PLAYER_URL, TV_PLAYER_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import { useHistory } from '../hooks/useHistory';
import MediaCard from '../components/MediaCard';
import CommentSection from '../components/CommentSection';

const Details: React.FC = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [media, setMedia] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [autoPreviewActive, setAutoPreviewActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  
  const [similarMedia, setSimilarMedia] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addToHistory } = useHistory();
  
  const refreshTimerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id || !type) return;
    const loadMedia = async () => {
      setLoading(true);
      setSimilarMedia([]);
      setIsPlaying(false);
      setShowTrailer(false);
      setAutoPreviewActive(false);
      setShowRefreshHint(false);
      
      try {
        const data = await getDetails(Number(id), type);
        setMedia(data);
        
        if (type === 'tv' && data.number_of_seasons) {
          const epData = await getSeasonEpisodes(Number(id), 1);
          setEpisodes(epData);
        }

        loadRecommendations(Number(id), type);

        // Start Auto-Preview Timer
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = window.setTimeout(() => {
          setAutoPreviewActive(true);
        }, 3500); // Cinematic delay

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
    };
  }, [id, type]);

  useEffect(() => {
    if (playerLoading && isPlaying) {
      refreshTimerRef.current = window.setTimeout(() => {
        setShowRefreshHint(true);
      }, 8000);
    } else {
      setShowRefreshHint(false);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [playerLoading, isPlaying]);

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
    setCurrentEpisode(1);
  };

  const playMedia = (ep?: number) => {
    if (ep) {
      setCurrentEpisode(ep);
    }
    setPlayerLoading(true);
    setShowTrailer(false);
    setAutoPreviewActive(false); 
    setIsPlaying(true);
    setShowRefreshHint(false);
    
    if (media) {
      addToHistory(media, type === 'tv' ? currentSeason : undefined, ep || (type === 'tv' ? currentEpisode : undefined));
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextEpisode = async () => {
    if (type !== 'tv' || !media) return;

    const nextEp = currentEpisode + 1;
    const currentSeasonEpisodes = episodes.length;

    if (nextEp <= currentSeasonEpisodes) {
      playMedia(nextEp);
    } else if (currentSeason < (media.number_of_seasons || 0)) {
      const nextSeason = currentSeason + 1;
      setCurrentSeason(nextSeason);
      const data = await getSeasonEpisodes(Number(id), nextSeason);
      setEpisodes(data);
      setCurrentEpisode(1);
      playMedia(1);
    } else {
      setIsPlaying(false);
    }
  };

  const refreshPlayer = () => {
    setPlayerLoading(true);
    setShowRefreshHint(false);
    const currentIframe = document.querySelector('iframe');
    if (currentIframe) {
      const src = currentIframe.src;
      currentIframe.src = '';
      setTimeout(() => {
        currentIframe.src = src;
      }, 50);
    }
  };

  const inList = media ? isInWatchlist(media.id) : false;
  const trailer = media?.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') || 
                  media?.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));

  const embedUrl = type === 'movie' 
    ? `${PLAYER_URL}/${media?.id}`
    : `${TV_PLAYER_URL}/${media?.id}/${currentSeason}/${currentEpisode}`;

  const releaseYear = (media?.release_date || media?.first_air_date || '').substring(0, 4);

  // Construct YouTube URL with AUDIO ENABLED (mute=0) and origin parameters
  const backgroundTrailerUrl = trailer 
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&loop=1&playlist=${trailer.key}&origin=${window.location.origin}`
    : '';

  const hasNextEpisode = type === 'tv' && media && (currentEpisode < episodes.length || currentSeason < (media.number_of_seasons || 0));

  return (
    <div className="pt-16 min-h-screen pb-20 bg-[#040404]">
      {/* Hero / Main Player Section */}
      {isPlaying ? (
        <div className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden group/player">
          {playerLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
              <div className="w-10 md:w-16 h-10 md:h-16 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-[#1ce783] font-black uppercase italic tracking-[0.2em] text-[10px] md:text-xs animate-pulse">Syncing High-Speed Buffer...</p>
              {showRefreshHint && (
                <button 
                  onClick={refreshPlayer}
                  className="mt-8 bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all animate-in fade-in slide-in-from-bottom-2"
                >
                  Slow Connection? Refresh Stream
                </button>
              )}
            </div>
          )}
          <iframe 
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            onLoad={() => setPlayerLoading(false)}
            title="Streaming Player"
            loading="eager"
            referrerPolicy="origin"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          />
          
          <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity z-30">
            {hasNextEpisode && !playerLoading && (
              <button 
                onClick={handleNextEpisode}
                className="bg-[#1ce783] hover:bg-white text-black px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-md shadow-xl flex items-center gap-2"
              >
                Next Episode
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <button onClick={refreshPlayer} title="Refresh Buffer" className="bg-black/50 hover:bg-white hover:text-black p-2 rounded-full text-white transition-all backdrop-blur-md border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => setIsPlaying(false)} className="bg-black/50 hover:bg-red-600 p-2 rounded-full text-white transition-all backdrop-blur-md border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative h-[65vh] md:h-[90vh] w-full bg-black overflow-hidden shadow-2xl">
          {loading || !media ? (
            <div className="absolute inset-0 bg-[#0a0a0a] animate-pulse" />
          ) : (
            <>
              {/* Poster Layer */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-[1500ms] ${autoPreviewActive && trailer ? 'opacity-0' : 'opacity-100'}`}>
                <img 
                  src={`${BACKDROP_URL}${media.backdrop_path}`}
                  alt={media.title || media.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Background Trailer Layer with Audio */}
              {trailer && (
                <div className={`absolute inset-0 z-0 transition-opacity duration-[1500ms] overflow-hidden ${autoPreviewActive ? 'opacity-60' : 'opacity-0'}`}>
                  <iframe 
                    src={backgroundTrailerUrl}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] aspect-video pointer-events-none"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    title="Cinematic Preview"
                  />
                </div>
              )}

              {/* Static Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-transparent to-[#040404]/40 z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-[#040404]/40 to-transparent z-10" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 p-4 md:p-16 w-full max-w-5xl z-20">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4 animate-in slide-in-from-left-4 duration-700">
                  <span className="bg-[#1ce783] text-black px-2 md:px-3 py-0.5 rounded-sm text-[8px] md:text-[10px] font-black uppercase tracking-tighter">ZENSTREAM SELECTION</span>
                  <span className="text-white/80 text-[10px] md:text-xs font-bold">{releaseYear}</span>
                  <span className="bg-white/10 px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black">4K HDR</span>
                </div>
                
                <h1 className="text-3xl md:text-8xl font-black uppercase italic tracking-tighter mb-4 md:mb-8 leading-none drop-shadow-2xl animate-in slide-in-from-left-6 duration-700">
                  {media.title || media.name}
                </h1>
                
                <div className="flex flex-wrap gap-2 md:gap-4 animate-in slide-in-from-bottom-4 duration-1000">
                  <button 
                    onClick={() => playMedia()}
                    className="bg-white text-black px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-[#1ce783] transition-all transform active:scale-95 flex items-center gap-2 md:gap-3 uppercase tracking-widest shadow-2xl shadow-black/60"
                  >
                    Watch Now
                  </button>
                  
                  <button 
                    onClick={() => toggleWatchlist(media)}
                    className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-white/20 transition-all flex items-center gap-2 md:gap-3 uppercase tracking-widest"
                  >
                    {inList ? 'Saved' : 'Add To List'}
                  </button>

                  {trailer && !autoPreviewActive && (
                    <button 
                      onClick={() => setShowTrailer(true)}
                      className="bg-white/5 backdrop-blur-md text-white border border-white/5 px-6 md:px-8 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-white/10 transition-all uppercase tracking-widest hidden sm:block"
                    >
                      Trailer
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Details Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16">
          <div className="lg:col-span-2 space-y-8 md:space-y-12">
            <section>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <span className="text-[#1ce783] font-bold uppercase text-[10px] md:text-xs tracking-widest">Premium Content</span>
                <span className="text-gray-400 font-bold text-xs md:text-base">{releaseYear}</span>
                <div className="flex gap-2">
                  {media?.genres?.slice(0, 3).map(g => (
                    <span key={g.id} className="text-[#1ce783]/60 text-[8px] md:text-[10px] font-black uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-sm">
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-200 text-sm md:text-lg leading-relaxed">
                {media?.overview}
              </p>
            </section>

            {type === 'tv' && media && (
              <section className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 md:pb-4">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Episodes</h2>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">Season</span>
                    <select 
                      value={currentSeason} 
                      onChange={(e) => changeSeason(Number(e.target.value))}
                      className="bg-black border border-white/20 rounded px-3 md:px-4 py-1 md:py-1.5 text-white text-[10px] md:text-xs font-black uppercase outline-none focus:border-[#1ce783] transition-colors cursor-pointer"
                    >
                      {[...Array(media.number_of_seasons)].map((_, i) => (
                        <option key={i} value={i + 1}> {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-nowrap overflow-x-auto gap-3 md:gap-4 pb-4 custom-scrollbar scroll-smooth">
                  {episodes.map((ep) => (
                    <div 
                      key={ep.id} 
                      onClick={() => playMedia(ep.episode_number)}
                      className={`min-w-[200px] md:min-w-[320px] max-w-[200px] md:max-w-[320px] flex flex-col gap-2 md:gap-3 p-2 md:p-3 rounded-sm transition-all cursor-pointer group shrink-0 ${currentEpisode === ep.episode_number && isPlaying ? 'bg-[#1ce783]/10 border border-[#1ce783]/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                    >
                      <div className="w-full aspect-video relative rounded-sm overflow-hidden bg-black/40">
                        <img 
                          src={ep.still_path ? `${IMG_URL}${ep.still_path}` : 'https://via.placeholder.com/400x225/111/444?text=Preview'} 
                          alt={ep.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-[#1ce783] flex items-center justify-center text-black">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4.5 3a.5.5 0 00-.5.5v13a.5.5 0 00.757.429l11-6.5a.5.5 0 000-.858l-11-6.5A.5.5 0 004.5 3z" />
                              </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight truncate">{ep.name}</h4>
                          <span className="text-[8px] md:text-[10px] text-[#1ce783] font-bold">E{ep.episode_number}</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{ep.overview || "No description available for this episode."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <CommentSection 
                mediaId={media?.id || 0} 
                mediaType={type || 'movie'} 
                mediaTitle={media?.title || media?.name}
                currentEpisode={type === 'tv' ? currentEpisode : undefined}
              />
            </section>

            <section className="space-y-6 md:space-y-8 pt-12">
              <div className="border-b border-white/10 pb-3 md:pb-4">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">More Like <span className="text-[#1ce783]">This</span></h2>
              </div>
              {loadingSimilar ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-sm" />
                    ))}
                  </div>
              ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
                    {similarMedia.slice(0, 12).map((item) => (
                        <MediaCard key={item.id} media={item} />
                    ))}
                  </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1 space-y-8 md:space-y-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Original Language</p>
                  <p className="text-white font-black uppercase italic">{media?.original_language === 'en' ? 'English' : media?.original_language}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Popularity Score</p>
                  <div className="flex items-center gap-2">
                      <span className="text-white font-black text-xl italic">{media?.popularity.toFixed(0)}</span>
                      <span className="text-[#1ce783] text-[10px] font-black uppercase tracking-tighter">Trending</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Genres</p>
                  <div className="flex flex-wrap gap-2">
                      {media?.genres?.map(g => (
                        <span key={g.id} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase text-gray-300">
                          {g.name}
                        </span>
                      ))}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
