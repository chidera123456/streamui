
import React, { useEffect, useState } from 'react';
import { fetchCollection } from '../services/tmdbService';
import { Collection } from '../types';
import { BACKDROP_URL } from '../constants';
import { Link } from 'react-router-dom';

const ALL_COLLECTION_IDS = [
  10,     // Star Wars
  86311,  // The Avengers
  295,    // Pirates of the Caribbean
  1241,   // Harry Potter
  119,    // Lord of the Rings
  645,    // James Bond
  9485,   // Fast & Furious
  263,    // The Dark Knight
  5298,   // The Hunger Games
  131230, // The Hunger Games Collection
  328,    // Jurassic Park
  415939, // Wonder Woman
  230,    // The Godfather
  84,     // Indiana Jones
  1575,   // Rocky
  121938, // John Wick
  115570, // Spider-Man (Homecoming)
  420,    // Chronicles of Narnia
  531241, // Spider-Man (Spider-Verse)
];

const Collections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const results = await Promise.all(
          ALL_COLLECTION_IDS.map(id => fetchCollection(id))
        );
        setCollections(results.filter((c): c is Collection => c !== null));
      } catch (err) {
        console.error("Failed to load collections", err);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#040404] px-6 md:px-16">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">
            Movie <span className="text-[#1ce783]">Collections</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium max-w-2xl">
            Explore curated sagas and cinematic universes. Every story, every sequel, all in one place.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[16/9] bg-white/5 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
        )}
      </div>
    </div>
  );
};

export default Collections;
