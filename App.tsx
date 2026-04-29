
import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { GenreProvider } from './context/GenreContext';
import { HeroSkeleton } from './components/Skeleton';

const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Anime = lazy(() => import('./pages/Anime'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Details = lazy(() => import('./pages/Details'));
const Profile = lazy(() => import('./pages/Profile'));
const Upcoming = lazy(() => import('./pages/Upcoming'));
const AISuggest = lazy(() => import('./pages/AISuggest'));
const Category = lazy(() => import('./pages/Category'));
const Collections = lazy(() => import('./pages/Collections'));
const CollectionDetails = lazy(() => import('./pages/CollectionDetails'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <GenreProvider>
          <Router>
            <div className="min-h-screen bg-[#121212] text-white flex flex-col">
            <Navbar />
            <AuthModal />
            <ProfileModal />
            
            <main className="flex-1 pb-16 md:pb-0">
              <Suspense fallback={<HeroSkeleton />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/upcoming" element={<Upcoming />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/anime" element={<Anime />} />
                  <Route path="/ai-discovery" element={<AISuggest />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/details/:type/:id" element={<Details />} />
                  <Route path="/category/:id" element={<Category />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/collection/:id" element={<CollectionDetails />} />
                </Routes>
              </Suspense>
            </main>
            
            <MobileNav />
            
            <footer className="py-16 px-6 md:px-12 border-t border-white/5 bg-black/50 text-center text-gray-600 text-[10px] md:text-xs mb-16 md:mb-0">
              <div className="max-w-7xl mx-auto space-y-4">
                <p className="font-black text-[#1ce783] tracking-[0.3em] uppercase italic">ZENSTREAM © 2025</p>
                <p className="max-w-md mx-auto leading-relaxed">
                  Powered by high-performance data streams. Your watchlist and history are secured in the cloud.
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </GenreProvider>
    </DataProvider>
  </AuthProvider>
  );
};

export default App;
