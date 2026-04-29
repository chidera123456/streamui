
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { IMG_URL } from '../constants';

interface Props {
  media: Movie;
  priority?: boolean;
  onRemove?: (e: React.MouseEvent) => void;
}

const MediaCard: React.FC<Props> = memo(({ media, priority = false, onRemove }) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  
  if (!media) return null;

  const title = media.title || media.name || 'Unknown Title';
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path 
    ? `${IMG_URL}${media.poster_path}`
    : `https://via.placeholder.com/342x513/111/444?text=${encodeURIComponent(title || 'N/A')}`;

  const inList = isInWatchlist(media.id);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  return (
    <div className="relative z-10">
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
    </div>
  );
});

export default MediaCard;
