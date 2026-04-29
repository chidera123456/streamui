
import React, { useState } from 'react';
import { getAISuggestions } from '../services/geminiService';
import { findByTitle } from '../services/tmdbService';
import { AISuggestion, Movie } from '../types';
import MediaCard from '../components/MediaCard';

const AISuggest: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ movie: Movie; suggestion: AISuggestion }[]>([]);
  const [status, setStatus] = useState('');

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResults([]);
    setStatus('Analyzing Cinema DNA...');
    
    try {
      const suggestions = await getAISuggestions(prompt);
      setStatus(`Matching ${suggestions.length} cinematic results...`);
      
      const lookupPromises = suggestions.map(async (s) => {
        const movie = await findByTitle(s.title);
        if (movie) return { movie, suggestion: s };
        return null;
      });

      const enrichedResults = (await Promise.all(lookupPromises)).filter(r => r !== null) as { movie: Movie; suggestion: AISuggestion }[];
      setResults(enrichedResults);
    } catch (err) {
      console.error(err);
      setStatus('AI flicker. Try again.');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="pt-0 md:pt-4 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 zen-gradient-text">
          AI DISCOVERY
        </h1>
        <p className="text-gray-500 uppercase text-[9px] md:text-[10px] font-black tracking-[0.4em]">
          Describe the vibe, we find the film.
        </p>
      </div>

      <form onSubmit={handleAISearch} className="max-w-3xl mx-auto mb-16 px-2">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Gritty sci-fi with a 90s aesthetic..."
            className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl px-6 md:px-8 py-6 text-lg md:text-xl outline-none focus:border-[#1ce783] transition-all min-h-[140px] md:min-h-[160px] resize-none shadow-2xl"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-4 bottom-4 bg-[#1ce783] text-black px-6 md:px-8 py-2 md:py-3 rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 text-xs md:text-sm shadow-xl shadow-[#1ce783]/20"
          >
            {loading ? (
              <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : 'Manifest'}
          </button>
        </div>
        {status && <p className="mt-4 text-center text-[#1ce783] font-black tracking-[0.2em] uppercase text-[9px] animate-pulse">{status}</p>}
      </form>

      <div className="space-y-12 md:space-y-16">
        {results.map((res, i) => (
          <div key={res.movie.id} className="flex flex-col md:flex-row gap-8 items-start bg-white/5 p-6 md:p-10 rounded-3xl border border-white/5 hover:border-[#1ce783]/30 transition-all duration-500 group">
            <div className="w-full md:w-64 shrink-0 shadow-2xl">
              <MediaCard media={res.movie} />
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl md:text-5xl font-black text-white/10 italic group-hover:text-[#1ce783]/20 transition-colors">0{i + 1}</span>
                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white group-hover:text-[#1ce783] transition-colors">
                  {res.movie.title || res.movie.name}
                </h3>
              </div>
              <div className="border-l-4 border-[#1ce783] pl-6 py-2 bg-[#1ce783]/5 rounded-r-xl">
                <p className="text-gray-200 font-bold text-base md:text-lg leading-relaxed italic">
                  "{res.suggestion.reason}"
                </p>
              </div>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                {res.movie.overview}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-[#1ce783] tracking-widest bg-white/5 w-fit px-4 py-1.5 rounded-full">
                <span>Rating: {res.movie.vote_average.toFixed(1)}</span>
                <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                <span>{(res.movie.release_date || res.movie.first_air_date || '').substring(0, 4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggest;
