import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { MapPin, Plus, CreditCard, ShieldCheck, Wallet, Truck, MessageSquare, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RootState } from '../../store';
import { clearCart } from '../../store/slices/cartSlice';
import api from '../../services/api';
import supabase from '../../services/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { items, subtotal, discount, shipping, total } = useSelector((state: RootState) => state.cart);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'wallet'>('razorpay');
  const [useWalletPoints, setUseWalletPoints] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  
  // Inline Add Address Form state
  const [showAddAddress, setShowAddAddress] = useState<boolean>(false);
  const [addressForm, setAddressForm] = useState({
    type: 'home' as 'home' | 'work' | 'other',
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Retrieve coupon from navigation state
  const couponCode = location.state?.couponCode || '';

  // Calculate final numbers locally
  let couponDiscount = 0;
  if (couponCode) {
    if (couponCode.toUpperCase() === 'BUYNEST10') {
      couponDiscount = Math.round((subtotal * 10) / 100);
    } else if (couponCode.toUpperCase() === 'WELCOME50') {
      couponDiscount = Math.min(50, subtotal);
    }
  }

  let finalAmount = Math.max(0, subtotal + shipping - couponDiscount);
  const userWalletBalance = user?.wallet_balance || 0;
  const walletUsedAmount = useWalletPoints ? Math.min(userWalletBalance, finalAmount) : 0;
  finalAmount = finalAmount - walletUsedAmount;

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setAddresses(data || []);
      
      // Auto-select default or first address
      if (data && data.length > 0) {
        const defaultAddr = data.find(a => a.is_default);
        setSelectedAddressId(defaultAddr?.id || data[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load shipping addresses');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.full_name || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user?.id,
          ...addressForm,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Address saved successfully');
      setAddresses((prev) => [...prev, data]);
      setSelectedAddressId(data.id);
      setShowAddAddress(false);
      setAddressForm({
        type: 'home',
        full_name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
      });
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        shipping_address_id: selectedAddressId,
        payment_method: paymentMethod,
        coupon_code: couponCode || null,
        use_wallet: useWalletPoints,
        notes: notes || null,
      };

      const response = await api.post('/orders', orderPayload);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to place order');
      }

      const orderData = response.data.data;
      const razorpayData = response.data.razorpay;

      // Handle Razorpay Checkout Flow
      if (paymentMethod === 'razorpay' && razorpayData) {
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          toast.error('Razorpay SDK failed to load. Please verify your connection.');
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: razorpayData.key,
          amount: razorpayData.amount,
          currency: 'INR',
          name: 'BuyNest',
          description: `Payment for Order ${orderData.order_number}`,
          order_id: razorpayData.order_id,
          handler: async (paymentResponse: any) => {
            const verificationPayload = {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            };

            try {
              const verificationRes = await api.post('/payments/verify', verificationPayload);
              if (verificationRes.data.success) {
                dispatch(clearCart());
                toast.success('Payment verified successfully!');
                navigate('/order-confirmation', { state: { order: verificationRes.data.data } });
              } else {
                toast.error('Payment verification failed');
              }
            } catch (err: any) {
              toast.error(err.response?.data?.error || 'Verification error occurred');
            }
          },
          prefill: {
            name: user?.full_name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#2563EB',
          },
          modal: {
            ondismiss: () => {
              toast.error('Payment checkout cancelled');
            }
          }
        };

        const paymentWindow = new (window as any).Razorpay(options);
        paymentWindow.open();
      } else {
        // Direct Success for COD or Wallet Full Payment
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        navigate('/order-confirmation', { state: { order: orderData } });
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast.error(error.response?.data?.error || error.message || 'Order creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </button>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Delivery Address */}
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">1</span>
                  <h2 className="text-xl font-bold">Delivery Address</h2>
                </div>
                {!showAddAddress && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                )}
              </div>

              {showAddAddress ? (
                <form onSubmit={handleAddAddress} className="space-y-4 border border-border dark:border-border/10 rounded-xl p-5 bg-secondary/50 dark:bg-dark/10">
                  <h3 className="font-bold text-sm uppercase tracking-wide text-muted mb-2">New Address</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      placeholder="Receiver Name"
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone Number *"
                      placeholder="10-digit phone number"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    label="Address Line 1 *"
                    placeholder="Flat, House no., Building, Company, Apartment"
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                    required
                  />
                  
                  <Input
                    label="Address Line 2"
                    placeholder="Area, Street, Sector, Village"
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="City / District *"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                    />
                    <Input
                      label="State *"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      required
                    />
                    <Input
                      label="PIN Code *"
                      placeholder="6-digit zip code"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    label="Landmark"
                    placeholder="E.g. Near Apollo Hospital"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  />

                  <div className="flex items-center gap-4">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Address Type:</label>
                    <div className="flex gap-2">
                      {(['home', 'work', 'other'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAddressForm({ ...addressForm, type: t })}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border capitalize transition-all ${
                            addressForm.type === t
                              ? 'border-accent bg-accent/5 text-accent'
                              : 'border-border dark:border-border/10 hover:bg-secondary'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddAddress(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm">
                      Save Address
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.length === 0 ? (
                    <div className="md:col-span-2 text-center py-6 border-2 border-dashed border-border dark:border-border/10 rounded-xl">
                      <p className="text-sm text-muted mb-3">No saved addresses found</p>
                      <Button variant="outline" size="sm" onClick={() => setShowAddAddress(true)}>
                        Create New Address
                      </Button>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`border rounded-xl p-4 cursor-pointer relative transition-all flex flex-col justify-between ${
                          selectedAddressId === addr.id
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-border dark:border-border/10 hover:border-muted/40 hover:bg-slate-50/50 dark:hover:bg-dark-light'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-muted/10 text-muted">
                              {addr.type}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] font-bold text-accent uppercase tracking-wide">
                                Default
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-text dark:text-white">{addr.full_name}</h4>
                          <p className="text-xs text-muted mt-1 leading-relaxed">
                            {addr.line1}, {addr.line2 && `${addr.line2}, `}
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-xs text-muted mt-2 font-medium">Phone: {addr.phone}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Pay via Points / Wallet Balance */}
            {userWalletBalance > 0 && (
              <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text dark:text-white">Redeem BuyNest Wallet</h3>
                    <p className="text-xs text-muted">Available balance: ₹{userWalletBalance.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setUseWalletPoints(!useWalletPoints)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 outline-none ${
                    useWalletPoints ? 'bg-success' : 'bg-slate-200 dark:bg-dark-light'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ${
                      useWalletPoints ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Step 3: Payment Method Selection */}
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">2</span>
                <h2 className="text-xl font-bold">Select Payment Option</h2>
              </div>

              <div className="space-y-3">
                {/* Razorpay Gateway */}
                <label
                  className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-accent bg-accent/5'
                      : 'border-border dark:border-border/10 hover:bg-slate-50/50 dark:hover:bg-dark-light'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="font-bold text-sm text-text dark:text-white flex items-center gap-1.5">
                        Razorpay Secure Checkout <span className="text-[10px] font-bold text-accent uppercase bg-accent/10 px-2 py-0.5 rounded">UPI/Cards/Netbanking</span>
                      </span>
                      <p className="text-xs text-muted mt-0.5">Pay securely using UPI, Credit/Debit Cards, or Netbanking</p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-muted" />
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-accent bg-accent/5'
                      : 'border-border dark:border-border/10 hover:bg-slate-50/50 dark:hover:bg-dark-light'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="font-bold text-sm text-text dark:text-white">Cash on Delivery (COD)</span>
                      <p className="text-xs text-muted mt-0.5">Pay with cash or scan UPI code upon delivery</p>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-muted" />
                </label>
              </div>
            </div>

            {/* Step 4: Add delivery notes */}
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
              <h3 className="font-bold text-sm text-text dark:text-white flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-muted" /> Add delivery instructions (Optional)
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Please leave package at receptionist desk or call before delivering."
                rows={3}
                className="w-full border border-border dark:border-border/10 rounded-lg p-3 text-sm font-medium outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
          </div>

          {/* Checkout Right Side Sidebar Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
              <h3 className="font-bold text-lg mb-6">Review Items</h3>

              <div className="max-h-60 overflow-y-auto divide-y divide-border dark:divide-border/10 pr-2 mb-6">
                {items.filter(item => !item.saved_for_later).map((item) => {
                  const image = item.product?.images?.[0]?.url || 'https://via.placeholder.com/150';
                  return (
                    <div key={item.id} className="py-3.5 flex gap-4 first:pt-0 last:pb-0">
                      <img
                        src={image}
                        alt={item.product?.name}
                        className="w-12 h-12 object-cover rounded-lg border border-border dark:border-border/10 bg-secondary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate">{item.product?.name}</h4>
                        <p className="text-[10px] text-muted mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-extrabold text-xs text-right">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 text-sm font-medium border-t border-border dark:border-border/10 pt-4 pb-6">
                <div className="flex justify-between text-muted">
                  <span>Price Subtotal</span>
                  <span className="text-text dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Discount</span>
                  <span className="text-success font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
                {couponCode && (
                  <div className="flex justify-between text-muted">
                    <span>Coupon Discount</span>
                    <span className="text-success font-semibold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {useWalletPoints && (
                  <div className="flex justify-between text-muted">
                    <span>Wallet Point Deductions</span>
                    <span className="text-success font-semibold">-₹{walletUsedAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>Shipping Fee</span>
                  <span className="text-text dark:text-white">
                    {shipping === 0 ? <span className="text-success font-semibold">FREE</span> : `₹${shipping}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-border dark:border-border/10 pt-6 pb-6 flex justify-between items-baseline">
                <span className="font-bold text-base">To Pay Amount</span>
                <span className="font-extrabold text-2xl text-accent">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                variant="primary"
                className="w-full py-3 flex items-center justify-center font-bold text-base gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Securing Order...
                  </>
                ) : (
                  <>
                    Place Order & Pay
                  </>
                )}
              </Button>
            </div>

            {/* Safety guarantee */}
            <div className="bg-success/5 border border-success/20 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div className="text-xs text-success-dark dark:text-success leading-relaxed font-medium">
                <strong>Paynest Secure Seal.</strong> Your transaction is encrypted with bank-level SSL, matching payment card security (PCI-DSS) protocols.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
