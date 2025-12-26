
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, openAuthModal } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  // Safely extract username from metadata or email
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-white/10 z-50 px-4 md:px-8 flex items-center justify-between">
      <Link to="/" className="text-red-600 font-extrabold text-2xl tracking-tighter hover:scale-105 transition-transform">
        STREAM<span className="text-white">UI</span>
      </Link>
      
      <div className="flex items-center gap-4 md:gap-6 overflow-x-auto hide-scrollbar flex-1 justify-center px-4">
        <Link 
          to="/" 
          className={`text-sm font-semibold whitespace-nowrap transition-colors ${isActive('/') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Home
        </Link>
        <Link 
          to="/search" 
          className={`text-sm font-semibold whitespace-nowrap transition-colors ${isActive('/search') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          Discovery
        </Link>
        <Link 
          to="/anime" 
          className={`text-sm font-semibold whitespace-nowrap transition-colors ${isActive('/anime') ? 'text-indigo-500 font-black' : 'text-gray-400 hover:text-indigo-400'}`}
        >
          Anime
        </Link>
        <Link 
          to="/watchlist" 
          className={`text-sm font-semibold whitespace-nowrap transition-colors ${isActive('/watchlist') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
        >
          My List
        </Link>
        <Link 
          to="/ai-suggest" 
          className={`hidden md:block text-sm font-semibold whitespace-nowrap px-3 py-1 bg-white/10 rounded-full transition-colors ${isActive('/ai-suggest') ? 'text-purple-500 border border-purple-500 font-black' : 'text-gray-400 hover:text-white hover:bg-white/20'}`}
        >
          AI Magic ✨
        </Link>
      </div>

      <div className="flex items-center">
        {user ? (
          <Link 
            to="/profile" 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-600 to-purple-600 flex items-center justify-center text-[10px] font-black uppercase">
              {username.charAt(0)}
            </div>
            <span className="hidden sm:block text-xs font-bold truncate max-w-[80px]">{username}</span>
          </Link>
        ) : (
          <button 
            onClick={openAuthModal}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase italic tracking-tighter transition-all active:scale-95"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
