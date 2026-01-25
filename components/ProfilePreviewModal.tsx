
import React from 'react';

interface Props {
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    joined_at?: string;
  } | null;
  onClose: () => void;
}

const ProfilePreviewModal: React.FC<Props> = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-24 bg-gradient-to-br from-[#1ce783]/20 to-cyan-500/20" />
        <div className="px-6 pb-8 text-center -mt-12">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#1ce783] to-cyan-500 p-1 border-4 border-[#111] shadow-xl overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-black uppercase">
                {user.username.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-black italic uppercase tracking-tighter text-white">
            {user.username}
          </h2>
          <p className="text-[10px] font-black text-[#1ce783] uppercase tracking-[0.3em] mt-1">Zen Member</p>
          
          <div className="mt-8 grid grid-cols-2 gap-2">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <span className="block text-[8px] font-black text-gray-500 uppercase mb-1">Status</span>
              <span className="text-white text-xs font-bold">Active</span>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <span className="block text-[8px] font-black text-gray-500 uppercase mb-1">Rank</span>
              <span className="text-white text-xs font-bold">Verified</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-8 w-full bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewModal;
