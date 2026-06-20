import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Redux Store
import store from './store';
import type { RootState } from './store';
import { setCredentials, logout } from './store/slices/authSlice';
import { setCart } from './store/slices/cartSlice';

// API & Supabase Services
import supabase from './services/supabase';
import api from './services/api';

// Layout Components (always-needed, not lazy)
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';

// Lazy-loaded page components for code-splitting
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ProductDetail = lazy(() => import('./pages/product/ProductDetail'));
const ProductList = lazy(() => import('./pages/product/ProductList'));
const Cart = lazy(() => import('./pages/cart/Cart'));
const Checkout = lazy(() => import('./pages/checkout/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/orders/OrderConfirmation'));
const Orders = lazy(() => import('./pages/orders/Orders'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Wallet = lazy(() => import('./pages/wallet/Wallet'));
const Support = lazy(() => import('./pages/support/Support'));
const SellerDashboard = lazy(() => import('./pages/dashboard/SellerDashboard'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));
const Wishlist = lazy(() => import('./pages/wishlist/Wishlist'));

// Global page-transition loading spinner
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-secondary dark:bg-dark">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-muted">Loading...</p>
    </div>
  </div>
);

// Route Guards
interface GuardProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<GuardProps> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const SellerRoute: React.FC<GuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isSeller = user?.role === 'seller' || user?.role === 'admin' || user?.role === 'super_admin';
  return isAuthenticated && isSeller ? children : <Navigate to="/" replace />;
};

const AdminRoute: React.FC<GuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  return isAuthenticated && isAdmin ? children : <Navigate to="/" replace />;
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Sync session state from Supabase Auth
  useEffect(() => {
    // 1. Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Sync JWT token with local storage for custom API routes
        localStorage.setItem('buynest_token', session.access_token);
        
        // Fetch full profile from DB
        api.get('/auth/me')
          .then((res) => {
            if (res.data.success) {
              dispatch(setCredentials({ token: session.access_token, user: res.data.data }));
            }
          })
          .catch(() => {
            // Token expired or invalid
            dispatch(logout());
          });
      }
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('buynest_token', session.access_token);
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            dispatch(setCredentials({ token: session.access_token, user: res.data.data }));
          }
        } catch (err) {
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Sync Cart items on login
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/cart')
        .then((res) => {
          if (res.data.success) {
            dispatch(setCart(res.data.data));
          }
        })
        .catch((err) => console.error('Failed to sync cart:', err));
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-secondary dark:bg-dark transition-colors duration-200">
        <Navbar />
        
        <main className="flex-grow">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<ProductList />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              
              {/* Protected Client-Workspace Routes */}
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />

              {/* Seller and Admin Dashboard Protected Routes */}
              <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* Catch-all fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        
        <Footer />
        <CartDrawer />
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
