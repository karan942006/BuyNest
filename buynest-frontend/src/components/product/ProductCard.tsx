import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Rating } from '../ui/Rating';
import { Badge } from '../ui/Badge';
import { useCart } from '../../hooks/useCart';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    mrp: number;
    discount_percent?: number;
    rating?: number;
    review_count?: number;
    images?: Array<{ url: string; is_primary?: boolean }>;
    is_featured?: boolean;
    is_cod?: boolean;
    seller?: { store_name: string };
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, isLoading } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const primaryImage = product.images?.find(img => img.is_primary)?.url || product.images?.[0]?.url;
  const discount = product.discount_percent ?? Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    await addItem(product.id);
    setAdding(false);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted(!wishlisted);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group bg-white dark:bg-gray-900 rounded-xl border border-border dark:border-white/5 overflow-hidden shadow-sm hover:shadow-premium transition-shadow duration-300"
    >
      <Link to={`/product/${product.id}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary dark:bg-gray-800">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <ShoppingCart className="w-12 h-12 opacity-20" />
            </div>
          )}

          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2">
              <Badge variant="danger">{discount}% OFF</Badge>
            </div>
          )}

          {/* Featured badge */}
          {product.is_featured && (
            <div className="absolute top-2 right-10">
              <Badge variant="gold"><Zap className="w-3 h-3 inline mr-1" />Featured</Badge>
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${wishlisted ? 'fill-danger text-danger' : 'text-muted hover:text-danger'}`}
            />
          </button>

          {/* Add to cart overlay */}
          <motion.button
            onClick={handleAddToCart}
            disabled={adding || isLoading}
            className="absolute bottom-0 left-0 right-0 py-2.5 bg-accent text-white text-sm font-semibold 
                       translate-y-full group-hover:translate-y-0 transition-transform duration-300
                       flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {adding ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {adding ? 'Adding...' : 'Add to Cart'}
          </motion.button>
        </div>

        {/* Details */}
        <div className="p-3 space-y-1.5">
          {product.seller?.store_name && (
            <p className="text-xs text-muted truncate">{product.seller.store_name}</p>
          )}
          <h3 className="text-sm font-semibold text-text dark:text-white line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {product.rating !== undefined && (
            <Rating value={product.rating} reviewCount={product.review_count} />
          )}

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className="font-mono font-bold text-text dark:text-white text-base">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span className="font-mono text-xs text-muted line-through">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {product.is_cod && (
            <p className="text-xs text-success font-medium">✓ COD Available</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
