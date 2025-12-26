
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getSeasonEpisodes, findByTitle } from '../services/tmdbService';
import { getSimilarRecommendations } from '../services/geminiService';
import { Movie, Episode } from '../types';
import { BACKDROP_URL, IMG_URL, PLAYER_URL, TV_PLAYER_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import MediaCard from '../components/MediaCard';

const Details: React.FC = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const [media, setMedia] = useState<Movie | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [aiSuggestions, setAiSuggestions] = useState<{ movie: Movie; reason: string }[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    if (!id || !type) return;
    const loadMedia = async () => {
      setLoading(true);
      setAiSuggestions([]);
      setIsPlaying(false);
      try {
        const data = await getDetails(Number(id), type);
        setMedia(data);
        
        if (type === 'tv' && data.number_of_seasons) {
          const epData = await getSeasonEpisodes(Number(id), 1);
          setEpisodes(epData);
        }

        loadAIRecommendations(data.title || data.name || '', data.overview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMedia();
    window.scrollTo(0, 0);
  }, [id, type]);

  const loadAIRecommendations = async (title: string, overview: string) => {
    setLoadingAI(true);
    try {
      const suggestions = await getSimilarRecommendations(title, overview);
      
      const enrichedPromises = suggestions.map(async (s) => {
        const movieData = await findByTitle(s.title);
        if (movieData) return { movie: movieData, reason: s.reason };
        return null;
      });

      const results = (await Promise.all(enrichedPromises)).filter(r => r !== null) as { movie: Movie; reason: string }[];
      setAiSuggestions(results);
    } catch (err) {
      console.error("AI Recommendations failed", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const changeSeason = async (season: number) => {
    if (!id) return;
    setCurrentSeason(season);
    const data = await getSeasonEpisodes(Number(id), season);
    setEpisodes(data);
  };

  const playMedia = (ep?: number) => {
    if (ep) setCurrentEpisode(ep);
    setPlayerLoading(true);
    setIsPlaying(true);
    setShowTrailer(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTrailer = () => {
    setTrailerLoading(true);
    setShowTrailer(true);
  };

  const inList = media ? isInWatchlist(media.id) : false;
  const trailer = media?.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer') || 
                  media?.videos?.results?.find(v => v.site === 'YouTube' && (v.type === 'Teaser' || v.type === 'Clip'));

  const embedUrl = type === 'movie' 
    ? `${PLAYER_URL}/${media?.external_ids?.imdb_id || media?.id}`
    : `${TV_PLAYER_URL}/${media?.external_ids?.imdb_id || media?.id}&s=${currentSeason}&e=${currentEpisode}`;

  // Skeleton UI for Hero Section
  const HeroSkeleton = () => (
    <div className="relative h-[60vh] md:h-[75vh] w-full bg-[#0a0a0a] animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-5xl space-y-6">
        <div className="h-6 w-32 bg-white/10 rounded-full" />
        <div className="h-20 w-3/4 bg-white/10 rounded-3xl" />
        <div className="flex gap-4">
          <div className="h-14 w-40 bg-white/10 rounded-2xl" />
          <div className="h-14 w-40 bg-white/10 rounded-2xl" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-16 min-h-screen pb-20 bg-[#050505]">
      {/* Player Section */}
      {isPlaying ? (
        <div className="flex flex-col bg-black">
          <div className="relative w-full aspect-video bg-black z-10 border-b border-white/5">
            {playerLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-black uppercase italic tracking-widest text-xs">Initializing Secure Stream...</p>
              </div>
            )}
            <iframe 
              id="main-player-iframe"
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              onLoad={() => setPlayerLoading(false)}
              title="Video Player"
            />
            <button 
              onClick={() => setIsPlaying(false)}
              className="absolute top-6 right-6 bg-red-600 text-white p-3 rounded-full font-bold shadow-2xl hover:scale-110 active:scale-90 transition-all z-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          {loading || !media ? <HeroSkeleton /> : (
            <div className="relative h-[60vh] md:h-[75vh] overflow-hidden animate-in fade-in duration-700">
              <img 
                src={`${BACKDROP_URL}${media.backdrop_path}`}
                alt={media.title || media.name}
                className="w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-6 md:p-16 w-full max-w-5xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                    {type === 'movie' ? 'Motion Picture' : 'Television Series'}
                  </span>
                  <span className="text-yellow-500 font-black drop-shadow-lg">★ {media.vote_average.toFixed(1)}</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-none drop-shadow-2xl">
                  {media.title || media.name}
                </h1>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => playMedia()}
                    className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-red-500 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)]"
                  >
                    <span className="text-2xl">▶</span> PLAY NOW
                  </button>
                  
                  <button 
                    onClick={() => toggleWatchlist(media)}
                    className={`px-10 py-4 rounded-2xl font-black text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${inList ? 'bg-white text-black' : 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20'}`}
                  >
                    <span className="text-2xl">{inList ? '✓' : '+'}</span> {inList ? 'IN LIST' : 'WATCHLIST'}
                  </button>

                  {trailer && (
                    <button 
                      onClick={openTrailer}
                      className="bg-white/5 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-lg hover:bg-white/20 transition-all transform hover:scale-105"
                    >
                      TRAILER
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-xs font-black uppercase italic text-red-600 mb-6 tracking-[0.3em] flex items-center gap-4">
              <span className="h-[2px] w-8 bg-red-600"></span> STORYLINE
            </h2>
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
              </div>
            ) : (
              <p className="text-gray-300 text-xl leading-relaxed font-medium">{media?.overview}</p>
            )}
          </section>

          {type === 'tv' && media && (
            <section className="space-y-8 bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Season Selection</h2>
                <select 
                  value={currentSeason} 
                  onChange={(e) => changeSeason(Number(e.target.value))}
                  className="bg-black border-2 border-white/10 rounded-xl px-6 py-3 text-white font-bold outline-none focus:border-red-600 transition-all"
                >
                  {[...Array(media.number_of_seasons)].map((_, i) => (
                    <option key={i} value={i + 1}>Season {i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {episodes.map((ep) => (
                  <div 
                    key={ep.id} 
                    onClick={() => playMedia(ep.episode_number)}
                    className={`flex gap-5 p-4 rounded-2xl border transition-all cursor-pointer group ${currentEpisode === ep.episode_number && isPlaying ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'}`}
                  >
                    <div className="w-36 h-24 shrink-0 relative rounded-xl overflow-hidden bg-white/5">
                      <img 
                        src={ep.still_path ? `${IMG_URL}${ep.still_path}` : 'https://via.placeholder.com/300x200/111/444?text=StreamUI'} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt={ep.name}
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xl">▶</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[10px] text-red-500 font-black mb-1 uppercase tracking-widest">Episode {ep.episode_number}</p>
                      <h4 className="font-black text-base truncate uppercase italic tracking-tight">{ep.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-medium">{ep.overview || 'No description available for this episode.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI Recommendations */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-tr from-red-600 to-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/20">
                <span className="text-white text-xl font-bold">✨</span>
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-indigo-500">CURATED</span> ECHOES
              </h2>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {loadingAI ? (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[2/3] bg-white/5 animate-pulse rounded-2xl shadow-inner border border-white/5"></div>
                    <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded mx-auto" />
                  </div>
                ))
              ) : (
                aiSuggestions.slice(0, 5).map((item) => (
                  <div key={item.movie.id} className="relative group">
                    <MediaCard media={item.movie} />
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-600/95 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 pointer-events-none rounded-b-xl z-20 shadow-2xl">
                      <p className="text-white text-[8px] font-black leading-tight italic uppercase tracking-tighter">"{item.reason}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-8">
            <div>
              <p className="text-[10px] font-black text-red-600 uppercase mb-4 tracking-widest underline underline-offset-8">Information</p>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Primary Genres</span>
                  <div className="flex flex-wrap gap-2">
                    {loading ? (
                      <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
                    ) : (
                      media?.genres?.map(g => (
                        <span key={g.id} className="text-[11px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg uppercase italic">{g.name}</span>
                      ))
                    )}
                  </div>
                </div>
                {media?.runtime && (
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Running Time</span>
                    <span className="text-white font-black italic tracking-tighter">{media.runtime} MIN</span>
                  </div>
                )}
                {media?.number_of_seasons && (
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Episodes</span>
                    <span className="text-white font-black italic tracking-tighter">{media.number_of_episodes} EPISODES</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Reference ID</span>
                  <span className="text-white text-[10px] font-black opacity-50">{media?.external_ids?.imdb_id || media?.id}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="group relative rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl transition-transform hover:scale-[1.02] bg-white/5">
            {loading ? (
               <div className="aspect-[2/3] w-full bg-white/5 animate-pulse" />
            ) : (
              <>
                <img 
                  src={`${IMG_URL}${media?.poster_path}`}
                  alt={media?.title || media?.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                   <p className="text-white text-xs font-bold italic">Official Poster Artwork</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative w-full max-w-6xl aspect-video bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.3)] border border-white/10">
            {trailerLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[65]">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-black uppercase italic tracking-widest text-[10px]">Buffering Trailer...</p>
              </div>
            )}
            <button 
              onClick={() => setShowTrailer(false)}
              className="absolute top-6 right-6 z-[70] bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold hover:scale-110 active:scale-95 transition-all shadow-xl"
            >
              ✕
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1&color=white`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setTrailerLoading(false)}
              title="YouTube Trailer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Details;
