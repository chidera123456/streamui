
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollection } from '../services/tmdbService';
import { Collection } from '../types';
import { BACKDROP_URL } from '../constants';

const COLLECTION_IDS = [
  10,     // Star Wars
  86311,  // The Avengers
  295,    // Pirates of the Caribbean
];

const FeaturedCollections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const results = await Promise.all(
          COLLECTION_IDS.map(id => fetchCollection(id))
        );
        setCollections(results.filter((c): c is Collection => c !== null));
      } catch (err) {
        console.error("Failed to load collections", err);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  if (loading) {
    return (
      <section className="px-6 md:px-16 space-y-8">
        <div className="h-8 w-64 bg-white/5 animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-[16/9] bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (collections.length === 0) return null;

  return (
    <section className="px-6 md:px-16 space-y-8">
      <div className="flex items-center gap-3 border-l-4 border-[#1ce783] pl-4">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[#1ce783]">
          Featured Collections
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div 
            key={collection.id}
            className="group relative aspect-[16/9] rounded-2xl overflow-hidden bg-white/5 shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
          >
            <img 
              src={`${BACKDROP_URL}${collection.backdrop_path}`}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
            
            <div className="absolute inset-0 p-6 flex flex-col justify-end gap-2">
              <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-tight">
                {collection.name}
              </h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {collection.parts?.length || 0} Movies
              </p>
              
              <Link 
                to={`/collection/${collection.id}`}
                className="mt-2 w-fit bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                View Collection
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Link 
          to="/collections"
          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-xl transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#1ce783]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span className="text-xs font-black uppercase tracking-[0.2em]">Browse All Collections</span>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedCollections;
