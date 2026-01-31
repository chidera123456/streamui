
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal, openProfileModal } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const initial = String(username).charAt(0).toUpperCase();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/anime', label: 'Anime' },
    { path: '/watchlist', label: 'My List' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isHomePage = location.pathname === '/';

  // Hide Navbar on mobile if not on home page (as per existing logic)
  if (isMobile && !isHomePage) return null;

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 h-16 md:h-20 z-[100] px-4 md:px-12 flex items-center justify-between transition-colors duration-500 ease-in-out ${
        isScrolled ? 'bg-[#040404]' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="flex items-center gap-6 md:gap-12">
        <Link to="/" className="flex items-center gap-2 group shrink-0 transform-gpu active:scale-95 transition-transform duration-150">
          <span className="text-white font-black text-xl md:text-2xl lg:text-3xl tracking-tighter uppercase italic drop-shadow-lg">
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
        {/* Mock Search/Notifications for Netflix vibe */}
        <div className="flex items-center gap-5 text-white mr-2">
          <Link to="/search" className="hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <button className="hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
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
