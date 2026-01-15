
import React, { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { useHistory } from '../hooks/useHistory';

interface Props {
  media: Movie;
  priority?: boolean;
}

const SMALL_POSTER_URL = 'https://image.tmdb.org/t/p/w342';

/**
 * Registry of images that have successfully loaded in the current session.
 * Used to keep images "stagnant" and prevent re-fade-in during scrolling.
 */
const loadedImagesRegistry = new Set<string>();

const MediaCard: React.FC<Props> = memo(({ media, priority = false }) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addToHistory } = useHistory();
  
  const title = media.title || media.name;
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path 
    ? `${SMALL_POSTER_URL}${media.poster_path}`
    : `https://via.placeholder.com/342x513/111/444?text=${encodeURIComponent(title || 'No Poster')}`;

  // Check registry immediately to skip animations for previously loaded images
  const isAlreadyLoaded = loadedImagesRegistry.has(poster);
  const [isLoaded, setIsLoaded] = useState(isAlreadyLoaded);
  const [addedToHistory, setAddedToHistory] = useState(false);

  const handleImageLoad = () => {
    if (!loadedImagesRegistry.has(poster)) {
      loadedImagesRegistry.add(poster);
      setIsLoaded(true);
    }
  };

  const inList = isInWatchlist(media.id);

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(media);
  };

  const handleAddToHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToHistory(media);
    setAddedToHistory(true);
    setTimeout(() => setAddedToHistory(false), 2000);
  };

  return (
    <div 
      className="group relative bg-[#0a0a0a] rounded-sm overflow-hidden border border-white/5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(28,231,131,0.15)] hover:border-[#1ce783]/30 active:scale-[0.98] will-change-transform"
      style={{ 
        contentVisibility: 'auto', 
        containIntrinsicSize: '200px 300px',
        contain: 'layout paint'
      }}
    >
      <Link to={`/details/${media.media_type}/${media.id}`}>
        <div className="aspect-[2/3] overflow-hidden relative bg-[#0a0a0a]">
          {/* Base background color is critical to hide decoding flashes */}
          <div className="absolute inset-0 bg-[#0a0a0a] z-0" />
          
          <img 
            src={poster} 
            alt={title}
            onLoad={handleImageLoad}
            // CRITICAL: loading="eager" fetches off-screen images immediately.
            // fetchpriority="high" ensures they are prioritized over background scripts.
            loading="eager"
            fetchpriority={priority || isAlreadyLoaded ? "high" : "auto"}
            decoding="async"
            className={`w-full h-full object-cover relative z-10 will-change-transform group-hover:scale-105 ${
              isAlreadyLoaded 
                ? 'opacity-100 scale-100' 
                : isLoaded 
                  ? 'opacity-100 scale-100 transition-opacity duration-300' 
                  : 'opacity-0 scale-100'
            }`}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-20" />

          {/* Type Badge */}
          <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1 z-30">
            <div className="bg-[#1ce783] text-black text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest shadow-lg">
              {media.media_type === 'tv' ? 'Series' : 'Movie'}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0">
            <button 
              onClick={handleWatchlist}
              className={`p-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                inList ? 'bg-[#1ce783] border-[#1ce783] text-black shadow-[0_0_15px_rgba(28,231,131,0.4)]' : 'bg-black/60 border-white/10 text-white hover:bg-white hover:text-black'
              }`}
            >
              {inList ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              )}
            </button>
            <button 
              onClick={handleAddToHistory}
              className={`p-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                addedToHistory ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-black/60 border-white/10 text-white hover:bg-white hover:text-black'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>

          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-40">
             <h3 className="text-white font-black text-[9px] leading-tight uppercase tracking-tight mb-1 line-clamp-1">{title}</h3>
             <div className="flex items-center gap-2">
                <span className="text-[#1ce783] text-[8px] font-black">{year}</span>
                <span className="text-white/60 text-[8px] font-black">★ {media.vote_average.toFixed(1)}</span>
             </div>
          </div>
        </div>
      </Link>
    </div>
  );
});

export default MediaCard;
