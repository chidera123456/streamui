
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Details from './pages/Details';
import AISuggest from './pages/AISuggest';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Anime from './pages/Anime';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#0a0a0a] text-white">
          <Navbar />
          <AuthModal />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/ai-suggest" element={<AISuggest />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/details/:type/:id" element={<Details />} />
            </Routes>
          </main>
          
          <footer className="py-12 px-4 md:px-12 border-t border-white/10 bg-black/50 text-center text-gray-500 text-xs">
            <div className="max-w-7xl mx-auto">
              <p className="mb-2 font-black text-gray-300 tracking-widest uppercase italic">STREAMUI © 2025</p>
              <p className="max-w-md mx-auto leading-relaxed">
                Powered by TMDB and Google Gemini. Your profile and watchlist are securely synced to your account across all devices using Supabase Cloud.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
