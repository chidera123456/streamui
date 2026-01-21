import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal, openProfileModal } = useAuth();
  const isActive = (path: string) => location.pathname === path;

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#040404]/90 backdrop-blur-xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe">
      {links.map((link) => (
        <Link 
          key={link.path}
          to={link.path} 
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${isActive(link.path) ? 'text-[#1ce783] scale-110' : 'text-gray-500'}`}
        >
          {link.icon}
          <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
        </Link>
      ))}

      {/* Dynamic Profile/Sign In Button */}
      <button 
        onClick={user ? openProfileModal : openAuthModal}
        className="flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 text-gray-500"
      >
        {user ? (
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-[10px] font-black uppercase text-black">
            {initial}
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        )}
        <span className="text-[9px] font-black uppercase tracking-tighter">
          {user ? 'Profile' : 'Sign In'}
        </span>
      </button>
    </div>
  );
};

export default MobileNav;