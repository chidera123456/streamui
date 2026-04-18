
import React, { memo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
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
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ v: 'down', h: 'right' });
  const hoverTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);

    // Fade & Scale interaction: POP into place with 150ms delay
    hoverTimerRef.current = window.setTimeout(async () => {
      if (!isHoveredRef.current) return;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isMobile = screenWidth < 768;
        
        // Modal estimated dimensions (1.3x card width)
        const previewWidth = rect.width * 1.3;
        const previewHeight = 450; // Estimated max height

        if (isMobile) {
          setPreviewPosition({ v: 'down', h: 'center' });
        } else {
          const spaceRight = screenWidth - rect.right;
          const spaceBottom = screenHeight - rect.bottom;
          
          const flipH = spaceRight < previewWidth / 2 + 20;
          const flipV = spaceBottom < previewHeight / 2 + 20;

          setPreviewPosition({
            v: flipV ? 'up' : 'down',
            h: flipH ? 'left' : 'right'
          });
        }
      }

      try {
        const key = await fetchTrailer(media.id, media.media_type || 'movie');
        if (isHoveredRef.current) {
          setTrailerKey(key);
          setShowPreview(true);
        }
      } catch (err) {
        console.error("Trailer fetch error:", err);
      }
    }, 150);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    setShowPreview(false);
    setTrailerKey(null);
    setIsVideoLoaded(false);
  };

  if (!media) return null;

  const title = media.title || media.name || 'Unknown Title';
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path 
    ? `${IMG_URL}${media.poster_path}`
    : `https://via.placeholder.com/342x513/111/444?text=${encodeURIComponent(title || 'N/A')}`;

  const backdrop = media.backdrop_path ? `${BACKDROP_URL}${media.backdrop_path}` : poster;

  const inList = isInWatchlist(media.id);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  return (
    <div 
      ref={containerRef}
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

      {/* Glassy Floating Tooltip (Smart Positioning) */}
      <AnimatePresence mode="wait">
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
            style={{ 
              background: 'rgba(15, 15, 15, 0.8)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
            className={`absolute z-[200] w-[130%] min-w-[260px] max-w-[360px] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto cursor-default ${
              previewPosition.h === 'center' ? 'left-1/2 -translate-x-1/2 top-0' :
              // Normal (Down-Right): Anchor top-left of modal to bottom-right of card center
              (previewPosition.v === 'down' && previewPosition.h === 'right') ? 'top-1/2 left-full -translate-x-1/2' :
              // Flip Up: Anchor bottom-left of modal to top-right of card
              (previewPosition.v === 'up' && previewPosition.h === 'right') ? 'bottom-full left-full -translate-x-[15%] translate-y-[15%]' :
              // Flip Left: Anchor top-right of modal to bottom-left of card
              (previewPosition.v === 'down' && previewPosition.h === 'left') ? 'top-1/2 right-full translate-x-1/2' :
              // Double Flip (Up-Left): 
              'bottom-full right-full translate-x-[15%] translate-y-[15%]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Anchor (Preview Section) */}
            <div className="relative aspect-video w-full bg-black/40 overflow-hidden">
              <img 
                src={backdrop} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              
              {trailerKey && (
                <motion.iframe
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVideoLoaded ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&showinfo=0&autohide=1&playlist=${trailerKey}&loop=1&widget_referrer=${window.location.host}`}
                  className="absolute inset-0 w-full h-full scale-[1.5] pointer-events-none"
                  frameBorder="0"
                  allow="autoplay"
                  onLoad={() => {
                    setTimeout(() => setIsVideoLoaded(true), 250);
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="p-5 space-y-4">
              {/* Title Section (White and Bold) */}
              <h4 className="text-lg font-black text-white leading-tight line-clamp-1 italic tracking-tight">
                {title}
              </h4>
              
              {/* Compact Meta Bar with Green Highlights */}
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                <span className="flex items-center gap-0.5 text-[#1ce783]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                  {media.vote_average.toFixed(1)}
                </span>
                <span className="text-[#1ce783] bg-[#1ce783]/10 px-1.5 rounded border border-[#1ce783]/20">HD</span>
                <span className="text-white bg-[#1ce783]/80 px-1.5 rounded flex items-center gap-1 shadow-sm shadow-[#1ce783]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                  {media.number_of_episodes || 12}
                </span>
                <span className="text-gray-400 font-bold uppercase tracking-tight ml-auto">{media.media_type === 'tv' ? 'TV' : 'Movie'}</span>
              </div>

              {/* Muted Description */}
              <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-4 opacity-90">
                {media.overview || "No description available."}
              </p>

              {/* ZenStream Green Button Bar */}
              <div className="pt-2 flex items-center gap-3">
                <Link 
                  to={`/details/${media.media_type}/${media.id}`}
                  className="flex-1 bg-[#1ce783] hover:bg-[#1ce783]/90 text-black py-3 rounded-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_20px_rgba(28,231,131,0.2)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 20.03c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                  </svg>
                  Watch now
                </Link>
                
                <button 
                  onClick={handleWatchlist}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all transform active:scale-90 border overflow-hidden ${
                    inList 
                      ? 'bg-[#1ce783] border-[#1ce783] text-black shadow-lg shadow-[#1ce783]/20' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-[#1ce783]/10 hover:border-[#1ce783]/30'
                  }`}
                >
                  {inList ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MediaCard;
