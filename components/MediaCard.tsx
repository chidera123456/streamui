
import React from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { IMG_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';

interface Props {
  media: Movie;
}

const MediaCard: React.FC<Props> = ({ media }) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const title = media.title || media.name;
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path 
    ? `${IMG_URL}${media.poster_path}`
    : `https://via.placeholder.com/500x750/111/444?text=${encodeURIComponent(title || 'No Poster')}`;

  const inList = isInWatchlist(media.id);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  return (
    <div className="group relative bg-[#0d0d0d] rounded-2xl overflow-hidden border border-white/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-[1.05] hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] hover:border-red-600/40 active:scale-95">
      <Link to={`/details/${media.media_type}/${media.id}`}>
        <div className="aspect-[2/3] overflow-hidden relative">
          <img 
            src={poster} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Subtle Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-[7px] font-black px-2 py-0.5 rounded-full shadow-2xl uppercase pointer-events-none tracking-[0.1em] z-10 border border-white/10">
            {media.media_type}
          </div>
          
          <button 
            onClick={handleWatchlist}
            className={`absolute top-2 left-2 p-1.5 rounded-xl backdrop-blur-xl border transition-all duration-500 z-10 ${
              inList 
                ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' 
                : 'bg-black/30 border-white/10 text-white hover:bg-white hover:text-black hover:border-white'
            }`}
          >
            {inList ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          {/* Hover Info */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 z-20">
             <h3 className="text-white font-black text-sm leading-tight uppercase italic tracking-tighter drop-shadow-lg mb-1 line-clamp-2">
                {title}
             </h3>
             <div className="flex items-center gap-2">
                <span className="text-red-500 text-[10px] font-black">{year}</span>
                <span className="h-1 w-1 rounded-full bg-white/30"></span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-[10px]">★</span>
                  <span className="text-white/80 text-[10px] font-black">{media.vote_average.toFixed(1)}</span>
                </div>
             </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MediaCard;
