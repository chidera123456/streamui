
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
    },
    {
      path: 'https://chat.whatsapp.com/F0yhi3vWyA9394VrxStrC4',
      label: 'Community',
      isExternal: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#040404]/95 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
      {links.map((link) => (
        link.isExternal ? (
          <a 
            key={link.path}
            href={link.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 text-gray-500"
          >
            <div className="p-1.5 rounded-xl transition-colors">
              {link.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
          </a>
        ) : (
          <Link 
            key={link.path}
            to={link.path} 
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 ${isActive(link.path) ? 'text-[#1ce783]' : 'text-gray-500'}`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${isActive(link.path) ? 'bg-[#1ce783]/10' : ''}`}>
              {link.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
          </Link>
        )
      ))}

      <button 
        onClick={user ? openProfileModal : openAuthModal}
        className="flex flex-col items-center justify-center gap-1 transition-all duration-150 transform-gpu w-16 active:scale-90 text-gray-500"
      >
        <div className={`p-0.5 rounded-full transition-all ${user ? 'ring-2 ring-[#1ce783]/20 ring-offset-2 ring-offset-[#040404]' : ''}`}>
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
  );
};

export default MobileNav;
