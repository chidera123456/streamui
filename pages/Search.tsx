
import React, { useState, useEffect, useRef } from 'react';
import { searchMedia, discoverMedia, fetchGenres } from '../services/tmdbService';
import { getCorrectedQuery } from '../services/geminiService';
import { Movie } from '../types';
import MediaCard from '../components/MediaCard';
import { Link } from 'react-router-dom';
import { IMG_URL } from '../constants';
import { useSearchHistory } from '../hooks/useSearchHistory';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [type, setType] = useState<'all' | 'movie' | 'tv'>('all');
  const [results, setResults] = useState<Movie[]>([]);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [genres, setGenres] = useState<{ id: number, name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [isCorrecting, setIsCorrecting] = useState(false);
  
  const { searchHistory, saveToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  
  const searchTimeout = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);

    if (query.trim().length >= 2) {
      setShowDropdown(true);
      searchTimeout.current = window.setTimeout(() => {
        triggerSearch(1, false, true); 
      }, 400);
    } else {
      setSuggestions([]);
      if (query.trim().length === 0) {
        setResults([]);
        setCorrectedQuery(null);
      }
    }

    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [query, type]);

  const triggerSearch = async (pageNum: number = 1, isLoadMore: boolean = false, isSilent: boolean = false, searchQuery: string = query) => {
    if (!isLoadMore && !isSilent) {
      setLoading(true);
      if (pageNum === 1) {
        setResults([]);
        setCorrectedQuery(null);
      }
    } else if (isLoadMore) {
      setLoadingMore(true);
    }

    try {
      let res;
      if (searchQuery.trim()) {
        res = await searchMedia(searchQuery, type, pageNum, selectedYear);
        
        // AUTO-CORRECTION LOGIC
        // If results are empty on page 1, try AI correction
        if (!isSilent && pageNum === 1 && res.results.length === 0 && searchQuery.length > 2) {
          setIsCorrecting(true);
          const aiCorrected = await getCorrectedQuery(searchQuery);
          setIsCorrecting(false);
          
          if (aiCorrected) {
            setCorrectedQuery(aiCorrected);
            const correctedRes = await searchMedia(aiCorrected, type, 1, selectedYear);
            res = correctedRes;
            saveToHistory(aiCorrected);
          }
        }

        if (!isSilent && pageNum === 1) {
          saveToHistory(searchQuery);
        }
      } else if (type !== 'all' && (selectedGenre || selectedYear || minRating > 0)) {
        res = await discoverMedia(type, pageNum, { 
          genre: selectedGenre || undefined, 
          year: selectedYear || undefined, 
          rating: minRating || undefined 
        });
      } else {
        res = { results: [], totalPages: 0 };
      }

      if (isSilent) {
        setSuggestions(res.results.slice(0, 5));
      } else {
        if (isLoadMore) {
          setResults(prev => [...prev, ...res.results]);
        } else {
          setResults(res.results);
          setShowDropdown(false); 
        }
        setPage(pageNum);
        setHasMore(res.totalPages > pageNum);
      }
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

  const handleHistoryClick = (h: string) => {
    setQuery(h);
    triggerSearch(1, false, false, h);
  };

  const clearFilters = () => {
    setSelectedGenre(null);
    setSelectedYear('');
    setMinRating(0);
    setQuery('');
    setResults([]);
    setHasMore(false);
    setSuggestions([]);
    setCorrectedQuery(null);
  };

  return (
    <div className="pt-20 md:pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-6xl font-black italic uppercase tracking-tighter mb-2 md:mb-4">
          Discovery <span className="text-[#1ce783]">Engine</span>
        </h1>
        <p className="text-gray-500 uppercase text-[8px] md:text-[10px] font-black tracking-[0.3em]">
          {isCorrecting ? 'AI Refining Search...' : 'Fuzzy Logic & AI Powered'}
        </p>
      </div>

      <div className="max-w-3xl mx-auto mb-10 md:mb-16 space-y-6" ref={containerRef}>
        <form onSubmit={handleSearchSubmit} className="space-y-6">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {(['all', 'movie', 'tv'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setResults([]);
                  setSelectedGenre(null);
                  setHasMore(false);
                  setCorrectedQuery(null);
                }}
                className={`px-5 md:px-8 py-2 md:py-2.5 rounded-sm text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                  type === t 
                    ? 'bg-[#1ce783] text-black shadow-[0_0_20px_rgba(28,231,131,0.3)]' 
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {t === 'all' ? 'Everything' : t === 'movie' ? 'Movies' : 'TV Shows'}
              </button>
            ))}
          </div>

          <div className="relative group flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, genre, or description..."
                className="w-full bg-[#111] border-b-2 border-white/10 px-0 py-3 md:py-4 text-lg md:text-xl outline-none focus:border-[#1ce783] transition-all"
              />
              
              {showDropdown && (suggestions.length > 0 || (query.length === 0 && searchHistory.length > 0)) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0c0c]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {query.length === 0 && searchHistory.length > 0 && (
                    <div>
                      <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-gray-500 tracking-[0.2em]">Recent Searches</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                          className="text-[8px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {searchHistory.map((h, i) => (
                          <div 
                            key={i} 
                            className="flex items-center group/item hover:bg-white/5 transition-colors"
                          >
                            <button
                              onClick={() => handleHistoryClick(h)}
                              className="flex-1 flex items-center gap-3 p-3 text-left"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-300 group-hover/item:text-white truncate">{h}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFromHistory(h); }}
                              className="p-3 text-gray-600 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {query.length >= 2 && suggestions.length > 0 && (
                    <div>
                      <div className="p-2 border-b border-white/5">
                        <span className="text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] ml-2">Quick Matches</span>
                      </div>
                      {suggestions.map((s) => (
                        <Link
                          key={s.id}
                          to={`/details/${s.media_type}/${s.id}`}
                          onClick={() => saveToHistory(query)}
                          className="flex items-center gap-4 p-3 hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-10 h-14 bg-white/5 rounded-sm overflow-hidden shrink-0">
                            {s.poster_path && (
                              <img 
                                src={`${IMG_URL}${s.poster_path}`} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#1ce783] transition-colors truncate">
                              {s.title || s.name}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                              {s.media_type} • {(s.release_date || s.first_air_date || '').substring(0, 4)}
                            </p>
                          </div>
                          <div className="text-[#1ce783] opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                      <button 
                        onClick={() => triggerSearch(1)}
                        className="w-full p-3 text-center bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-[#1ce783] transition-colors"
                      >
                        View All Results
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 md:p-4 rounded-full transition-all flex items-center justify-center ${showFilters ? 'text-[#1ce783]' : 'text-gray-500 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>

              <button
                type="submit"
                disabled={loading || isCorrecting}
                className="flex-1 md:flex-none bg-white hover:bg-[#1ce783] text-black px-6 md:px-10 py-3 md:py-4 rounded-sm font-black text-xs md:text-base uppercase tracking-widest transition-all"
              >
                {loading || isCorrecting ? '...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {showFilters && (
          <div className="bg-[#0c0c0c] border border-white/5 rounded-sm p-5 md:p-8 space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[8px] md:text-[10px] font-black uppercase text-[#1ce783] tracking-widest">Advanced Filters</h3>
              <button onClick={clearFilters} className="text-[8px] md:text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Reset</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase mb-2 md:mb-3">Release Year</label>
                  <input 
                    type="number" 
                    placeholder="YYYY"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-white/5 border-b border-white/10 py-2 md:py-3 outline-none focus:border-[#1ce783] transition-colors text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase mb-2 md:mb-3 text-white">Min Rating ({minRating})</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-[#1ce783] bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase mb-2 md:mb-3">Genre Focus</label>
                <div className="flex flex-wrap gap-2 max-h-[120px] md:max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                  {genres.length > 0 ? (
                    genres.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
                        className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-sm text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${
                          selectedGenre === g.id 
                            ? 'bg-[#1ce783] border-[#1ce783] text-black' 
                            : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-[8px] md:text-[10px] text-gray-600 italic">Select Movie/TV above</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {correctedQuery && results.length > 0 && (
        <div className="max-w-3xl mx-auto mb-6 p-3 bg-[#1ce783]/5 border border-[#1ce783]/10 rounded-lg animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Showing results for <span className="text-[#1ce783] italic">"{correctedQuery}"</span> instead of "{query}"
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-12 animate-in fade-in duration-700">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
            {results.map((item, index) => (
              <MediaCard key={`${item.media_type}-${item.id}-${index}`} media={item} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => triggerSearch(page + 1, true)}
                disabled={loadingMore}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-10 md:px-12 py-3 md:py-4 rounded-sm text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {loadingMore ? 'Loading More...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 animate-pulse">Syncing Galaxy...</p>
        </div>
      )}

      {!loading && !isCorrecting && results.length === 0 && query.length > 0 && (
        <div className="text-center py-32 space-y-4">
          <div className="text-4xl">🛸</div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter">No signal detected</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">The cinematic universe is vast, but we couldn't find a match.</p>
        </div>
      )}
    </div>
  );
};

export default Search;
