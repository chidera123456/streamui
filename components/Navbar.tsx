
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import NotificationPanel from './NotificationPanel';
import { searchMedia } from '../services/tmdbService';
import { Movie } from '../types';
import { IMG_URL } from '../constants';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal, openProfileModal } = useAuth();
  const { notifications, markNotificationsAsRead } = useData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  
  const isActive = (path: string) => location.pathname === path;
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const initial = String(username).charAt(0).toUpperCase();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/anime', label: 'Anime' },
    { path: '/watchlist', label: 'My List' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
        setShowSearch(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          setSearchResults(res.results.slice(0, 8));
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

  const handleToggleNotifs = () => {
    if (!showNotifs) {
      markNotificationsAsRead();
    }
    setShowNotifs(!showNotifs);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isHomePage = location.pathname === '/';

  if (isMobile && !isHomePage) return null;

  return (
    <nav 
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-[100] px-4 md:px-12 flex items-center justify-between transition-all duration-500 ease-in-out pt-safe ${
        isScrolled ? 'bg-[#121212] h-16 md:h-20' : 'bg-gradient-to-b from-black/80 to-transparent h-20 md:h-24'
      }`}
    >
      <div className="flex items-center gap-6 md:gap-12">
        <Link to="/" className="flex items-center gap-1.5 group shrink-0 transform-gpu active:scale-95 transition-transform duration-150">
          <div className="w-4 h-6 md:w-5 md:h-7 relative flex items-center justify-center">
            <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(28,231,131,0.6)]">
              {/* Perspective Ribbon Z with Netflix-style bottom curve */}
              <path d="M4 6H20" stroke="#1ce783" strokeWidth="6" strokeLinecap="round" className="opacity-70" />
              <path d="M20 6L4 30" stroke="#1ce783" strokeWidth="7" strokeLinecap="round" />
              <path d="M4 30C4 30 12 33 20 30" stroke="#1ce783" strokeWidth="6" strokeLinecap="round" className="opacity-70" />
            </svg>
          </div>
          <span className="text-white font-black text-sm md:text-base lg:text-lg tracking-tighter uppercase italic leading-none pt-0.5">
            ZEN<span className="text-[#1ce783]">STREAM</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-5 lg:gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`text-[11px] lg:text-[13px] font-medium transition-colors duration-300 hover:text-gray-300 ${
                isActive(link.path) ? 'text-white font-bold' : 'text-gray-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-5 text-white mr-2">
          {/* Inline Search Toggle */}
          <div className="relative">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`hover:scale-110 transition-all transform duration-300 ${showSearch ? 'text-[#1ce783]' : 'text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showSearch ? "M6 18L18 6M6 6l12 12" : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"} />
              </svg>
            </button>

            {/* Search Overlay Dropdown */}
            {showSearch && (
              <div className="fixed inset-x-0 top-16 md:top-20 md:absolute md:top-full md:right-0 md:left-auto md:w-[450px] mt-4 bg-[#0c0c0c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-4 md:p-6 space-y-4">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input 
                      ref={searchInputRef}
                      type="text"
                      placeholder="Title, genre, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 md:py-4 text-sm md:text-base text-white outline-none focus:border-[#1ce783]/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </form>

                  <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((movie) => (
                        <Link
                          key={movie.id}
                          to={`/details/${movie.media_type}/${movie.id}`}
                          onClick={() => {
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-all group"
                        >
                          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
                            {movie.poster_path ? (
                              <img src={`${IMG_URL}${movie.poster_path}`} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white/40">No Poster</div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-bold text-white group-hover:text-[#1ce783] transition-colors truncate">
                              {movie.title || movie.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 group-hover:text-white/60 transition-colors">
                              <span>{movie.media_type}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span>{(movie.release_date || movie.first_air_date || '').substring(0, 4)}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span className="text-[#1ce783]">★ {movie.vote_average.toFixed(1)}</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : searchQuery.length >= 2 && !isSearching ? (
                      <div className="py-12 text-center">
                        <p className="text-white/20 text-xs font-black uppercase tracking-widest italic">No matches found</p>
                      </div>
                    ) : (
                      <div className="py-12 text-center opacity-40">
                         <p className="text-white/20 text-xs font-black uppercase tracking-widest italic">Search for movies, tv shows, or anime</p>
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <Link
                      to="/search"
                      onClick={() => setShowSearch(false)}
                      className="block w-full py-3 text-center bg-[#1ce783]/10 hover:bg-[#1ce783] text-[#1ce783] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4 border border-[#1ce783]/20"
                    >
                      Advanced Discovery View
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <a 
            href="https://discord.gg/7N6ghMTSFj" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform text-[#5865F2]"
            title="Join Discord Server"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
            </svg>
          </a>
          
          <div className="relative">
            <button 
              onClick={handleToggleNotifs}
              className={`hover:scale-110 transition-transform relative ${showNotifs ? 'text-[#1ce783]' : 'text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full border border-black animate-pulse"></span>
              )}
            </button>
            {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
          </div>
        </div>

        {user ? (
          <button 
            onClick={openProfileModal}
            className="flex items-center gap-2 group transform-gpu active:scale-95"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-xs font-black uppercase text-black shadow-lg overflow-hidden group-hover:ring-2 ring-white/20 transition-all">
              {initial}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={openAuthModal}
            className="bg-[#1ce783] text-black hover:bg-white px-6 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-xl"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
