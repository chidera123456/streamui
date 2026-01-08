
import React, { useEffect, useState } from 'react';
import { fetchUpcomingMovies, fetchUpcomingTV } from '../services/tmdbService';
import { getUpcomingNews } from '../services/geminiService';
import { Movie } from '../types';
import MediaCard from '../components/MediaCard';

const Upcoming: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch specifically for 2026 (Logic updated in tmdbService)
        const [movieRes, tvRes] = await Promise.all([
          fetchUpcomingMovies(1),
          fetchUpcomingTV(1)
        ]);
        
        // Take top 12 of each for a clean grid
        const upcomingMovies = movieRes.results.slice(0, 12);
        const upcomingTV = tvRes.results.slice(0, 12);
        
        setMovies(upcomingMovies);
        setTvShows(upcomingTV);
        
        // Prepare AI News snippets for the most popular upcoming items
        const titlesToHype = [...upcomingMovies.slice(0, 4), ...upcomingTV.slice(0, 4)].map(m => ({
          title: m.title || m.name || '',
          overview: m.overview || ''
        }));
        
        if (titlesToHype.length > 0) {
          const hypeMap = await getUpcomingNews(titlesToHype);
          setNews(hypeMap);
        }
      } catch (err) {
        console.error("Failed to load 2026 forecast:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    window.scrollTo(0, 0);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "2026 (TBA)";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#040404]">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-amber-500/20 rounded-full"></div>
        <div className="absolute inset-0 w-16 h-16 border-t-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-amber-500 font-black uppercase text-[10px] tracking-[0.5em] animate-pulse">Syncing 2026 Timeline...</p>
    </div>
  );

  return (
    <div className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="mb-12 md:mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.5em]">Future Transmissions</p>
            </div>
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
              2026 <span className="text-amber-500">Forecast</span>
            </h1>
          </div>
          <div className="max-w-xs md:text-right">
             <p className="text-gray-500 text-xs md:text-sm font-bold uppercase leading-relaxed tracking-wider">
               Direct orbital access to next year's cinematic heavyweights. Pure anticipation starts here.
             </p>
          </div>
        </div>
      </div>

      {/* Speculative News / AI Hype Ticker */}
      {Object.keys(news).length > 0 && (
        <div className="mb-16 md:mb-24 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur-2xl opacity-30"></div>
          <div className="relative bg-[#0a0a0a] border border-amber-500/20 rounded-3xl p-6 md:p-10 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">Global Intel</span>
                <div className="h-[1px] w-20 bg-amber-500/30"></div>
              </div>
              <span className="text-gray-600 text-[8px] font-black uppercase tracking-widest">Source: Gemini Analysis</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(news).map(([title, snippet], idx) => (
                <div key={idx} className="group flex gap-5 items-start animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="text-amber-500/30 font-black italic text-2xl md:text-3xl shrink-0 group-hover:text-amber-500 transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase text-[10px] md:text-xs tracking-widest mb-2 group-hover:text-amber-500 transition-colors">{title}</h3>
                    <p className="text-gray-400 font-bold italic text-sm md:text-base leading-relaxed border-l border-amber-500/20 pl-4">
                      "{snippet}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Movies 2026 */}
      <section className="mb-20 md:mb-32">
        <div className="flex items-center gap-6 mb-10 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter">
            2026 <span className="text-amber-500">Movies</span>
          </h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
          {movies.map((item) => (
            <div key={item.id} className="space-y-4 group">
              <div className="relative">
                <MediaCard media={item} />
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-tighter shadow-2xl transform group-hover:scale-110 transition-transform z-10">
                  {formatDate(item.release_date || '')}
                </div>
              </div>
              <div className="pt-2">
                 <h4 className="text-white font-black text-[10px] md:text-xs uppercase tracking-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                  {item.title}
                 </h4>
                 <p className="text-gray-500 text-[9px] font-bold line-clamp-2 mt-1 italic leading-tight">
                  {item.overview || "Deep space broadcast incoming..."}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Series 2026 */}
      <section>
        <div className="flex items-center gap-6 mb-10 md:mb-16">
          <h2 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
            2026 <span className="text-amber-500">Series</span>
          </h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-amber-500/40 via-amber-500/10 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
          {tvShows.map((item) => (
            <div key={item.id} className="space-y-4 group">
              <div className="relative">
                <MediaCard media={item} />
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-tighter shadow-2xl transform group-hover:scale-110 transition-transform z-10">
                  Forecast: {formatDate(item.first_air_date || '')}
                </div>
              </div>
              <div className="pt-2">
                 <h4 className="text-white font-black text-[10px] md:text-xs uppercase tracking-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                  {item.name}
                 </h4>
                 <p className="text-gray-500 text-[9px] font-bold line-clamp-2 mt-1 italic leading-tight">
                  {item.overview || "Transmission signal weak but promising..."}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Future Disclaimer */}
      <div className="mt-24 pt-12 border-t border-white/5 text-center">
        <p className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em] max-w-xl mx-auto">
          Dates and details for 2026 projects are subject to temporal shifts. Check back often for real-time synchronization.
        </p>
      </div>
    </div>
  );
};

export default Upcoming;
