
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCollection } from '../services/tmdbService';
import { Collection } from '../types';
import { BACKDROP_URL } from '../constants';
import MediaCard from '../components/MediaCard';

const CollectionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const loadCollection = async () => {
      setLoading(true);
      try {
        const data = await fetchCollection(Number(id));
        setCollection(data);
      } catch (err) {
        console.error("Failed to load collection", err);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#121212] px-6 md:px-16 animate-pulse">
        <div className="h-64 w-full bg-white/5 rounded-3xl mb-12" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen pb-20 bg-[#121212]">
      <section className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={`${BACKDROP_URL}${collection.backdrop_path}`}
            className="w-full h-full object-cover"
            alt={collection.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 p-6 md:p-16 max-w-4xl space-y-4 z-20">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight uppercase italic drop-shadow-2xl">
            {collection.name}
          </h1>
          <p className="text-gray-300 text-sm md:text-lg max-w-2xl font-medium leading-relaxed">
            {collection.overview}
          </p>
        </div>
      </section>

      <div className="px-6 md:px-16 mt-12 space-y-8">
        <div className="flex items-center gap-3 border-l-4 border-[#1ce783] pl-4">
          <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">
            Movies in <span className="text-[#1ce783]">Collection</span>
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-5">
          {collection.parts?.map((item) => (
            <MediaCard key={item.id} media={{ ...item, media_type: 'movie' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetails;
