
import React, { useState, useEffect } from 'react';
import { searchMedia, discoverMedia, fetchGenres } from '../services/tmdbService';
import { Movie } from '../types';
import MediaCard from '../components/MediaCard';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<{ id: number, name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    // Fetch genres for the current type
    const loadGenres = async () => {
      if (type !== 'all') {
        const data = await fetchGenres(type);
        setGenres(data);
      } else {
        setGenres([]);
      }
    };
    loadGenres();
  }, [type]);

  const triggerSearch = async (pageNum: number = 1, isLoadMore: boolean = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setResults([]);
    } else {
      setLoadingMore(true);
    }

    try {
      let res;
      // If we have a query, prioritize text search
      if (query.trim()) {
        res = await searchMedia(query, type, pageNum, selectedYear);
      } else if (type !== 'all' && (selectedGenre || selectedYear || minRating > 0)) {
        // If no query but filters are set, use discover (doesn't support type 'all')
        res = await discoverMedia(type, pageNum, { 
          genre: selectedGenre || undefined, 
          year: selectedYear || undefined, 
          rating: minRating || undefined 
        });
      } else {
        // Fallback or empty state
        res = { results: [], totalPages: 0 };
      }

      if (isLoadMore) {
        setResults(prev => [...prev, ...res.results]);
      } else {
        setResults(res.results);
      }
      
      setPage(pageNum);
      setHasMore(res.totalPages > pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(1);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    triggerSearch(page + 1, true);
  };

  const clearFilters = () => {
    setSelectedGenre(null);
    setSelectedYear('');
    setMinRating(0);
    setQuery('');
    setResults([]);
    setHasMore(false);
  };

  return (
    <div className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
          Discover <span className="text-red-600">Anything</span>
        </h1>
        <p className="text-gray-400">Search through millions of titles or filter by your preferences.</p>
      </div>

      <div className="max-w-3xl mx-auto mb-16 space-y-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {(['all', 'movie', 'tv'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setResults([]);
                  setSelectedGenre(null);
                  setHasMore(false);
                }}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${
                  type === t 
                    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/40' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Series'}
              </button>
            ))}
          </div>

          <div className="relative group flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search for ${type === 'all' ? 'movies or series' : type}...`}
                className="w-full bg-[#111] border-2 border-white/10 rounded-2xl px-6 py-4 text-lg outline-none focus:border-red-600 transition-all shadow-inner group-hover:border-white/20"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center ${showFilters ? 'bg-red-600 border-red-600 text-white' : 'bg-[#111] border-white/10 text-gray-400 hover:border-white/30'}`}
              title="Advanced Filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => triggerSearch(1)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-900/20"
            >
              {loading ? '...' : 'Go'}
            </button>
          </div>
        </form>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase italic text-gray-400 tracking-widest">Advanced Filters</h3>
              <button onClick={clearFilters} className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors">Reset All</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Year & Rating */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 ml-1">Release Year</label>
                  <input 
                    type="number" 
                    min="1900" 
                    max={new Date().getFullYear()} 
                    placeholder="YYYY"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 ml-1">Minimum Rating ({minRating}+)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-red-600 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-600">
                    <span>Any</span>
                    <span>5.0</span>
                    <span>10.0</span>
                  </div>
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 ml-1">
                  Genre {type === 'all' && <span className="text-red-900 ml-2">(Select Movie/TV first)</span>}
                </label>
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {genres.length > 0 ? (
                    genres.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                          selectedGenre === g.id 
                            ? 'bg-red-600 border-red-600 text-white' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600 italic py-4">Choose a specific media type to filter by genre.</p>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => triggerSearch(1)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Apply Filter Magic
            </button>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-12">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {results.map((item, index) => (
              <MediaCard key={`${item.media_type}-${item.id}-${index}`} media={item} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pb-12">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all transform active:scale-95 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !loading && (query || selectedGenre || selectedYear || minRating > 0) && (
        <div className="text-center py-20 flex flex-col items-center space-y-4">
          <div className="text-5xl opacity-20">🔍</div>
          <p className="text-gray-500 text-lg">No matches found for your criteria.</p>
          <button onClick={clearFilters} className="text-red-600 font-bold hover:underline">Clear all search & filters</button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center mt-12 mb-20">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default Search;
