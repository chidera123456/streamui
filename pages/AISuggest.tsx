
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
    setStatus('Gemini is mapping the cinema landscape...');
    
    try {
      const suggestions = await getAISuggestions(prompt);
      setStatus(`Curating ${suggestions.length} cinematic matches...`);
      
      // Parallelize TMDB lookups
      const lookupPromises = suggestions.map(async (s) => {
        const movie = await findByTitle(s.title);
        if (movie) return { movie, suggestion: s };
        return null;
      });

      const enrichedResults = (await Promise.all(lookupPromises)).filter(r => r !== null) as { movie: Movie; suggestion: AISuggestion }[];
      setResults(enrichedResults);
    } catch (err) {
      console.error(err);
      setStatus('The AI magic flickered. Please try again!');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4">
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-purple-500 to-indigo-600 animate-gradient">DISCOVERY</span>
        </h1>
        <p className="text-gray-400 text-lg">
          No more scrolling. Tell the AI what you crave. "Gritty cyberpunk thrillers" or "Indie movies about travel".
        </p>
      </div>

      <form onSubmit={handleAISearch} className="max-w-3xl mx-auto mb-16">
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What's the vibe? Describe it here..."
            className="w-full bg-[#111] border-2 border-white/10 rounded-3xl px-8 py-6 text-xl outline-none focus:border-purple-600 transition-all shadow-[0_0_50px_-12px_rgba(147,51,234,0.1)] group-hover:border-white/20 min-h-[140px] resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-4 bottom-4 bg-gradient-to-r from-red-600 to-purple-600 hover:scale-105 active:scale-95 text-white px-8 py-3 rounded-2xl font-black uppercase italic tracking-tighter transition-all disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-purple-900/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : 'Manifest Suggestions ✨'}
          </button>
        </div>
        {status && <p className="mt-4 text-center text-purple-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">{status}</p>}
      </form>

      <div className="space-y-12">
        {results.map((res, i) => (
          <div key={res.movie.id} className="flex flex-col md:flex-row gap-8 items-start bg-white/5 p-8 rounded-[2rem] border border-white/10 group hover:border-purple-500/50 hover:bg-white/[0.07] transition-all duration-500">
            <div className="w-full md:w-64 shrink-0">
              <MediaCard media={res.movie} />
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-white/20 italic tracking-tighter">0{i + 1}</span>
                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white group-hover:text-red-500 transition-colors">
                  {res.movie.title || res.movie.name}
                </h3>
              </div>
              <div className="bg-gradient-to-r from-purple-600/20 to-transparent border-l-4 border-purple-500 p-6 rounded-r-xl">
                <p className="text-purple-100 font-semibold text-xl leading-relaxed italic">
                  "{res.suggestion.reason}"
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-gray-400 text-base leading-relaxed max-w-2xl">
                  {res.movie.overview}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
                    <span className="text-yellow-500 text-xs">★</span>
                    <span className="text-white text-xs font-black">{res.movie.vote_average.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-500 text-xs font-black uppercase tracking-widest">
                    {(res.movie.release_date || res.movie.first_air_date || '').substring(0, 4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggest;
