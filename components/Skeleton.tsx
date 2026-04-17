import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div 
      className={`bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-[2/3] rounded-xl" />
    <div className="space-y-1.5 px-1">
      <Skeleton className="h-3 w-3/4 rounded-sm" />
      <Skeleton className="h-2 w-1/2 rounded-sm opacity-50" />
    </div>
  </div>
);

export const HeroSkeleton: React.FC = () => (
  <div className="relative h-[50vh] md:h-[85vh] w-full bg-[#181818] overflow-hidden">
    <div className="absolute bottom-0 left-0 p-4 md:p-16 w-full space-y-4">
      <Skeleton className="h-4 w-32 rounded-sm" />
      <Skeleton className="h-12 md:h-24 w-3/4 md:w-1/2 rounded-sm" />
      <Skeleton className="h-4 md:h-6 w-2/3 md:w-1/3 rounded-sm" />
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-10 md:h-14 w-24 md:w-40 rounded-sm" />
        <Skeleton className="h-10 md:h-14 w-24 md:w-40 rounded-sm" />
      </div>
    </div>
  </div>
);

export const GridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4">
    {[...Array(count)].map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;