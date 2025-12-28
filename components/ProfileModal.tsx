import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { Link } from 'react-router-dom';

const ProfileModal: React.FC = () => {
  const { user, isProfileModalOpen, closeProfileModal, logout } = useAuth();
  const { watchlist } = useWatchlist();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isProfileModalOpen || !user) return null;

  const handleLogout = async () => {
    await logout();
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const username = String(user.user_metadata?.username || user.email?.split('@')[0] || 'User');
  const initial = username.length > 0 ? username.charAt(0) : 'U';
  
  const joinedDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : 'Recently';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeProfileModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-300 cursor-pointer"
      onClick={handleBackdropClick}
    >
      <div 
        className="w-full max-w-2xl bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-32 bg-gradient-to-br from-[#1ce783]/20 via-[#1ce783]/10 to-cyan-500/20">
          <div className="absolute inset-0 bg-black/20"></div>
          <button 
            onClick={closeProfileModal}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2 bg-black/20 rounded-full backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute -bottom-10 left-8 p-1 bg-[#141414] rounded-full border-4 border-[#141414] shadow-xl">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-3xl font-black uppercase italic tracking-tighter text-black">
              {initial}
            </div>
          </div>
        </div>

        <div className="pt-14 pb-10 px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-1">
                {username}
              </h1>
              <p className="text-gray-400 font-medium text-sm">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {deferredPrompt && (
                <button 
                  onClick={handleInstall}
                  className="bg-[#1ce783] text-black px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-[#1ce783]/20"
                >
                  Install App
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-600/50 text-gray-400 hover:text-red-500 px-6 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-[#1ce783] uppercase mb-4 tracking-widest">Account Info</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">Member Since</span>
                  <span className="text-white font-black text-xs">{joinedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">Status</span>
                  <span className="text-[#1ce783] font-black text-[10px] uppercase tracking-widest italic">Zen Member</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-[#1ce783] uppercase mb-4 tracking-widest">Collection</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">Watchlist</span>
                  <Link 
                    to="/watchlist" 
                    onClick={closeProfileModal}
                    className="bg-[#1ce783] text-black w-8 h-8 flex items-center justify-center rounded-lg font-black hover:scale-110 transition-transform text-sm"
                  >
                    {watchlist.length}
                  </Link>
                </div>
                <p className="text-[10px] text-gray-500 italic">Cloud synchronized metadata.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;