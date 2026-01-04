
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Details from './pages/Details';
import Watchlist from './pages/Watchlist';
import Anime from './pages/Anime';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#040404] text-white">
          {showSplash && (
            <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-out fade-out duration-500 fill-mode-forwards delay-[2000ms]">
              <div className="text-center animate-zen-intro">
                <div className="flex items-center justify-center gap-4 mb-8 logo-pulse">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-[#1ce783] to-cyan-500 flex items-center justify-center rotate-12 shadow-2xl shadow-[#1ce783]/40">
                    <span className="text-black font-black text-5xl md:text-7xl italic">Z</span>
                  </div>
                </div>
                <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter">
                  ZEN<span className="text-[#1ce783]">STREAM</span>
                </h1>
                <p className="text-[#1ce783]/40 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] mt-8">
                  Pure Discovery
                </p>
              </div>
            </div>
          )}

          {!showSplash && <Navbar />}
          <AuthModal />
          <ProfileModal />
          
          <main className={showSplash ? 'hidden' : 'block'}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/details/:type/:id" element={<Details />} />
            </Routes>
          </main>
          
          {!showSplash && (
            <footer className="py-12 px-4 md:px-12 border-t border-white/5 bg-black/50 text-center text-gray-500 text-xs">
              <div className="max-w-7xl mx-auto">
                <p className="mb-2 font-black text-[#1ce783] tracking-widest uppercase italic">ZENSTREAM © 2025</p>
                <p className="max-w-md mx-auto leading-relaxed">
                  Powered by TMDB. Your profile and watchlist are securely synced to your account across all devices.
                </p>
              </div>
            </footer>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
