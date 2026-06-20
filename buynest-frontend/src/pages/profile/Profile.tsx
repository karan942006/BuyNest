import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Package, Heart, Wallet, Settings, Star } from 'lucide-react';
import type { RootState } from '../../store';

const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const QUICK_LINKS = [
    { icon: Package, label: 'My Orders', sub: 'Track & manage orders', path: '/orders', color: 'text-accent bg-accent/10' },
    { icon: Heart, label: 'Wishlist', sub: 'Items you love', path: '/wishlist', color: 'text-danger bg-danger/10' },
    { icon: Wallet, label: 'Wallet', sub: `₹${user?.wallet_balance?.toLocaleString('en-IN') || '0.00'}`, path: '/wallet', color: 'text-success bg-success/10' },
    { icon: MapPin, label: 'Addresses', sub: 'Manage delivery addresses', path: '/addresses', color: 'text-warning bg-warning/10' },
    { icon: Star, label: 'Reviews', sub: 'Your product reviews', path: '/reviews', color: 'text-gold bg-gold/10' },
    { icon: Settings, label: 'Settings', sub: 'Account settings', path: '/settings', color: 'text-muted bg-muted/10' },
  ];

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-border dark:border-white/10 overflow-hidden"
        >
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-accent to-accent-dark" />
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 flex items-end justify-between">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-900 bg-accent/10 flex items-center justify-center text-accent text-3xl font-extrabold shadow-lg">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <Link
                to="/settings"
                className="mb-2 px-4 py-2 text-sm font-semibold rounded-xl border border-border dark:border-white/10 text-text dark:text-white hover:bg-secondary dark:hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> Edit Profile
              </Link>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-extrabold text-text dark:text-white">{user?.full_name || 'User'}</h1>
              <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user?.email}</span>
                <span className="flex items-center gap-1.5 capitalize">
                  <User className="w-4 h-4" />
                  <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs font-semibold">{user?.role}</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-accent to-accent-dark rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Wallet Balance</p>
              <p className="font-mono font-extrabold text-3xl mt-1">
                ₹{user?.wallet_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              to="/wallet"
              className="flex-1 text-center text-sm font-semibold py-2 bg-white text-accent rounded-xl hover:bg-accent-light transition-colors"
            >
              Add Money
            </Link>
            <Link
              to="/wallet/transactions"
              className="flex-1 text-center text-sm font-semibold py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors"
            >
              History
            </Link>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {QUICK_LINKS.map(({ icon: Icon, label, sub, path, color }) => (
            <Link
              key={path}
              to={path}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-border dark:border-white/10 p-4 hover:border-accent/30 hover:shadow-sm transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm text-text dark:text-white">{label}</p>
              <p className="text-xs text-muted mt-0.5">{sub}</p>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
