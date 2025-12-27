
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const res = await login(formData.email, formData.password);
        if (!res.success) setError(res.message);
      } else {
        if (!formData.username) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const res = await register(formData.username, formData.email, formData.password);
        if (!res.success) setError(res.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the actual backdrop was clicked, not the modal content
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden cursor-default">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1ce783] to-[#00ed82]"></div>
        
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8">
          {isLogin ? 'Welcome ' : 'Join '}
          <span className="text-[#1ce783]">{isLogin ? 'Back' : 'ZenStream'}</span>
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-600/10 border border-red-600/20 text-red-500 text-sm font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-1">Username</label>
              <input
                type="text"
                required
                disabled={loading}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#1ce783] transition-colors disabled:opacity-50"
                placeholder="CinemaLover"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-1">Email</label>
            <input
              type="email"
              required
              disabled={loading}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#1ce783] transition-colors disabled:opacity-50"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-1">Password</label>
            <input
              type="password"
              required
              disabled={loading}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#1ce783] transition-colors disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1ce783] hover:bg-[#1ce783]/80 text-black py-4 rounded-xl font-black uppercase italic tracking-widest shadow-lg shadow-[#1ce783]/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[#1ce783] font-black uppercase tracking-widest hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Exporting the component as default to fix the import error in App.tsx
export default AuthModal;
