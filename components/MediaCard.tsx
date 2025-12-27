
import React, { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types';
import { IMG_URL } from '../constants';
import { useWatchlist } from '../hooks/useWatchlist';
import { useHistory } from '../hooks/useHistory';

interface Props {
  media: Movie;
}

// TMDB image sizes: w92, w154, w185, w342, w500, w780, original
// w342 is the sweet spot for grid posters to reduce payload without losing sharpness
const SMALL_POSTER_URL = 'https://image.tmdb.org/t/p/w342';

const MediaCard: React.FC<Props> = memo(({ media }) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { addToHistory } = useHistory();
  const [isVisible, setIsVisible] = useState(false);
  const [shared, setShared] = useState(false);
  const [addedToHistory, setAddedToHistory] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const title = media.title || media.name;
  const year = (media.release_date || media.first_air_date || '').substring(0, 4);
  const poster = media.poster_path 
    ? `${SMALL_POSTER_URL}${media.poster_path}`
    : `https://via.placeholder.com/342x513/111/444?text=${encodeURIComponent(title || 'No Poster')}`;

  const inList = isInWatchlist(media.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '400px', // Preload images significantly before they hit the viewport
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/#/details/${media.media_type}/${media.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  if (!isVisible) {
    return (
      <div 
        ref={cardRef}
        className="aspect-[2/3] bg-[#0d0d0d] rounded-sm border border-white/5 animate-pulse"
      />
    );
  }

  return (
    <div 
      ref={cardRef}
      className="group relative bg-[#0d0d0d] rounded-sm overflow-hidden border border-white/5 transition-all duration-500 hover:shadow-[0_0_30px_rgba(28,231,131,0.15)] hover:border-[#1ce783]/50 active:scale-95 animate-in fade-in duration-500"
    >
      <Link to={`/details/${media.media_type}/${media.id}`}>
        <div className="aspect-[2/3] overflow-hidden relative">
          <img 
            src={poster} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Type Badge */}
          <div className="absolute top-1 md:top-2 right-1 md:right-2 flex flex-col items-end gap-1 z-10">
            <div className="bg-[#1ce783] text-black text-[6px] md:text-[7px] font-black px-1.5 md:px-2 py-0.5 rounded-sm uppercase tracking-widest">
              {media.media_type === 'tv' ? 'Series' : 'Movie'}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-1 md:top-2 left-1 md:left-2 flex flex-col gap-1.5 md:gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={handleWatchlist}
              className={`p-1 md:p-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                inList ? 'bg-[#1ce783] border-[#1ce783] text-black shadow-[0_0_15px_rgba(28,231,131,0.4)]' : 'bg-black/40 border-white/10 text-white hover:bg-white hover:text-black'
              }`}
            >
              {inList ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              )}
            </button>
            <button 
              onClick={handleAddToHistory}
              className={`p-1 md:p-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
                addedToHistory ? 'bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-black/40 border-white/10 text-white hover:bg-white hover:text-black'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>

          <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-20">
             <h3 className="text-white font-black text-[9px] md:text-[11px] leading-tight uppercase tracking-tight mb-1 line-clamp-1">{title}</h3>
             <div className="flex items-center gap-2">
                <span className="text-[#1ce783] text-[8px] md:text-[9px] font-black">{year}</span>
                <span className="text-white/60 text-[8px] md:text-[9px] font-black">★ {media.vote_average.toFixed(1)}</span>
             </div>
          </div>
        </div>
      </Link>
    </div>
  );
});

export default MediaCard;
