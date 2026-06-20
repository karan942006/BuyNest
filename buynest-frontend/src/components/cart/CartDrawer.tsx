import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RootState } from '../../store';
import { setCartOpen } from '../../store/slices/uiSlice';
import { useCart } from '../../hooks/useCart';
import { Button } from '../ui/Button';

export const CartDrawer: React.FC = () => {
  const dispatch = useDispatch();
  const { cartOpen } = useSelector((state: RootState) => state.ui);
  const { items, subtotal, shipping, total, updateItem, removeItem, isLoading } = useCart();

  const activeItems = items.filter(i => !i.saved_for_later);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => dispatch(setCartOpen(false))}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-900 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-lg text-text dark:text-white">
                  Cart ({activeItems.reduce((acc, i) => acc + i.quantity, 0)})
                </h2>
              </div>
              <button
                onClick={() => dispatch(setCartOpen(false))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {activeItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-text dark:text-white">Your cart is empty</p>
                    <p className="text-sm text-muted mt-1">Add items to get started</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      dispatch(setCartOpen(false));
                    }}
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border dark:divide-white/5">
                  {activeItems.map((item) => (
                    <div key={item.id} className="p-4 flex gap-3">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl bg-secondary dark:bg-gray-800 overflow-hidden shrink-0">
                        {item.product?.images?.[0]?.url ? (
                          <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-muted opacity-30" />
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-text dark:text-white line-clamp-2 leading-snug">
                          {item.product?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-text dark:text-white text-sm">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {item.mrp > item.price && (
                            <span className="font-mono text-xs text-muted line-through">
                              ₹{(item.mrp * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {/* Quantity */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-border dark:border-white/10 rounded-lg overflow-hidden">
                            <button
                              onClick={() => item.quantity > 1 ? updateItem(item.id, { quantity: item.quantity - 1 }) : removeItem(item.id)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors"
                              disabled={isLoading}
                            >
                              <Minus className="w-3 h-3 text-muted" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-text dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                              className="w-7 h-7 flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors"
                              disabled={isLoading}
                            >
                              <Plus className="w-3 h-3 text-muted" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-danger/10 transition-colors"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {activeItems.length > 0 && (
              <div className="p-4 border-t border-border dark:border-white/10 space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Delivery</span>
                    <span className="font-mono">{shipping === 0 ? <span className="text-success font-semibold">FREE</span> : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text dark:text-white pt-1 border-t border-border dark:border-white/10">
                    <span>Total</span>
                    <span className="font-mono">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  onClick={() => dispatch(setCartOpen(false))}
                  className="block"
                >
                  <Button variant="primary" className="w-full" size="lg">
                    Checkout →
                  </Button>
                </Link>
                <Link
                  to="/cart"
                  onClick={() => dispatch(setCartOpen(false))}
                  className="block text-center text-sm text-accent hover:underline"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
