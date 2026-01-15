
import React, { useEffect, useState } from 'react';
import { fetchUpcomingMovies, fetchUpcomingTV } from '../services/tmdbService';
import { getUpcomingNews } from '../services/geminiService';
import { Movie } from '../types';
import MediaCard from '../components/MediaCard';
import { GridSkeleton } from '../components/Skeleton';

const Upcoming: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingTV, setLoadingTV] = useState(true);
  const [news, setNews] = useState<Record<string, string>>({});
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    // 1. Load Movies
    fetchUpcomingMovies(1).then(res => {
      const results = res.results.slice(0, 18);
      setMovies(results);
      setLoadingMovies(false);
      
      // Trigger news once we have some titles
      setLoadingNews(true);
      const titlesToHype = results.slice(0, 6).map(m => ({
        title: m.title || m.name || '',
        overview: m.overview || ''
      }));
      getUpcomingNews(titlesToHype).then(setNews).finally(() => setLoadingNews(false));
    });

    // 2. Load TV
    fetchUpcomingTV(1).then(res => {
      setTvShows(res.results.slice(0, 18));
      setLoadingTV(false);
    });

    window.scrollTo(0, 0);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "2026 (TBA)";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="pt-8 md:pt-4 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="mb-12 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${loadingNews ? 'bg-amber-500 animate-ping' : 'bg-amber-500'}`}></span>
              <p className="text-amber-500 text-[9px] font-black uppercase tracking-[0.4em]">Future Intelligence</p>
            </div>
            <h1 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
              2026 <span className="text-amber-500">Forecast</span>
            </h1>
          </div>
          <div className="max-w-xs md:text-right animate-in fade-in slide-in-from-right-4 duration-700">
             <p className="text-gray-500 text-[10px] md:text-xs font-black uppercase leading-relaxed tracking-widest opacity-60">
               Accessing deep space cinematic coordinates. Synchronized for the 2026 timeline.
             </p>
          </div>
        </div>
      </div>

      {/* AI Hype Ticker */}
      <div className="mb-16 md:mb-24 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl opacity-20"></div>
        <div className="relative bg-[#0a0a0a] border border-amber-500/10 rounded-3xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest transition-colors ${loadingNews ? 'bg-white/5 text-gray-500' : 'bg-amber-500 text-black'}`}>
                {loadingNews ? 'Decoding Intel...' : 'Live Intel'}
              </span>
              <div className="h-[1px] w-12 bg-amber-500/20"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {loadingNews ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-start animate-pulse">
                  <div className="w-8 h-8 bg-white/5 rounded-lg shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="w-24 h-2 bg-white/10 rounded"></div>
                    <div className="w-full h-3 bg-white/5 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              Object.entries(news).map(([title, snippet], idx) => (
                <div key={idx} className="group flex gap-4 items-start animate-in fade-in duration-500">
                  <div className="text-amber-500/20 font-black italic text-xl shrink-0 group-hover:text-amber-500 transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-white/60 font-black uppercase text-[9px] tracking-widest mb-1 group-hover:text-amber-500 transition-colors">{title}</h3>
                    <p className="text-gray-400 font-bold italic text-sm md:text-base leading-relaxed border-l border-amber-500/10 pl-4">
                      "{snippet}"
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Movies 2026 Grid */}
      <section className="mb-20 md:mb-32">
        <div className="flex items-center gap-6 mb-10 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter">
            2026 <span className="text-amber-500">Movies</span>
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/20 to-transparent"></div>
        </div>
        
        {loadingMovies ? (
          <GridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-5">
            {movies.map((item) => (
              <div key={item.id} className="space-y-4 group">
                <div className="relative">
                  <MediaCard media={item} />
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black px-2 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-tighter shadow-2xl z-10">
                    {formatDate(item.release_date || '')}
                  </div>
                </div>
                <div className="pt-1">
                   <h4 className="text-white font-black text-[10px] md:text-[11px] uppercase tracking-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                    {item.title}
                   </h4>
                   <p className="text-gray-600 text-[8px] font-bold line-clamp-2 mt-1 italic leading-tight">
                    {item.overview || "Deep space broadcast incoming..."}
                   </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Series 2026 Grid */}
      <section>
        <div className="flex items-center gap-6 mb-10 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
            2026 <span className="text-amber-500">Series</span>
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/20 to-transparent"></div>
        </div>
        
        {loadingTV ? (
          <GridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-5">
            {tvShows.map((item) => (
              <div key={item.id} className="space-y-4 group">
                <div className="relative">
                  <MediaCard media={item} />
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black px-2 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-tighter shadow-2xl z-10">
                    {formatDate(item.first_air_date || '')}
                  </div>
                </div>
                <div className="pt-1">
                   <h4 className="text-white font-black text-[10px] md:text-[11px] uppercase tracking-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                    {item.name}
                   </h4>
                   <p className="text-gray-600 text-[8px] font-bold line-clamp-2 mt-1 italic leading-tight">
                    {item.overview || "Transmission signal weak but promising..."}
                   </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <div className="mt-24 pt-12 border-t border-white/5 text-center opacity-40 pb-12">
        <p className="text-gray-600 text-[8px] font-black uppercase tracking-[0.3em] max-w-xl mx-auto">
          Experimental 2026 data stream. Dates and metadata are projected and subject to change.
        </p>
      </div>
    </div>
  );
};

export default Upcoming;
