
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchMedia } from '../services/tmdbService';
import { Movie } from '../types';
import { IMG_URL } from '../constants';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal, openProfileModal } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = window.setTimeout(async () => {
        try {
          const res = await searchMedia(searchQuery, 'all', 1);
          setSearchResults(res.results.slice(0, 10));
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearch(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'U';
  const initial = String(username).charAt(0).toUpperCase();

  const links = [
    { 
      path: '/', 
      label: 'Home', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ) 
    },
    { 
      path: '/search', 
      label: 'Search', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" i1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ) 
    },
    { 
      path: '/anime', 
      label: 'Anime', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
      ) 
    },
    { 
      path: '/watchlist', 
      label: 'My List', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      ) 
    }
  ];

  return (
    <>
      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-[#0c0c0c] z-[60] flex flex-col pt-safe animate-in fade-in duration-300">
          <div className="p-4 flex items-center gap-3 border-b border-white/5">
            <button 
              onClick={() => setShowSearch(false)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Search Zenith..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm md:text-base text-white outline-none focus:border-[#1ce783]/50 transition-all"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/details/${movie.media_type}/${movie.id}`}
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-[0.98] transform-gpu border border-transparent hover:border-white/5"
                >
                  <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 shadow-lg">
                    {movie.poster_path ? (
                      <img src={`${IMG_URL}${movie.poster_path}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/20 uppercase">No Art</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white mb-1 truncate tracking-tight">{movie.title || movie.name}</h4>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-white/40">
                      <span className="text-[#1ce783]">{movie.media_type}</span>
                      <span>{(movie.release_date || movie.first_air_date || '').substring(0, 4)}</span>
                      <span className="text-white/60">★ {movie.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : searchQuery.length >= 2 && !isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <p className="text-sm font-black uppercase tracking-widest italic">No matches found</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                <p className="max-w-[200px] text-[10px] font-black uppercase tracking-widest leading-relaxed">Type to explore our high-speed content streams</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#121212]/95 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        {links.map((link) => (
          <React.Fragment key={link.path}>
            {link.path === '/search' ? (
              <button 
                onClick={() => setShowSearch(true)}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 ${showSearch ? 'text-[#1ce783]' : 'text-gray-500'}`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${showSearch ? 'bg-[#1ce783]/10' : ''}`}>
                  {link.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
              </button>
            ) : (
              <Link 
                to={link.path} 
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 ${isActive(link.path) ? 'text-[#1ce783]' : 'text-gray-500'}`}
              >
                <div className={`p-1.5 rounded-xl transition-colors ${isActive(link.path) ? 'bg-[#1ce783]/10' : ''}`}>
                  {link.icon}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
              </Link>
            )}
            {link.path === '/search' && (
            <a 
              href="https://discord.gg/7N6ghMTSFj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 text-[#5865F2]"
            >
              <div className="p-1.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                </svg>
              </div>
              <span className="text-[9px] font-black uppercase tracking-tighter">Discord</span>
            </a>
          )}
        </React.Fragment>
      ))}

      <button 
        onClick={user ? openProfileModal : openAuthModal}
        className="flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 text-gray-500"
      >
        <div className={`p-0.5 rounded-full transition-all ${user ? 'ring-2 ring-[#1ce783]/20 ring-offset-2 ring-offset-[#121212]' : ''}`}>
          {user ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-[10px] font-black uppercase text-black shadow-lg overflow-hidden">
              {initial}
            </div>
          ) : (
            <div className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
        </div>
        <span className="text-[9px] font-black uppercase tracking-tighter">
          {user ? 'Profile' : 'Sign In'}
        </span>
      </button>
    </div>
    </>
  );
};

export default MobileNav;
