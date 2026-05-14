
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getActorDetails } from '../services/tmdbService';
import { ActorDetails } from '../types';
import { IMG_URL, BACKDROP_URL } from '../constants';
import { ChevronLeft, Calendar, MapPin, Star } from 'lucide-react';
import { motion } from 'motion/react';
import MediaCard from '../components/MediaCard';

const ActorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [actor, setActor] = useState<ActorDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getActorDetails(parseInt(id));
        setActor(data);
      } catch (error) {
        console.error("Failed to load actor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1ce783]/20 border-t-[#1ce783] rounded-full animate-spin" />
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="min-h-screen bg-[#121212] pt-32 px-16 text-center">
        <h1 className="text-white text-3xl font-bold">Actor profile not found</h1>
        <button onClick={() => navigate(-1)} className="mt-8 text-[#1ce783] font-bold uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  const profileImage = actor.profile_path ? `${IMG_URL}${actor.profile_path}` : '';
  const backgroundPoster = actor.filmography.length > 0 
    ? `${BACKDROP_URL}${actor.filmography[0].backdrop_path}` 
    : '';

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      {/* Hero Section */}
      <div className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        {/* Backdrop Background */}
        <div className="absolute inset-0">
          <img 
            src={backgroundPoster} 
            alt="" 
            className="w-full h-full object-cover scale-105 blur-sm opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-[#121212]" />
        </div>

        <div className="relative z-10 container mx-auto h-full px-6 md:px-16 flex flex-col md:flex-row items-center md:items-end gap-10 pb-20">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-10 left-6 md:left-16 w-12 h-12 rounded-full glass-morphism border border-white/10 flex items-center justify-center text-white hover:bg-[#1ce783] hover:text-black transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Portrait Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-48 h-72 md:w-64 md:h-96 shrink-0 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] border-4 border-white/5"
          >
            <img src={profileImage} alt={actor.name} className="w-full h-full object-cover" />
          </motion.div>

          {/* Info Section */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
                {actor.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-widest">
                  <Star className="w-4 h-4 text-[#1ce783]" />
                  {actor.known_for_department}
                </div>
                {actor.birthday && (
                  <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-widest">
                    <Calendar className="w-4 h-4 text-[#1ce783]" />
                    {new Date(actor.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
                {actor.place_of_birth && (
                  <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-widest">
                    <MapPin className="w-4 h-4 text-[#1ce783]" />
                    {actor.place_of_birth}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-300 text-sm md:text-base leading-relaxed max-w-3xl line-clamp-6 opacity-80"
            >
              {actor.biography || "No biography available for this actor."}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Filmography Section */}
      <div className="container mx-auto px-6 md:px-16 mt-12 space-y-12">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            Starred In
          </h2>
          <span className="text-[#1ce783] font-bold italic">{actor.filmography.length} Releases</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {actor.filmography.map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 6) * 0.1 }}
            >
              <MediaCard media={item} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActorProfile;
