import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  reviewCount,
  size = 'sm',
  showCount = true,
  className = ''
}) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4.5 h-4.5', lg: 'w-5 h-5' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= Math.floor(value);
        const partial = !filled && i < value;
        return (
          <Star
            key={i}
            className={`${sizes[size]} ${
              filled ? 'fill-gold text-gold' : partial ? 'fill-gold/50 text-gold' : 'text-border dark:text-gray-600'
            }`}
          />
        );
      })}
      <span className={`${textSizes[size]} font-semibold text-text dark:text-white ml-0.5`}>{value.toFixed(1)}</span>
      {showCount && reviewCount !== undefined && (
        <span className={`${textSizes[size]} text-muted`}>({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
};

export default Rating;
