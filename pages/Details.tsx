
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getSeasonEpisodes, fetchSimilar } from '../services/tmdbService';
import { Movie, Episode } from '../types';
import { BACKDROP_URL, IMG_URL, PLAYER_URL, TV_PLAYER_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import { useHistory } from '../hooks/useHistory';
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
  const [loading, setLoading] = useState(true);
  
  const [similarMedia, setSimilarMedia] = useState<Movie[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addToHistory } = useHistory();

  useEffect(() => {
    if (!id || !type) return;
    const loadMedia = async () => {
      setLoading(true);
      setSimilarMedia([]);
      setIsPlaying(false);
      setShowTrailer(false);
      try {
        const data = await getDetails(Number(id), type);
        setMedia(data);
        
        if (type === 'tv' && data.number_of_seasons) {
          const epData = await getSeasonEpisodes(Number(id), 1);
          setEpisodes(epData);
        }

        loadRecommendations(Number(id), type);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMedia();
    window.scrollTo(0, 0);
  }, [id, type]);

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
    setIsPlaying(true);
    
    // Add to history
    if (media) {
      addToHistory(media, type === 'tv' ? currentSeason : undefined, ep);
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

  return (
    <div className="pt-16 min-h-screen pb-20 bg-[#040404]">
      {/* Player Section */}
      {isPlaying ? (
        <div className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden">
          {playerLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
              <div className="w-8 md:w-12 h-8 md:h-12 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[#1ce783] font-black uppercase italic tracking-widest text-[8px] md:text-[10px]">Establishing ZenConnection...</p>
            </div>
          )}
          <iframe 
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            onLoad={() => setPlayerLoading(false)}
            title="Streaming Player"
          />
          <button 
            onClick={() => setIsPlaying(false)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 rounded-full text-white transition-all z-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : showTrailer && trailer ? (
        <div className="relative w-full aspect-video bg-black shadow-2xl overflow-hidden">
           <iframe 
            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            title="Trailer"
          />
          <button 
            onClick={() => setShowTrailer(false)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 rounded-full text-white transition-all z-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          {loading || !media ? (
            <div className="relative h-[40vh] md:h-[75vh] w-full bg-[#0a0a0a] animate-pulse">
               <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-transparent to-transparent" />
            </div>
          ) : (
            <div className="relative h-[40vh] md:h-[75vh] overflow-hidden">
              <img 
                src={`${BACKDROP_URL}${media.backdrop_path}`}
                alt={media.title || media.name}
                className="w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#040404] via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 p-4 md:p-16 w-full max-w-5xl">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                  <span className="bg-[#1ce783] text-black px-2 md:px-3 py-0.5 rounded-sm text-[8px] md:text-[10px] font-black uppercase tracking-tighter">ZENSTREAM SELECTION</span>
                  <span className="text-white/80 text-[10px] md:text-xs font-bold">{releaseYear}</span>
                  <span className="bg-white/10 px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black">4K HDR</span>
                </div>
                <h1 className="text-3xl md:text-8xl font-black uppercase italic tracking-tighter mb-4 md:mb-6 leading-none drop-shadow-2xl">
                  {media.title || media.name}
                </h1>
                <div className="flex flex-wrap gap-2 md:gap-4">
                  <button 
                    onClick={() => playMedia()}
                    className="bg-white text-black px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-[#1ce783] transition-all transform active:scale-95 flex items-center gap-2 md:gap-3 uppercase tracking-widest"
                  >
                    Watch Now
                  </button>
                  
                  <button 
                    onClick={() => toggleWatchlist(media)}
                    className="bg-white/10 backdrop-blur-md text-white border border-white/10 px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-white/20 transition-all flex items-center gap-2 md:gap-3 uppercase tracking-widest"
                  >
                    {inList ? 'Saved' : 'Add To List'}
                  </button>

                  {trailer && (
                    <button 
                      onClick={() => setShowTrailer(true)}
                      className="bg-white/5 backdrop-blur-md text-white border border-white/5 px-6 md:px-8 py-3 md:py-4 rounded-sm font-black text-xs md:text-lg hover:bg-white/10 transition-all uppercase tracking-widest hidden sm:block"
                    >
                      Trailer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16">
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
            {/* Clamped description on mobile for better usability */}
            <p className="text-gray-200 text-sm md:text-lg leading-relaxed line-clamp-3 md:line-clamp-none">
              {media?.overview}
            </p>
          </section>

          {/* Episode List Section */}
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

          {/* Recommendations Section */}
          <section className="space-y-6 md:space-y-8">
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

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8 md:space-y-10">
           <div className="bg-white/5 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
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
  );
};

export default Details;
