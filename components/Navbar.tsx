
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal, openProfileModal } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const rawUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const username = String(rawUsername);
  const initial = username.length > 0 ? username.charAt(0) : 'U';

  const navLinks = [
    { 
      path: '/', 
      label: 'Home', 
      activeClass: 'text-[#1ce783]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      )
    },
    { 
      path: '/search', 
      label: 'Search', 
      activeClass: 'text-[#1ce783]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      )
    },
    { 
      path: '/anime', 
      label: 'Anime', 
      activeClass: 'text-cyan-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      )
    },
    { 
      path: '/watchlist', 
      label: 'My List', 
      activeClass: 'text-[#1ce783]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      )
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#040404]/90 backdrop-blur-xl border-b border-white/5 z-50 px-4 md:px-8 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-[#1ce783]/20">
          <span className="text-black font-black text-lg italic">Z</span>
        </div>
        <span className="text-white font-black text-xl md:text-2xl tracking-tighter uppercase italic">
          ZEN<span className="text-[#1ce783]">STREAM</span>
        </span>
      </Link>
      
      <div className="flex items-center gap-4 md:gap-8 flex-1 justify-center px-2">
        {navLinks.map((link) => (
          <Link 
            key={link.path}
            to={link.path} 
            className={`transition-all duration-300 flex items-center justify-center ${isActive(link.path) ? link.activeClass : 'text-gray-400 hover:text-white'}`}
          >
            <span className="hidden md:block text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {link.label}
            </span>
            <span className="block md:hidden transform active:scale-90">
              {link.icon}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center shrink-0">
        {user ? (
          <button 
            onClick={openProfileModal}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 md:px-3 md:py-1.5 rounded-full transition-all"
          >
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-[10px] md:text-xs font-black uppercase text-black">
              {initial}
            </div>
          </button>
        ) : (
          <button 
            onClick={openAuthModal}
            className="bg-white text-black hover:bg-[#1ce783] px-4 md:px-6 py-1.5 md:py-2 rounded-sm text-[10px] md:text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
