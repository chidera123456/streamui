
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
    <div className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto min-h-screen">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 zen-gradient-text">
          AI DISCOVERY
        </h1>
        <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.4em]">
          Describe the vibe, we find the film.
        </p>
      </div>

      <form onSubmit={handleAISearch} className="max-w-3xl mx-auto mb-16">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Gritty sci-fi with a 90s aesthetic..."
            className="w-full bg-[#0c0c0c] border border-white/5 rounded-sm px-8 py-6 text-xl outline-none focus:border-[#1ce783] transition-all min-h-[140px] resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-4 bottom-4 bg-[#1ce783] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : 'Manifest'}
          </button>
        </div>
        {status && <p className="mt-4 text-center text-[#1ce783] font-black tracking-[0.2em] uppercase text-[9px] animate-pulse">{status}</p>}
      </form>

      <div className="space-y-12">
        {results.map((res, i) => (
          <div key={res.movie.id} className="flex flex-col md:flex-row gap-8 items-start bg-white/5 p-10 rounded-sm border border-white/5 hover:border-[#1ce783]/30 transition-all duration-500">
            <div className="w-full md:w-60 shrink-0">
              <MediaCard media={res.movie} />
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-white/10 italic">0{i + 1}</span>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">
                  {res.movie.title || res.movie.name}
                </h3>
              </div>
              <div className="border-l-2 border-[#1ce783] pl-6 py-2">
                <p className="text-gray-200 font-bold text-lg leading-relaxed italic">
                  "{res.suggestion.reason}"
                </p>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                {res.movie.overview}
              </p>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-[#1ce783]">
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
