import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search, ShoppingCart, Heart, Bell, Sun, Moon, User, LogOut,
  Menu, X, ChevronDown, MapPin, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RootState } from '../../store';
import { toggleDarkMode, setCartOpen, setSearchQuery } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Kitchen', 'Beauty', 'Sports', 'Books', 'Grocery', 'Toys'];

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode, cartOpen } = useSelector((state: RootState) => state.ui);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const cartCount = items.filter(i => !i.saved_for_later).reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      dispatch(setSearchQuery(localSearch));
      navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass shadow-glass border-b border-white/30 dark:border-white/10'
            : 'bg-white dark:bg-dark border-b border-border dark:border-white/5'
        }`}
      >
        {/* Top strip */}
        <div className="bg-accent text-white text-xs py-1 px-4 text-center">
          🎉 Free delivery on orders above ₹499 · Use code <span className="font-bold">BUYNEST10</span> for 10% off
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <span className="font-extrabold text-xl text-text dark:text-white tracking-tight hidden sm:block">
                Buy<span className="text-accent">Nest</span>
              </span>
            </Link>

            {/* Location (desktop) */}
            <button className="hidden lg:flex items-center gap-1 text-sm text-muted hover:text-text dark:hover:text-white transition-colors shrink-0">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="max-w-24 truncate">Deliver to India</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  placeholder="Search products, brands, and categories..."
                  className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-border dark:border-white/10 bg-secondary dark:bg-white/5 text-text dark:text-white placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent rounded-lg flex items-center justify-center hover:bg-accent-dark transition-colors"
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Dark mode */}
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors"
                title="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-muted" />}
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors"
              >
                <Heart className="w-5 h-5 text-muted hover:text-danger transition-colors" />
              </Link>

              {/* Cart */}
              <button
                onClick={() => dispatch(setCartOpen(!cartOpen))}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-muted hover:text-accent transition-colors" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5 transition-colors">
                  <Bell className="w-5 h-5 text-muted hover:text-accent transition-colors" />
                </button>
              )}

              {/* User menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-secondary dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-text dark:text-white hidden md:block max-w-20 truncate">
                      {user?.full_name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted hidden md:block" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-glass border border-white/30 dark:border-white/10 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-border dark:border-white/10">
                          <p className="font-semibold text-text dark:text-white text-sm">{user?.full_name}</p>
                          <p className="text-xs text-muted truncate">{user?.email}</p>
                        </div>
                        {[
                          { label: 'My Profile', icon: User, path: '/profile' },
                          { label: 'My Orders', icon: Package, path: '/orders' },
                          ...(user?.role === 'seller' ? [{ label: 'Seller Dashboard', icon: Package, path: '/seller' }] : []),
                          ...(user?.role === 'admin' || user?.role === 'super_admin' ? [{ label: 'Admin Panel', icon: Package, path: '/admin' }] : []),
                        ].map(({ label, icon: Icon, path }) => (
                          <Link
                            key={path}
                            to={path}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text dark:text-white hover:bg-accent/5 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-muted" />
                            {label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors w-full border-t border-border dark:border-white/10"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-dark transition-colors"
                >
                  Login
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary dark:hover:bg-white/5"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5 text-muted" /> : <Menu className="w-5 h-5 text-muted" />}
              </button>
            </div>
          </div>

          {/* Category Nav (desktop) */}
          <div className="hidden md:flex items-center gap-6 h-10 text-sm overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/search?category=${encodeURIComponent(cat)}`}
                className="whitespace-nowrap text-muted hover:text-accent dark:hover:text-accent font-medium transition-colors pb-1 border-b-2 border-transparent hover:border-accent"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border dark:border-white/10 bg-white dark:bg-dark"
            >
              <div className="px-4 py-3 space-y-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat}
                    to={`/search?category=${encodeURIComponent(cat)}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-muted hover:text-accent font-medium"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[104px]" />
    </>
  );
};

export default Navbar;
