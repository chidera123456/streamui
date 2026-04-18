
import React, { memo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useGenres } from '../context/GenreContext';
import { IMG_URL, BACKDROP_URL } from '../constants';
import { fetchTrailer } from '../services/tmdbService';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  media: Movie;
  priority?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
}

const MediaCard: React.FC<Props> = memo(({ media, priority = false, onRemove }) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { getGenreNames } = useGenres();
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  
  const handleMouseEnter = () => {
    hoverTimerRef.current = window.setTimeout(async () => {
      const key = await fetchTrailer(media.id, media.media_type || 'movie');
      setTrailerKey(key);
      setShowPreview(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowPreview(false);
  };

  if (!media) return null;

  const title = media.title || media.name || 'Unknown Title';
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path 
    ? `${IMG_URL}${media.poster_path}`
    : `https://via.placeholder.com/342x513/111/444?text=${encodeURIComponent(title || 'N/A')}`;

  const inList = isInWatchlist(media.id);
  const genres = getGenreNames(media.genre_ids || []).slice(0, 2);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  return (
    <div 
      className={`relative transition-all duration-300 ${showPreview ? 'z-[110]' : 'z-10'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/details/${media.media_type}/${media.id}`}>
        <div 
          className="group relative bg-[#1c1c1c] rounded-lg overflow-hidden border border-white/5 transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-full aspect-[2/3]"
        >
          <img 
            src={poster} 
            alt={title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick Add Button */}
          <button 
            onClick={handleWatchlist}
            className={`absolute top-2 left-2 z-20 p-1.5 rounded-full backdrop-blur-md border transition-all duration-300 transform hover:scale-110 active:scale-90 ${
              inList 
                ? 'bg-[#1ce783] border-[#1ce783] text-black shadow-lg shadow-[#1ce783]/20' 
                : 'bg-black/40 border-white/20 text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            {inList ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            )}
          </button>

          {/* Remove Button (If handler provided) */}
          {onRemove && (
            <button 
              onClick={onRemove}
              className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 hover:text-white transition-all transform active:scale-90 opacity-0 group-hover:opacity-100 border border-white/10"
              title="Remove from history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
             <h3 className="text-white font-bold text-[10px] leading-tight mb-0.5 line-clamp-1 italic uppercase tracking-tighter">{title}</h3>
             <div className="flex items-center justify-between">
                <span className="text-[#1ce783] text-[8px] font-black">{year}</span>
                <span className="text-white/40 text-[8px] font-bold">★ {media.vote_average.toFixed(1)}</span>
             </div>
          </div>
        </div>
      </Link>

      {/* Glossy Preview Tile */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 0 }}
            animate={{ opacity: 1, scale: 1.1, y: -20 }}
            exit={{ opacity: 0, scale: 0.8, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[260px] md:w-[340px] bg-black/40 backdrop-blur-2xl rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.1)] border border-white/20 overflow-hidden z-[200] pointer-events-none"
          >
            <div className="relative aspect-video w-full bg-black/80 overflow-hidden">
              {trailerKey ? (
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&showinfo=0`}
                  className="absolute inset-0 w-full h-full scale-[1.35] pointer-events-none translate-y-[-2px]"
                  frameBorder="0"
                  allow="autoplay"
                />
              ) : (
                <img 
                  src={`${BACKDROP_URL}${media.backdrop_path}`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            <div className="p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase italic text-white tracking-tighter truncate pr-2">{title}</h4>
                <span className="text-[#1ce783] text-[10px] font-black">★ {media.vote_average.toFixed(1)}</span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {genres.map(g => (
                  <span key={g} className="text-[7px] font-black uppercase tracking-widest text-white/60 border border-white/20 px-1.5 py-0.5 rounded-sm bg-white/10 backdrop-blur-md">
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-[9px] text-gray-300 font-medium leading-relaxed line-clamp-2">
                {media.overview || "No description available."}
              </p>
              
              <div className="pt-1 flex items-center justify-between border-t border-white/5 mt-2">
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{year} • {media.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                 <div className="h-[2px] w-8 bg-[#1ce783]/60 rounded-full shadow-[0_0_10px_rgba(28,231,131,0.5)]"></div>
              </div>

              {/* Internal Gloss Highlight */}
              <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            </div>
            
            {/* Main Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MediaCard;
