
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import NotificationPanel from './NotificationPanel';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal, openProfileModal } = useAuth();
  const { notifications, markNotificationsAsRead } = useData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  
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
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="flex items-center gap-5 text-white mr-2">
          <a 
            href="https://chat.whatsapp.com/invite/ZENSTREAM" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:scale-110 transition-transform text-[#25D366]"
            title="Join our WhatsApp Group"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-4.821 4.754a8.117 8.117 0 01-3.876-.984l-.278-.165-2.882.756.77-2.808-.181-.288a8.103 8.103 0 01-1.243-4.385c0-4.489 3.651-8.139 8.14-8.139 2.175 0 4.219.846 5.756 2.384a8.062 8.062 0 012.383 5.755c0 4.49-3.65 8.14-8.14 8.14m11.626-12.632C22.337 4.527 19.384 1.5 15.925 1.5 9.273 1.5 3.842 6.933 3.84 13.587c0 2.126.556 4.202 1.612 6.031L4 24l4.553-1.194a12.06 12.06 0 005.368 1.261h.004c6.65 0 12.083-5.433 12.085-12.087a12.034 12.034 0 00-3.735-8.541z"/>
            </svg>
          </a>
          <Link to="/search" className="hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          
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
