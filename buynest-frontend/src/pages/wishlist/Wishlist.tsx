import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import supabase from '../../services/supabase';
import { Button } from '../../components/ui/Button';

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    mrp: number;
    image_url?: string;
  };
}

export const Wishlist: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const { data: userProfile } = await supabase.auth.getUser();
      if (!userProfile.user) {
        toast.error('Please login to view wishlist');
        return;
      }

      // Fetch wishlist items and join with products
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*, product:products(*)')
        .eq('user_id', userProfile.user.id);

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = async (productId: string, itemId: string) => {
    try {
      const response = await api.post('/cart', { product_id: productId, quantity: 1 });
      if (response.data.success) {
        toast.success('Added to cart');
        // Remove from wishlist
        await handleRemove(itemId);
      }
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-bold tracking-tight mb-8">My Wishlist</h1>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-premium animate-fade-in">
            <Heart className="w-16 h-16 text-muted mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Wishlist is empty</h2>
            <p className="text-muted mb-8 max-w-sm mx-auto">
              Save your favorite items here to view them later or easily add them to your cart.
            </p>
            <Link to="/products">
              <Button variant="primary">Explore Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {items.map((item) => {
                const product = item.product;
                const image = product?.image_url || 'https://via.placeholder.com/150';
                return (
                  <motion.div
                    key={item.id}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-5 shadow-premium flex gap-4"
                  >
                    <img
                      src={image}
                      alt={product?.name}
                      className="w-24 h-24 object-cover rounded-xl border border-border dark:border-border/10 flex-shrink-0 bg-secondary"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm truncate">{product?.name}</h4>
                        <div className="font-extrabold text-base mt-1.5">
                          ₹{product?.price.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex gap-4 mt-3">
                        <button
                          onClick={() => handleAddToCart(product.id, item.id)}
                          className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-xs font-semibold text-muted hover:text-danger transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
