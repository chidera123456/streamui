
import React from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import MediaCard from '../components/MediaCard';
import { Link } from 'react-router-dom';

const Watchlist: React.FC = () => {
  const { watchlist, loading } = useWatchlist();

  // Only show a full-page loader if we have NO data and we are currently loading.
  // If we have cached data, we show it instantly even while 'loading' is true in the background.
  if (loading && watchlist.length === 0) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-black flex flex-col items-center justify-center">
        <div className="absolute top-0 left-0 right-0 h-[100vh] pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] h-full bg-[radial-gradient(ellipse_at_top,_rgba(28,231,131,0.15)_0%,_rgba(28,231,131,0.05)_40%,_transparent_80%)]" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-black uppercase italic tracking-widest text-xs animate-pulse">Syncing Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      {/* Cinematic Full-Width Underlay Gradient (Netflix-style) */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] h-full bg-[radial-gradient(ellipse_at_top,_rgba(28,231,131,0.15)_0%,_rgba(28,231,131,0.05)_40%,_transparent_80%)]" />
        <div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-[#1ce783]/8 to-transparent" />
      </div>

      <div className="relative z-10 pt-12 md:pt-32 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12 text-center md:text-left">
        <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-[0.3em]">
            My <span className="text-[#1ce783]">Watchlist</span>
          </h1>
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {watchlist.length} Items
          </span>
        </div>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
          {watchlist.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
          <div className="text-6xl grayscale opacity-20">📥</div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Your collection is empty</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
              Start adding your favorite movies and series to keep track of what you want to watch.
            </p>
            <Link 
              to="/search" 
              className="inline-block bg-[#1ce783] hover:bg-[#1ce783]/80 text-black px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-[#1ce783]/20 transition-all active:scale-95"
            >
              Start Discovering
            </Link>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Watchlist;