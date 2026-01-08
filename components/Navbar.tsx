
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal, openProfileModal } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5); // Light tap vibe
    }
  };

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
      path: '/upcoming', 
      label: 'Forecast', 
      activeClass: 'text-amber-400',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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
      label: 'List', 
      activeClass: 'text-[#1ce783]',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 md:top-0 md:bottom-auto left-0 right-0 h-20 md:h-16 bg-[#040404]/90 backdrop-blur-2xl border-t md:border-t-0 md:border-b border-white/10 z-[100] px-4 md:px-8 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:shadow-none">
      {/* Logo - Hidden on Mobile */}
      <Link to="/" onClick={handleNavClick} className="hidden md:flex items-center gap-2 group shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#1ce783] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-lg shadow-[#1ce783]/20">
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-white font-black text-xl md:text-2xl tracking-tighter uppercase italic">
          ZEN<span className="text-[#1ce783]">STREAM</span>
        </span>
      </Link>
      
      {/* Main Navigation - Centered and Spaced for Mobile */}
      <div className="flex items-center justify-around md:justify-center gap-2 md:gap-8 flex-1 px-2">
        {navLinks.map((link) => (
          <Link 
            key={link.path}
            to={link.path} 
            onClick={handleNavClick}
            className={`transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${isActive(link.path) ? link.activeClass : 'text-gray-500 hover:text-white'}`}
          >
            <span className="transform active:scale-90 transition-transform">
              {link.icon}
            </span>
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {link.label}
            </span>
          </Link>
        ))}

        {/* Profile/Auth Button - Appears in Nav flow on Mobile */}
        <div className="flex md:hidden items-center justify-center">
          {user ? (
            <button 
              onClick={() => { handleNavClick(); openProfileModal(); }}
              className="flex flex-col items-center justify-center gap-1 group"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-[10px] font-black uppercase text-black ring-2 ring-white/10 group-active:scale-90 transition-transform">
                {initial}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Me</span>
            </button>
          ) : (
            <button 
              onClick={() => { handleNavClick(); openAuthModal(); }}
              className="flex flex-col items-center justify-center gap-1 group text-gray-500 hover:text-[#1ce783]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-active:scale-90 transition-transform"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span className="text-[8px] font-black uppercase tracking-widest">In</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile/Auth Button - Far Right on Desktop */}
      <div className="hidden md:flex items-center shrink-0">
        {user ? (
          <button 
            onClick={() => { handleNavClick(); openProfileModal(); }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-xs font-black uppercase text-black">
              {initial}
            </div>
            <span className="text-white text-[10px] font-black uppercase tracking-widest">{username}</span>
          </button>
        ) : (
          <button 
            onClick={() => { handleNavClick(); openAuthModal(); }}
            className="bg-white text-black hover:bg-[#1ce783] px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#1ce783]/10"
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
