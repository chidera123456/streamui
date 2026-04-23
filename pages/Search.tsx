
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchMedia, discoverMedia, fetchGenres } from '../services/tmdbService';
import { getCorrectedQuery } from '../services/geminiService';
import { Movie } from '../types';
import MediaCard from '../components/MediaCard';
import { Link, useSearchParams } from 'react-router-dom';
import { IMG_URL } from '../constants';
import { useSearchHistory } from '../hooks/useSearchHistory';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
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
  const lastRequestQuery = useRef<string>('');
  const isSumbittedSearch = useRef<boolean>(false);

  // Maintain latest values to keep triggerSearch stable
  const stateRef = useRef({ query, type, selectedGenre, selectedYear, minRating, showDropdown });
  useEffect(() => {
    stateRef.current = { query, type, selectedGenre, selectedYear, minRating, showDropdown };
  }, [query, type, selectedGenre, selectedYear, minRating, showDropdown]);

  const triggerSearch = useCallback(async (pageNum: number = 1, isLoadMore: boolean = false, isSilent: boolean = false, searchQuery?: string) => {
    const { query: sQuery, type: sType, selectedGenre: sGenre, selectedYear: sYear, minRating: sRating } = stateRef.current;
    const finalQuery = searchQuery !== undefined ? searchQuery : sQuery;

    if (!isLoadMore && !isSilent) {
      setLoading(true);
      setShowDropdown(false);
      setSuggestions([]); // Clear suggestions on full search
      isSumbittedSearch.current = true;
      if (pageNum === 1) {
        setResults([]);
        setCorrectedQuery(null);
      }
    } else if (isLoadMore) {
      setLoadingMore(true);
    }

    lastRequestQuery.current = finalQuery;

    try {
      let res;
      if (finalQuery.trim()) {
        res = await searchMedia(finalQuery, sType, pageNum, sYear);
        
        // If results came back for a different query than what's currently being requested, ignore
        if (finalQuery !== lastRequestQuery.current && isSilent) return;

        if (!isSilent && pageNum === 1) {
          // AUTO-CORRECTION LOGIC
          if (res.results.length === 0 && finalQuery.length > 2) {
            setIsCorrecting(true);
            const aiCorrected = await getCorrectedQuery(finalQuery);
            setIsCorrecting(false);
            
            if (aiCorrected) {
              setCorrectedQuery(aiCorrected);
              const correctedRes = await searchMedia(aiCorrected, sType, 1, sYear);
              res = correctedRes;
              saveToHistory(aiCorrected);
            } else {
              saveToHistory(finalQuery);
            }
          } else if (res.results.length > 0) {
            saveToHistory(finalQuery);
          }
        }
      } else if (sGenre || sYear || sRating > 0) {
        if (sType === 'all') {
          const [movieRes, tvRes] = await Promise.all([
            discoverMedia('movie', pageNum, { genre: sGenre || undefined, year: sYear || undefined, rating: sRating || undefined }),
            discoverMedia('tv', pageNum, { genre: sGenre || undefined, year: sYear || undefined, rating: sRating || undefined })
          ]);
          
          res = {
            results: [...movieRes.results, ...tvRes.results].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
            totalPages: Math.max(movieRes.totalPages, tvRes.totalPages)
          };
        } else {
          res = await discoverMedia(sType, pageNum, { 
            genre: sGenre || undefined, 
            year: sYear || undefined, 
            rating: sRating || undefined 
          });
        }
      } else {
        res = { results: [], totalPages: 0 };
      }

      if (isSilent) {
        // Only update suggestions if query is still relevant
        if (finalQuery.trim().length >= 2) {
          setSuggestions(res.results.slice(0, 5));
        }
      } else {
        if (isLoadMore) {
          setResults(prev => [...prev, ...res.results]);
        } else {
          setResults(res.results);
          setShowDropdown(false); 
          setSuggestions([]); // Final safety clear
        }
        setPage(pageNum);
        setHasMore(res.totalPages > pageNum);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isLoadMore) setLoading(false);
      setLoadingMore(false);
    }
  }, [saveToHistory]); // Now stable since saveToHistory is memoized

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      triggerSearch(1, false, false, initialQuery);
    }
  }, [initialQuery, triggerSearch]);

  useEffect(() => {
    const loadGenres = async () => {
      const fetchType = type === 'all' ? 'movie' : type;
      const data = await fetchGenres(fetchType);
      setGenres(data);
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

  // Suggestions logic - only depends on query
  useEffect(() => {
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);

    if (query.trim().length >= 2) {
      if (query !== lastRequestQuery.current) {
        isSumbittedSearch.current = false;
        setShowDropdown(true);
      } else if (!isSumbittedSearch.current) {
        setShowDropdown(true);
      }

      searchTimeout.current = window.setTimeout(() => {
        triggerSearch(1, false, true); 
      }, 400);
    } else {
      setSuggestions([]);
      if (query.trim().length === 0 && !selectedGenre && !selectedYear && minRating === 0) {
        setResults([]);
        setCorrectedQuery(null);
        isSumbittedSearch.current = false;
        setShowDropdown(false);
      }
    }

    return () => {
      if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    };
  }, [query, selectedGenre, selectedYear, minRating, triggerSearch]);

  // Filter trigger - separate to avoid logic mixing
  useEffect(() => {
    if (selectedGenre || selectedYear || minRating > 0) {
      triggerSearch(1);
    }
  }, [selectedGenre, selectedYear, minRating, triggerSearch]);

  // Auto-genre trigger fix
  useEffect(() => {
    if (selectedGenre) {
      setQuery('');
    }
  }, [selectedGenre]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    setShowDropdown(false);
    setSuggestions([]);
    triggerSearch(1);
  };

  const handleHistoryClick = (h: string) => {
    setQuery(h);
    setShowDropdown(false);
    isSumbittedSearch.current = true;
    triggerSearch(1, false, false, h);
  };

  const handleGenreClick = (genreId: number) => {
    setSelectedGenre(selectedGenre === genreId ? null : genreId);
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
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      {/* Cinematic Full-Width Underlay Gradient (Netflix-style) */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200vw] h-full bg-[radial-gradient(ellipse_at_top,_rgba(28,231,131,0.15)_0%,_rgba(28,231,131,0.05)_40%,_transparent_80%)]" />
        <div className="absolute top-0 left-0 right-0 h-[60vh] bg-gradient-to-b from-[#1ce783]/8 to-transparent" />
      </div>

      <div className="relative z-10 pt-12 md:pt-32 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12 text-center">
        <h1 className="text-lg md:text-xl font-bold uppercase tracking-[0.3em] text-[#1ce783] mb-2">
          Discovery
        </h1>
        <p className="text-gray-500 uppercase text-[8px] md:text-[10px] font-black tracking-[0.4em] min-h-[1em]">
          {isCorrecting && 'AI Refining Search...'}
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
                className={`px-5 md:px-8 py-2 md:py-2.5 rounded-sm text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all transform-gpu active:scale-95 ${
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
                onFocus={() => {
                  if (!isSumbittedSearch.current || (query.length > 0 && query !== lastRequestQuery.current)) {
                    setShowDropdown(true);
                  }
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim()) setSelectedGenre(null); // Clear genre if typing
                }}
                placeholder="Title, genre, or description..."
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 md:py-5 text-lg md:text-xl outline-none focus:border-[#1ce783]/50 focus:bg-white/10 transition-all shadow-2xl placeholder:opacity-30"
              />
              
              {showDropdown && !loading && !isCorrecting && (suggestions.length > 0 || (query.trim() === '' && searchHistory.length > 0)) && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  
                  {query.trim() === '' && searchHistory.length > 0 && (
                    <div>
                      <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-gray-500 tracking-[0.2em]">Recent Searches</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearHistory(); }}
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
                              type="button"
                              onClick={() => handleHistoryClick(h)}
                              className="flex-1 flex items-center gap-3 p-3 text-left"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-gray-300 group-hover/item:text-white truncate">{h}</span>
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromHistory(h); }}
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
                          onClick={() => {
                            saveToHistory(query);
                            setShowDropdown(false);
                            isSumbittedSearch.current = true;
                          }}
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
                        type="button"
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
                className={`p-3 md:p-4 rounded-full transition-all flex items-center justify-center transform-gpu active:scale-90 ${showFilters ? 'text-[#1ce783]' : 'text-gray-500 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>

              <button
                type="submit"
                disabled={loading || isCorrecting}
                className="flex-1 md:flex-none bg-white hover:bg-[#1ce783] text-black px-6 md:px-10 py-3 md:py-4 rounded-full font-black text-xs md:text-base uppercase tracking-widest transition-all transform-gpu active:scale-95 shadow-2xl"
              >
                {loading || isCorrecting ? '...' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Genre Selection Bar */}
        <div className="pt-2 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">Explore Categories</span>
              {selectedGenre && (
                <button 
                  onClick={() => setSelectedGenre(null)}
                  className="text-[9px] font-black uppercase text-[#1ce783] hover:text-white transition-colors"
                >
                  Clear Genre
                </button>
              )}
            </div>
            <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar snap-x">
              {genres.length > 0 ? (
                genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGenreClick(g.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transform-gpu active:scale-95 snap-start border ${
                      selectedGenre === g.id 
                        ? 'bg-[#1ce783] border-[#1ce783] text-black shadow-lg shadow-[#1ce783]/20' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {g.name}
                  </button>
                ))
              ) : (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-20 h-8 bg-white/5 rounded-full animate-pulse"></div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {showFilters && (
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-[#1ce783] tracking-widest">Global Parameters</h3>
              <button onClick={clearFilters} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Reset All</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-3">Release Year</label>
                  <input 
                    type="number" 
                    placeholder="YYYY"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-white/5 border-b border-white/10 py-3 outline-none focus:border-[#1ce783] transition-colors text-sm md:text-base font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-3">Minimum Rating: <span className="text-[#1ce783] font-black">{minRating}</span></label>
                <div className="pt-2 px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-[#1ce783] bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-[9px] font-black text-gray-600 uppercase">
                    <span>Any</span>
                    <span>10.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {correctedQuery && results.length > 0 && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-[#1ce783]/5 border border-[#1ce783]/10 rounded-xl animate-in fade-in slide-in-from-top-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
            Did you mean <span className="text-[#1ce783] italic">"{correctedQuery}"</span>? Showing results for the refined query.
          </p>
        </div>
      )}

      {loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
           <div className="w-12 h-12 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse">Scanning Archive...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-12 animate-in fade-in duration-700">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
            {results.map((item, index) => (
              <MediaCard key={`${item.media_type}-${item.id}-${index}`} media={item} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => triggerSearch(page + 1, true)}
                disabled={loadingMore}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-10 md:px-12 py-3 md:py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all transform-gpu active:scale-95"
              >
                {loadingMore ? 'Streaming Data...' : 'Load More Results'}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && !isCorrecting && results.length === 0 && (query.length > 0 || selectedGenre) && (
        <div className="text-center py-32 space-y-6">
          <div className="text-6xl animate-bounce">🛰️</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">No Results Found</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
              Try adjusting your filters or searching for something broader.
            </p>
          </div>
          <button 
            onClick={clearFilters}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783] border border-[#1ce783]/30 px-6 py-2 rounded-full hover:bg-[#1ce783] hover:text-black transition-all"
          >
            Clear All Search Params
          </button>
        </div>
      )}
      
      {!loading && results.length === 0 && !query && !selectedGenre && (
        <div className="text-center py-32">
          <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.4em] opacity-40">Discovery Mode</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default Search;
