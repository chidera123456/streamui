
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal, openProfileModal } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const initial = String(username).charAt(0).toUpperCase();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/anime', label: 'Anime' },
    { path: '/watchlist', label: 'My List' }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isHomePage = location.pathname === '/';

  if (isMobile && !isHomePage) return null;

  return (
    <nav className="absolute top-0 left-0 right-0 h-16 md:h-24 z-50 px-6 md:px-16 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-12 pointer-events-auto">
        <Link to="/" className="flex items-center gap-2 group shrink-0 transform-gpu active:scale-95 transition-transform duration-150">
          <span className="text-white font-black text-xl md:text-3xl tracking-tighter uppercase italic drop-shadow-lg">
            ZEN<span className="text-[#1ce783]">STREAM</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-200 transform-gpu hover:translate-y-[-1px] ${isActive(link.path) ? 'text-[#1ce783]' : 'text-white/40 hover:text-white'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6 pointer-events-auto">
        {user ? (
          <button 
            onClick={openProfileModal}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 p-1 pr-5 pl-1 rounded-full transition-all duration-200 group transform-gpu active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-sm font-black uppercase text-black shadow-lg shadow-[#1ce783]/10 overflow-hidden">
              {initial}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Profile</span>
          </button>
        ) : (
          <button 
            onClick={openAuthModal}
            className="bg-white text-black hover:bg-[#1ce783] px-10 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-2xl"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
