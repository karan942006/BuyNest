import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowRight, MapPin, Truck, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  // Fallback if accessed directly without state
  if (!order) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl max-w-md shadow-premium">
          <ShoppingBag className="w-12 h-12 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Order Found</h2>
          <p className="text-sm text-muted mb-6">You seem to have navigated here directly without placing an order.</p>
          <Link to="/">
            <Button variant="primary">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  // Format delivery date (usually 3-5 days in future)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Top Celebration Card */}
        <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-3xl p-8 text-center shadow-premium mb-8">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Order Confirmed!</h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Thank you for shopping at BuyNest. Your order has been placed successfully and is currently being processed.
          </p>

          <div className="mt-8 pt-8 border-t border-border dark:border-border/10 grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Order Number</p>
              <p className="text-base font-extrabold text-accent mt-1">{order.order_number}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Payment Status</p>
              <span className={`inline-flex items-center gap-1 text-xs font-extrabold uppercase mt-1 px-2.5 py-0.5 rounded-full ${
                order.payment_status === 'paid'
                  ? 'bg-success/10 text-success'
                  : 'bg-warning/10 text-warning'
              }`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Shipping Info Card */}
        <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-3xl p-8 shadow-premium mb-8 space-y-6">
          <h2 className="text-xl font-bold border-b border-border dark:border-border/10 pb-4">Shipping & Delivery</h2>
          
          <div className="flex items-start gap-4">
            <Calendar className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Estimated Delivery</p>
              <p className="text-sm font-semibold mt-1">{formattedDeliveryDate}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Delivery Address</p>
              <p className="text-sm font-semibold mt-1">{shippingAddress?.full_name}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {shippingAddress?.line1}, {shippingAddress?.line2 && `${shippingAddress.line2}, `}
                {shippingAddress?.city}, {shippingAddress?.state} - {shippingAddress?.pincode}
              </p>
              <p className="text-xs text-muted mt-1 font-medium">Contact: {shippingAddress?.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Truck className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Courier Service</p>
              <p className="text-sm font-semibold mt-1">BuyNest Express Delivery</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/orders" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full py-3 font-bold">
              View Order History
            </Button>
          </Link>
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full py-3 font-bold flex items-center justify-center gap-2 group">
              Continue Shopping <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;
