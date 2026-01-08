
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Details from './pages/Details';
import Watchlist from './pages/Watchlist';
import Anime from './pages/Anime';
import Upcoming from './pages/Upcoming';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { AuthProvider } from './context/AuthContext';

// Logic to handle Android Back Button & Dynamic Theme
const AndroidNativeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle Android hardware back button
    const handleBackButton = (e: PopStateEvent) => {
      // If we are at the root, let the default behavior happen (minimize app)
      // Otherwise, navigate back within the app
      if (location.pathname !== '/') {
        // We prevent the default browser back to keep it smooth
        // The HashRouter handles most of this, but we ensure it feels native
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [location, navigate]);

  useEffect(() => {
    // Update Android status bar theme color based on page context
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (location.pathname.startsWith('/details')) {
        // Keep it dark for details to allow backdrop to bleed into system UI
        metaThemeColor.setAttribute('content', '#040404');
      } else if (location.pathname === '/anime') {
        metaThemeColor.setAttribute('content', '#0891b2'); // Cyan-600
      } else {
        metaThemeColor.setAttribute('content', '#040404');
      }
    }
  }, [location]);

  return <>{children}</>;
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    
    // Trigger a tiny haptic vibe on load if possible (Android only)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AndroidNativeWrapper>
          <div className="min-h-screen bg-[#040404] text-white selection:bg-[#1ce783] selection:text-black">
            {showSplash && (
              <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-out fade-out duration-500 fill-mode-forwards delay-[2000ms]">
                <div className="text-center animate-zen-intro">
                  <div className="flex items-center justify-center gap-4 mb-8 logo-pulse">
                    <div className="w-24 h-24 md:w-40 md:h-40 rounded-full bg-[#1ce783] flex items-center justify-center shadow-2xl shadow-[#1ce783]/40">
                      <svg viewBox="0 0 24 24" fill="white" className="w-12 h-12 md:w-20 md:h-20 ml-2">
                        <path d="M8 5v14l11-7z" />
                      </svg>
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
            
            <main className={`${showSplash ? 'hidden' : 'block'} pb-24 md:pb-0 md:pt-16`}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upcoming" element={<Upcoming />} />
                <Route path="/search" element={<Search />} />
                <Route path="/anime" element={<Anime />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/details/:type/:id" element={<Details />} />
              </Routes>
            </main>
            
            {!showSplash && (
              <footer className="py-12 px-4 md:px-12 border-t border-white/5 bg-black/50 text-center text-gray-500 text-xs mb-20 md:mb-0">
                <div className="max-w-7xl mx-auto">
                  <p className="mb-2 font-black text-[#1ce783] tracking-widest uppercase italic">ZENSTREAM © 2025</p>
                  <p className="max-w-md mx-auto leading-relaxed">
                    Powered by TMDB. Your profile and watchlist are securely synced to your account across all devices.
                  </p>
                </div>
              </footer>
            )}
          </div>
        </AndroidNativeWrapper>
      </Router>
    </AuthProvider>
  );
};

export default App;
