
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWatchlist } from '../hooks/useWatchlist';
import { Link } from 'react-router-dom';

const ProfileModal: React.FC = () => {
  const { user, isProfileModalOpen, closeProfileModal, logout, updateProfile } = useAuth();
  const { watchlist } = useWatchlist();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('ZenStream: Install prompt captured');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (user) {
      setNewUsername(user.user_metadata?.username || user.email?.split('@')[0] || '');
    }
  }, [user]);

  if (!isProfileModalOpen || !user) return null;

  const handleLogout = async () => {
    await logout();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    
    setUpdateLoading(true);
    setMessage(null);
    
    const res = await updateProfile({ username: newUsername });
    
    if (res.success) {
      setMessage({ type: 'success', text: 'Identity synced across all comments.' });
      setTimeout(() => {
        setIsEditing(false);
        setMessage(null);
      }, 2000);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setUpdateLoading(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`ZenStream: User ${outcome} the install prompt`);
      setDeferredPrompt(null);
    } else {
      // If prompt isn't supported/available, show the manual guide
      setShowInstallGuide(true);
    }
  };

  const handleRefreshApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const username = String(user.user_metadata?.username || user.email?.split('@')[0] || 'User');
  const initial = username.length > 0 ? username.charAt(0) : 'U';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeProfileModal();
      setIsEditing(false);
      setShowInstallGuide(false);
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
            onClick={() => { closeProfileModal(); setIsEditing(false); setShowInstallGuide(false); }}
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
            <div className="flex-1">
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-1">
                      {username}
                    </h1>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-[#1ce783] transition-all"
                      title="Edit Profile"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-400 font-medium text-sm">{user.email}</p>
                </>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-3">
                   <label className="block text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Update Alias</label>
                   <div className="flex flex-col gap-3">
                     <input 
                       autoFocus
                       type="text"
                       value={newUsername}
                       onChange={(e) => setNewUsername(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#1ce783] transition-all font-bold"
                       placeholder="New Username"
                     />
                     <div className="flex items-center gap-2">
                       <button 
                         type="submit"
                         disabled={updateLoading}
                         className="bg-[#1ce783] text-black px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all disabled:opacity-50"
                       >
                         {updateLoading ? 'Syncing...' : 'Save & Sync'}
                       </button>
                       <button 
                         type="button"
                         onClick={() => { setIsEditing(false); setMessage(null); }}
                         className="text-gray-500 hover:text-white px-4 py-2 font-black uppercase tracking-widest text-[10px]"
                       >
                         Cancel
                       </button>
                     </div>
                   </div>
                   {message && (
                     <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${message.type === 'success' ? 'text-[#1ce783]' : 'text-red-500'}`}>
                       {message.text}
                     </p>
                   )}
                </form>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleRefreshApp}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
                title="Force Reload & Update"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                Refresh
              </button>
              <button 
                onClick={handleInstall}
                className={`px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${deferredPrompt ? 'bg-amber-500 text-black shadow-amber-500/20 animate-pulse' : 'bg-[#1ce783] text-black shadow-[#1ce783]/20'}`}
              >
                {deferredPrompt ? 'Install App' : 'Get App'}
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600/10 border border-red-600/50 text-red-500 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {showInstallGuide && (
            <div className="mt-8 bg-[#1ce783]/5 border border-[#1ce783]/20 p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[#1ce783] font-black uppercase tracking-widest text-xs">PWA Installation</h3>
                 <button onClick={() => setShowInstallGuide(false)} className="text-gray-500 hover:text-white">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>
               <div className="space-y-4">
                 {(isIOS || isSafari) ? (
                   <div className="flex gap-4 items-start">
                     <div className="w-8 h-8 rounded-lg bg-[#1ce783] flex items-center justify-center shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                     </div>
                     <p className="text-gray-300 text-xs leading-relaxed">
                       To download: Tap <span className="text-white font-black">Share</span> then <span className="text-white font-black">"Add to Home Screen"</span>.
                     </p>
                   </div>
                 ) : (
                   <div className="flex gap-4 items-start">
                     <div className="w-8 h-8 rounded-lg bg-[#1ce783] flex items-center justify-center shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                     </div>
                     <p className="text-gray-300 text-xs leading-relaxed">
                       To download: Open browser menu and select <span className="text-white font-black">"Install App"</span> or <span className="text-white font-black">"Add to Home Screen"</span>.
                     </p>
                   </div>
                 )}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-[#1ce783] uppercase mb-4 tracking-widest">App Capability</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">Offline Mode</span>
                  <span className="text-[#1ce783] font-black text-xs uppercase tracking-tighter italic">Ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">Native App</span>
                  <span className="text-white font-black text-xs uppercase tracking-tighter">Support</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-[#1ce783] uppercase mb-4 tracking-widest">Cloud Sync</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px] font-bold uppercase">Synced Items</span>
                  <Link 
                    to="/watchlist" 
                    onClick={closeProfileModal}
                    className="bg-[#1ce783] text-black w-8 h-8 flex items-center justify-center rounded-lg font-black hover:scale-110 transition-transform text-sm"
                  >
                    {watchlist.length}
                  </Link>
                </div>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Encrypted Cloud Storage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
