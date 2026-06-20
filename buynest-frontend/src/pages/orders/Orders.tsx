import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import api from '../../services/api';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const STATUS_MAP: Record<string, { label: string; variant: any; icon: React.FC<any> }> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'info', icon: CheckCircle },
  packed: { label: 'Packed', variant: 'info', icon: Package },
  shipped: { label: 'Shipped', variant: 'info', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', variant: 'primary', icon: Truck },
  delivered: { label: 'Delivered', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'danger', icon: XCircle },
  returned: { label: 'Returned', variant: 'muted', icon: Package },
  refunded: { label: 'Refunded', variant: 'muted', icon: Package },
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-extrabold text-text dark:text-white mb-6">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 space-y-3 border border-border dark:border-white/10">
                <Skeleton className="h-5 w-40" />
                <Skeleton lines={2} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-16 h-16 text-muted opacity-20 mx-auto mb-4" />
            <p className="text-xl font-bold text-text dark:text-white">No orders yet</p>
            <p className="text-muted mb-4">Start shopping to place your first order!</p>
            <Link to="/search" className="inline-block px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={`/orders/${order.id}`}
                    className="block bg-white dark:bg-gray-900 rounded-2xl border border-border dark:border-white/10 hover:border-accent/30 hover:shadow-sm transition-all p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-text dark:text-white">{order.order_number}</span>
                          <Badge variant={statusInfo.variant} size="sm">
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted">
                          {order.order_items?.length} item{order.order_items?.length !== 1 ? 's' : ''} · 
                          Ordered {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {order.order_items?.slice(0, 2).map((item: any) => (
                          <p key={item.id} className="text-sm text-text dark:text-white font-medium truncate">{item.name}</p>
                        ))}
                        {order.order_items?.length > 2 && (
                          <p className="text-xs text-muted">+{order.order_items.length - 2} more items</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-text dark:text-white text-lg">
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </p>
                        <ChevronRight className="w-5 h-5 text-muted ml-auto mt-2" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
