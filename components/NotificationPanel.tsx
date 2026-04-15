
import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

interface Props {
  onClose: () => void;
}

const NotificationPanel: React.FC<Props> = ({ onClose }) => {
  const { notifications } = useData();

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="absolute top-full right-0 mt-4 w-[320px] md:w-[400px] bg-[#1c1c1c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1ce783]">Recent Feed</h3>
        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Global Broadcasts</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <Link 
              key={notif.id}
              to={notif.link || '#'}
              onClick={onClose}
              className="flex items-start gap-4 p-4 hover:bg-white/5 border-b border-white/5 transition-colors group relative"
            >
              {notif.image && (
                <div className="w-12 h-16 shrink-0 bg-white/5 rounded overflow-hidden shadow-lg">
                  <img src={notif.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-widest ${
                    notif.type === 'release' ? 'bg-[#1ce783] text-black' : 'bg-cyan-500 text-black'
                  }`}>
                    {notif.type}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold">{getTimeAgo(notif.timestamp)}</span>
                </div>
                <h4 className="text-[13px] font-black text-white group-hover:text-[#1ce783] transition-colors truncate mb-1 uppercase tracking-tight">
                  {notif.title}
                </h4>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-[#1ce783] rounded-full shadow-[0_0_8px_rgba(28,231,131,0.5)]"></div>
              )}
            </Link>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center opacity-20">📡</div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">No new signals detected.</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white/5 border-t border-white/5 text-center">
        <button onClick={onClose} className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">
          Close Transmission
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
