
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getSeasonEpisodes, fetchSimilar } from '../services/tmdbService';
import { Movie, Episode } from '../types';
import { BACKDROP_URL, IMG_URL, PLAYER_URL, TV_PLAYER_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import { useHistory } from '../hooks/useHistory';
import MediaCard from '../components/MediaCard';
import CommentSection from '../components/CommentSection';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function Details() {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [media, setMedia] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  
  const [autoPreviewActive, setAutoPreviewActive] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [similarMedia, setSimilarMedia] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addToHistory } = useHistory();
  
  const previewTimerRef = useRef<number | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
      
      try {
        const data = await getDetails(Number(id), type);
        setMedia(data);
        
        if (type === 'tv' && data.number_of_seasons) {
          const epData = await getSeasonEpisodes(Number(id), 1);
          setEpisodes(epData);
        }

        loadRecommendations(Number(id), type);

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
    };
  }, [id, type]);

  useEffect(() => {
    if (autoPreviewActive && iframeRef.current && window.YT && window.YT.Player) {
      ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0) {
              setAutoPreviewActive(false);
            }
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
    setCurrentEpisode(1);
  };

  const playMedia = (ep?: number) => {
    if (ep) {
      setCurrentEpisode(ep);
    }
    setPlayerLoading(true);
    setAutoPreviewActive(false); 
    setIsPlaying(true);
    
    if (media) {
      addToHistory(media, type === 'tv' ? currentSeason : undefined, ep || (type === 'tv' ? currentEpisode : undefined));
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inList = media ? isInWatchlist(media.id) : false;
  const trailer = media?.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') || 
                  media?.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));

  const embedUrl = type === 'movie' 
    ? `${PLAYER_URL}/${media?.id}`
    : `${TV_PLAYER_URL}/${media?.id}/${currentSeason}/${currentEpisode}`;

  const releaseYear = (media?.release_date || media?.first_air_date || '').substring(0, 4);
  
  const backgroundTrailerUrl = trailer 
    ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`
    : '';

  if (loading) return (
    <div className="min-h-screen pb-20 bg-[#040404] animate-in fade-in duration-500">
      <div className="h-[50vh] md:h-[90vh] w-full skeleton relative">
        <div className="absolute bottom-0 left-0 p-4 md:p-16 space-y-4 w-full max-w-5xl">
          <div className="w-48 h-6 bg-white/5 rounded-full"></div>
          <div className="w-full h-16 md:h-24 bg-white/5 rounded-sm"></div>
          <div className="flex gap-4">
            <div className="w-40 h-14 bg-white/5 rounded-sm"></div>
            <div className="w-40 h-14 bg-white/5 rounded-sm"></div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-12 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
           <div className="w-full h-4 bg-white/5 rounded-full"></div>
           <div className="w-full h-4 bg-white/5 rounded-full"></div>
           <div className="w-2/3 h-4 bg-white/5 rounded-full"></div>
           <div className="pt-12 grid grid-cols-3 md:grid-cols-5 gap-4">
             {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-[2/3] skeleton rounded-sm"></div>)}
           </div>
        </div>
        <div className="lg:col-span-1">
          <div className="w-full h-64 bg-white/5 rounded-3xl skeleton"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#040404]">
      {isPlaying ? (
        <div className="relative w-full aspect-video max-w-7xl mx-auto md:rounded-xl mt-0 md:mt-8 bg-black shadow-2xl overflow-hidden group/player">
          {playerLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
              <div className="w-12 h-12 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <iframe 
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            onLoad={() => setPlayerLoading(false)}
            title="Player"
          />
        </div>
      ) : (
        <div className="relative h-[60vh] md:h-[90vh] w-full bg-black overflow-hidden shadow-2xl">
          {!media ? null : (
            <>
              <div className={`absolute inset-0 z-0 transition-opacity duration-[1500ms] ${autoPreviewActive && trailer ? 'opacity-0' : 'opacity-100'}`}>
                <img 
                  src={`${BACKDROP_URL}${media.backdrop_path}`} 
                  alt="" 
                  className="w-full h-full object-cover object-top" 
                />
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

              <div className={`absolute inset-0 bg-gradient-to-t from-[#040404] via-transparent to-[#040404]/40 z-10 transition-opacity duration-1000 ${autoPreviewActive ? 'opacity-40' : 'opacity-100'}`} />
              <div className={`absolute inset-0 bg-gradient-to-r from-[#040404] via-[#040404]/40 to-transparent z-10 transition-opacity duration-1000 ${autoPreviewActive ? 'opacity-40' : 'opacity-100'}`} />
              
              <div className="absolute bottom-0 left-0 p-4 md:p-16 w-full max-w-5xl z-20">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3 md:mb-6 animate-in slide-in-from-left-4 duration-700">
                  <div className="flex items-center gap-1.5 md:gap-2 bg-black/40 backdrop-blur-md px-2 md:px-3 py-1 rounded-sm border border-white/10">
                    <span className="text-[#1ce783] text-[10px] md:text-sm font-black">★</span>
                    <span className="text-white text-[10px] md:text-sm font-black tracking-tighter">
                      {media.vote_average.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-4 w-[1px] bg-white/20"></div>
                  <span className="bg-[#1ce783] text-black px-2 md:px-3 py-0.5 md:py-1 rounded-sm text-[8px] md:text-[10px] font-black uppercase tracking-tighter">ZENSTREAM SELECTION</span>
                  <span className="text-white/80 text-[10px] md:text-xs font-bold">{releaseYear}</span>
                </div>
                <h1 className="text-3xl md:text-8xl font-black uppercase italic tracking-tighter mb-4 md:mb-8 leading-none drop-shadow-2xl animate-in slide-in-from-left-6 duration-700 line-clamp-2">
                  {media.title || media.name}
                </h1>
                <div className="flex flex-wrap gap-2 md:gap-4 animate-in slide-in-from-bottom-4 duration-1000">
                  <button onClick={() => playMedia()} className="bg-white text-black px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-[#1ce783] transition-all transform active:scale-95 flex items-center gap-2 md:gap-3 uppercase tracking-widest shadow-2xl">Watch Now</button>
                  <button onClick={() => toggleWatchlist(media)} className="bg-white/10 backdrop-blur-xl text-white border border-white/20 px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-white/20 transition-all flex items-center gap-2 md:gap-3 uppercase tracking-widest">{inList ? 'Saved' : 'Add To List'}</button>
                </div>
              </div>

              {trailer && (
                <div className="absolute top-24 right-4 md:right-16 z-30 flex flex-col items-center gap-2 md:gap-3">
                  <button 
                    onClick={() => setAutoPreviewActive(!autoPreviewActive)}
                    className={`relative w-10 h-10 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden shadow-2xl group/toggle ${
                      autoPreviewActive 
                        ? 'bg-[#1ce783] text-black scale-110 ring-4 ring-[#1ce783]/20' 
                        : 'bg-black/40 backdrop-blur-xl border border-white/20 text-white hover:bg-[#1ce783] hover:text-black'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-tr from-[#1ce783] to-cyan-500 opacity-0 group-hover/toggle:opacity-100 transition-opacity ${autoPreviewActive ? 'opacity-100' : ''}`} />
                    
                    <div className={`relative z-10 transition-transform duration-1000 ${autoPreviewActive ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                      {autoPreviewActive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-8 md:h-8">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 md:w-8 md:h-8">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      )}
                    </div>
                  </button>
                  <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-opacity duration-500 ${autoPreviewActive ? 'text-[#1ce783]' : 'text-white/40'}`}>
                    {autoPreviewActive ? 'Active' : 'Trailer'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16">
          <div className="lg:col-span-2 space-y-8 md:space-y-12">
            <section>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <span className="text-[#1ce783] font-bold uppercase text-[10px] md:text-xs tracking-widest">Premium Content</span>
                <span className="text-gray-400 font-bold text-xs md:text-base">{releaseYear}</span>
                <div className="flex gap-2">
                  {media?.genres?.slice(0, 3).map(g => (
                    <span key={g.id} className="text-[#1ce783]/60 text-[8px] md:text-[10px] font-black uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-sm">{g.name}</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-200 text-sm md:text-lg leading-relaxed">{media?.overview}</p>
            </section>

            {type === 'tv' && media && (
              <section className="space-y-6 md:space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 md:pb-4">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Episodes</h2>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">Season</span>
                    <select 
                      value={currentSeason} onChange={(e) => changeSeason(Number(e.target.value))}
                      className="bg-black border border-white/20 rounded px-3 md:px-4 py-1 md:py-1.5 text-white text-[10px] md:text-xs font-black uppercase outline-none focus:border-[#1ce783] transition-colors cursor-pointer"
                    >
                      {[...Array(media.number_of_seasons)].map((_, i) => (<option key={i} value={i + 1}>Season {i + 1}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-nowrap overflow-x-auto gap-3 md:gap-4 pb-4 custom-scrollbar scroll-smooth">
                  {episodes.map((ep) => (
                    <div 
                      key={ep.id} onClick={() => playMedia(ep.episode_number)}
                      className={`min-w-[200px] md:min-w-[320px] max-w-[200px] md:max-w-[320px] flex flex-col gap-2 md:gap-3 p-2 md:p-3 rounded-2xl transition-all cursor-pointer group shrink-0 ${currentEpisode === ep.episode_number && isPlaying ? 'bg-[#1ce783]/10 border border-[#1ce783]/40' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                    >
                      <div className="w-full aspect-video relative rounded-xl overflow-hidden bg-black/40">
                        <img src={ep.still_path ? `${IMG_URL}${ep.still_path}` : 'https://via.placeholder.com/400x225/111/444?text=Preview'} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                      </div>
                      <div className="px-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight truncate">{ep.name}</h4>
                          <span className="text-[8px] md:text-[10px] text-[#1ce783] font-black">EP {ep.episode_number}</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{ep.overview || "No description available."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <CommentSection mediaId={media?.id || 0} mediaType={type || 'movie'} mediaTitle={media?.title || media?.name} />
            
            <section className="space-y-6 md:space-y-8 pt-12">
              <div className="border-b border-white/10 pb-3 md:pb-4">
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Recommended</h2>
              </div>
              {loadingSimilar ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (<div key={i} className="aspect-[2/3] bg-white/5 skeleton rounded-sm" />))}
                  </div>
              ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
                    {similarMedia.slice(0, 12).map((item) => (<MediaCard key={item.id} media={item} />))}
                  </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1 space-y-8 md:space-y-10">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 backdrop-blur-xl">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Original Language</p>
                  <p className="text-white font-black uppercase italic text-lg">{media?.original_language === 'en' ? 'English' : media?.original_language}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Popularity Index</p>
                  <div className="flex items-center gap-3">
                      <span className="text-[#1ce783] font-black text-3xl italic">{media?.popularity.toFixed(0)}</span>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
