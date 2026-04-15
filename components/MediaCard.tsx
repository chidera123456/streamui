
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
  
  const title = media.title || media.name;
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
    <div 
      className="group relative bg-[#1c1c1c] rounded-sm overflow-hidden border border-white/5 transition-all duration-500 hover:scale-105 hover:z-20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] w-full"
    >
      <Link to={`/details/${media.media_type}/${media.id}`}>
        <div className="aspect-[2/3] relative">
          <img 
            src={poster} 
            alt={title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Type Badge */}
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-[#1ce783] text-black text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {media.media_type === 'tv' ? 'Series' : 'Movie'}
            </div>
          </div>
          
          {/* Remove Button (If handler provided) */}
          {onRemove && (
            <button 
              onClick={onRemove}
              className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 hover:text-white transition-all transform active:scale-90 opacity-0 group-hover:opacity-100 border border-white/10"
              title="Remove from history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Quick Add Button */}
          <button 
            onClick={handleWatchlist}
            aria-label={inList ? "Remove from watchlist" : "Add to watchlist"}
            className={`absolute top-2 left-2 z-20 p-2 rounded-full backdrop-blur-md border transition-all duration-300 transform hover:scale-110 active:scale-90 ${
              inList 
                ? 'bg-[#1ce783] border-[#1ce783] text-black shadow-lg shadow-[#1ce783]/20' 
                : 'bg-black/40 border-white/20 text-white hover:bg-white hover:text-black'
            }`}
          >
            {inList ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            )}
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
             <h3 className="text-white font-bold text-xs leading-tight mb-1 line-clamp-1">{title}</h3>
             <div className="flex items-center justify-between">
                <span className="text-[#1ce783] text-[10px] font-black">{year}</span>
                <span className="text-white/60 text-[10px] font-bold">★ {media.vote_average.toFixed(1)}</span>
             </div>
          </div>
        </div>
      </Link>
    </div>
  );
});

export default MediaCard;
