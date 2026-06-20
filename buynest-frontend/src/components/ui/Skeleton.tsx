import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1, circle = false }) => {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`shimmer rounded-md h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`shimmer ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-border dark:border-white/10 p-3 space-y-3">
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-8 rounded-full" circle />
    </div>
  </div>
);

export default Skeleton;
