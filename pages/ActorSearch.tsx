
import React, { useState, useEffect, useCallback } from 'react';
import { searchActors } from '../services/tmdbService';
import { Actor } from '../types';
import ActorCard from '../components/ActorCard';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ActorSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchActors(searchQuery);
      setResults(data.results);
    } catch (error) {
      console.error("Actor search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  return (
    <div className="min-h-screen bg-[#121212] pt-32 pb-20 px-6 md:px-16">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Search Header */}
        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-black italic uppercase tracking-tighter zen-gradient-text">
              Star Discovery
            </h1>
            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
              Explore your favorite actors, directors, and creators across the cinematic universe.
            </p>
          </motion.div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-[#1ce783]/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
            <div className="relative glass-morphism rounded-full p-2 border border-white/10 flex items-center gap-4 focus-within:border-[#1ce783]/50 transition-all duration-300">
              <div className="pl-6 text-gray-500">
                <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Search stars..." 
                className="flex-1 bg-transparent border-none outline-none text-lg md:text-2xl text-white placeholder:text-gray-600 font-bold italic py-4"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {loading && (
                <div className="pr-6">
                  <Loader2 className="w-6 h-6 text-[#1ce783] animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="space-y-12">
          <AnimatePresence mode="wait">
            {!hasSearched ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-6 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Sparkles className="w-12 h-12 text-[#1ce783]" />
                </div>
                <h2 className="text-2xl font-bold text-white">Find your favorite stars</h2>
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4"
              >
                {results.map((actor, idx) => (
                  <motion.div
                    key={actor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ActorCard actor={actor} />
                  </motion.div>
                ))}
              </motion.div>
            ) : !loading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-gray-500 text-xl font-medium italic">No stars found for "{query}"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ActorSearch;
