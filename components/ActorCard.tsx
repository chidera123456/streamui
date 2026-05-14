
import React from 'react';
import { Link } from 'react-router-dom';
import { Actor } from '../types';
import { IMG_URL } from '../constants';

interface Props {
  actor: Actor;
}

const ActorCard: React.FC<Props> = ({ actor }) => {
  const profileUrl = actor.profile_path 
    ? `${IMG_URL}${actor.profile_path}`
    : `https://via.placeholder.com/300x450/111/444?text=${encodeURIComponent(actor.name)}`;

  return (
    <Link to={`/actor/${actor.id}`} className="group block h-full">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden glass-morphism border border-white/10 transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <img 
          src={profileUrl} 
          alt={actor.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="text-[10px] sm:text-base font-black text-white italic leading-tight mb-0.5 truncate">
            {actor.name}
          </h3>
          <p className="text-[8px] sm:text-[10px] font-bold text-[#1ce783] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            {actor.known_for_department}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ActorCard;
