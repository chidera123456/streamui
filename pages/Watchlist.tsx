
import React from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import MediaCard from '../components/MediaCard';
import { Link } from 'react-router-dom';

const Watchlist: React.FC = () => {
  const { watchlist, loading } = useWatchlist();

  if (loading) {
    return (
      <div className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-black uppercase italic tracking-widest text-xs animate-pulse">Syncing with Cloud...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
      <div className="mb-12 text-center md:text-left">
        <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
            My <span className="text-red-600">Watchlist</span>
          </h1>
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {watchlist.length} Items
          </span>
        </div>
        <p className="text-gray-400">Everything you've saved is now synced across your devices.</p>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
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
              className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95"
            >
              Start Discovering
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
