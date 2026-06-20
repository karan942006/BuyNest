import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShieldCheck, Heart, ShoppingBag, Plus, Minus, ArrowRight, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { setCart, setCartLoading } from '../../store/slices/cartSlice';
import type { RootState } from '../../store';
import { Button } from '../../components/ui/Button';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal, discount, shipping, total, isLoading } = useSelector(
    (state: RootState) => state.cart
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    dispatch(setCartLoading(true));
    try {
      const response = await api.get('/cart');
      if (response.data.success) {
        dispatch(setCart(response.data.data));
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load shopping cart');
    } finally {
      dispatch(setCartLoading(false));
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const response = await api.put(`/cart/${itemId}`, { quantity: newQty });
      if (response.data.success) {
        // Refresh cart
        fetchCart();
        toast.success('Cart updated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      if (response.data.success) {
        fetchCart();
        toast.success('Item removed from cart');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleSaveForLater = async (itemId: string, save: boolean) => {
    try {
      const response = await api.put(`/cart/${itemId}`, { saved_for_later: save });
      if (response.data.success) {
        fetchCart();
        toast.success(save ? 'Saved for later' : 'Moved to active cart');
      }
    } catch (error) {
      toast.error('Failed to update item state');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      // Direct call to check coupon status or mock it here since backend checks it during order creation
      // For instant feedback, we call a validate-coupon endpoint if it exists, or verify locally.
      // We will perform local check / simulated API
      if (couponCode.toUpperCase() === 'BUYNEST10') {
        setAppliedCoupon({
          code: 'BUYNEST10',
          type: 'percentage',
          value: 10,
          description: '10% discount on your order',
        });
        setCouponError('');
        toast.success('Promo code BUYNEST10 applied!');
      } else if (couponCode.toUpperCase() === 'WELCOME50') {
        setAppliedCoupon({
          code: 'WELCOME50',
          type: 'flat',
          value: 50,
          description: 'Flat ₹50 off on first purchase',
        });
        setCouponError('');
        toast.success('Promo code WELCOME50 applied!');
      } else {
        setCouponError('Invalid or expired coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError('Error validating coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const activeItems = items.filter((item) => !item.saved_for_later);
  const savedItems = items.filter((item) => item.saved_for_later);

  // Calculate final numbers with coupon applied
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      couponDiscount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else {
      couponDiscount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal + shipping - couponDiscount);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-secondary dark:bg-dark">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-semibold text-muted">Reviewing your shopping cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

        {activeItems.length === 0 ? (
          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-premium">
            <ShoppingBag className="w-16 h-16 text-muted mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted mb-8 max-w-sm mx-auto">
              Looks like you haven't added anything to your cart yet. Explore our premium collections to get started.
            </p>
            <Link to="/products">
              <Button variant="primary">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl overflow-hidden shadow-premium">
                <div className="px-6 py-4 border-b border-border dark:border-border/10 bg-slate-50/50 dark:bg-dark/20 flex justify-between items-center">
                  <span className="font-semibold text-sm">
                    {activeItems.length} {activeItems.length === 1 ? 'Item' : 'Items'} selected
                  </span>
                  {shipping === 0 ? (
                    <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                      Free Shipping Applied
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted">
                      Add ₹{499 - subtotal} more for Free Shipping
                    </span>
                  )}
                </div>

                <div className="divide-y divide-border dark:divide-border/10">
                  <AnimatePresence>
                    {activeItems.map((item) => {
                      const image = item.product?.images?.[0]?.url || 'https://via.placeholder.com/150';
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          exit={{ opacity: 0, y: 20 }}
                          className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
                        >
                          <img
                            src={image}
                            alt={item.product?.name}
                            className="w-24 h-24 object-cover rounded-xl border border-border dark:border-border/10 flex-shrink-0 bg-secondary"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item.product_id}`}
                              className="font-bold text-base hover:text-accent transition-colors block truncate"
                            >
                              {item.product?.name}
                            </Link>
                            <p className="text-xs text-muted mt-1 uppercase tracking-wider">
                              Seller: BuyNest Direct
                            </p>
                            
                            <div className="flex items-center gap-4 mt-4">
                              {/* Quantity Selector */}
                              <div className="flex items-center border border-border dark:border-border/10 rounded-lg overflow-hidden bg-secondary dark:bg-dark">
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="p-2 hover:bg-slate-200 dark:hover:bg-dark-light transition-colors text-muted"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-4 text-sm font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="p-2 hover:bg-slate-200 dark:hover:bg-dark-light transition-colors text-muted"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleSaveForLater(item.id, true)}
                                className="text-xs font-semibold text-muted hover:text-accent flex items-center gap-1.5 transition-colors"
                              >
                                <Heart className="w-4 h-4" /> Save for later
                              </button>
                            </div>
                          </div>

                          <div className="text-right flex sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-border dark:border-border/10">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-muted hover:text-danger p-2 rounded-lg hover:bg-danger/5 transition-all order-2 sm:order-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            
                            <div className="order-1 sm:order-2 sm:mt-4">
                              <div className="font-extrabold text-lg">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </div>
                              {item.mrp > item.price && (
                                <div className="text-xs text-muted line-through">
                                  ₹{(item.mrp * item.quantity).toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Secure Checkout Badge */}
              <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-success flex-shrink-0" />
                <span className="text-xs text-success-dark dark:text-success font-medium">
                  Safe and Secure Payments. 100% Authentic Products. 14-day Easy Return Policy.
                </span>
              </div>
            </div>

            {/* Price details Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
                <h3 className="font-bold text-lg mb-6">Order Summary</h3>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyCoupon} className="mb-6">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Percent className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Promo Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        className="w-full pl-9 pr-4 py-2 text-sm font-medium border border-border dark:border-border/10 rounded-lg outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                      />
                    </div>
                    {appliedCoupon ? (
                      <Button type="button" variant="outline" size="sm" onClick={removeCoupon} className="border-danger/30 text-danger hover:bg-danger/5">
                        Remove
                      </Button>
                    ) : (
                      <Button type="submit" variant="outline" size="sm">
                        Apply
                      </Button>
                    )}
                  </div>
                  {couponError && <p className="text-xs text-danger font-medium mt-1.5">{couponError}</p>}
                </form>

                {appliedCoupon && (
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-3.5 mb-6 flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-wide">
                        Coupon "{appliedCoupon.code}" Active
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">{appliedCoupon.description}</p>
                    </div>
                    <span className="text-xs font-extrabold text-accent">-₹{couponDiscount}</span>
                  </div>
                )}

                <div className="space-y-4 text-sm font-medium pb-6 border-b border-border dark:border-border/10">
                  <div className="flex justify-between text-muted">
                    <span>Price ({activeItems.length} items)</span>
                    <span className="text-text dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Product Discount</span>
                    <span className="text-success font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-muted">
                      <span>Promo Discount</span>
                      <span className="text-success font-semibold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted">
                    <span>Delivery Charges</span>
                    <span className="text-text dark:text-white">
                      {shipping === 0 ? <span className="text-success font-semibold">FREE</span> : `₹${shipping}`}
                    </span>
                  </div>
                </div>

                <div className="pt-6 pb-6 flex justify-between items-baseline">
                  <span className="font-bold text-base">Total Amount</span>
                  <span className="font-extrabold text-2xl text-accent">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
                  variant="primary"
                  className="w-full py-3 flex items-center justify-center gap-2 group text-base font-bold"
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Saved For Later items Section */}
        {savedItems.length > 0 && (
          <div className="mt-16 border-t border-border dark:border-border/10 pt-12">
            <h2 className="text-2xl font-bold mb-8">Saved for Later ({savedItems.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => {
                const image = item.product?.images?.[0]?.url || 'https://via.placeholder.com/150';
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-5 shadow-premium flex gap-4"
                  >
                    <img
                      src={image}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-xl border border-border dark:border-border/10 flex-shrink-0 bg-secondary"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm truncate">{item.product?.name}</h4>
                        <div className="font-extrabold text-base mt-1.5">
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex gap-4 mt-3">
                        <button
                          onClick={() => handleSaveForLater(item.id, false)}
                          className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-xs font-semibold text-muted hover:text-danger transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
