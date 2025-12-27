
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { useNavigate, Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const { watchlist } = useWatchlist();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040404]">
        <div className="w-10 h-10 border-4 border-[#1ce783] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const username = String(user.user_metadata?.username || user.email?.split('@')[0] || 'User');
  const initial = username.length > 0 ? username.charAt(0) : 'U';
  
  const joinedDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : 'Recently';

  // "Opt-out" handler: Navigate back to the previous context (e.g. the movie page)
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Navigate back to history to return to previous state (like a movie details page)
      // We check history length to ensure we stay within the app context
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div 
      className="pt-20 md:pt-32 pb-20 px-4 md:px-12 min-h-screen bg-[#040404] flex items-start justify-center cursor-pointer"
      onClick={handleBackgroundClick}
    >
      <div 
        className="w-full max-w-4xl bg-[#141414] border border-white/10 rounded-3xl overflow-hidden shadow-2xl cursor-default animate-in fade-in slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Header */}
        <div className="relative h-32 md:h-48 bg-gradient-to-br from-[#1ce783]/20 via-[#1ce783]/10 to-purple-800/20">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          <div className="absolute -bottom-10 md:-bottom-12 left-6 md:left-8 p-1 bg-[#141414] rounded-full border-4 border-[#141414] shadow-xl">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black">
              {initial}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="pt-14 md:pt-16 pb-8 md:pb-12 px-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-1">
                {username}
              </h1>
              <p className="text-gray-400 font-medium text-sm md:text-base">{user.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-600/50 text-gray-400 hover:text-red-500 px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs md:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-10 md:mt-12">
            <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-[#1ce783] uppercase mb-4 tracking-widest">Account Info</p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] md:text-xs font-bold uppercase">Member Since</span>
                  <span className="text-white font-black text-xs md:text-sm">{joinedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] md:text-xs font-bold uppercase">Cloud ID</span>
                  <span className="text-white font-black text-[9px] md:text-[10px] truncate max-w-[120px]">{user.id}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-[#1ce783] uppercase mb-4 tracking-widest">Activity</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px] md:text-xs font-bold uppercase">Watchlist Items</span>
                  <Link to="/watchlist" className="bg-[#1ce783] text-black w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg font-black hover:scale-110 transition-transform text-xs md:text-sm">
                    {watchlist.length}
                  </Link>
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 italic">Your collection is synced with your account in the cloud.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
