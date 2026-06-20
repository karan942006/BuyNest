import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone, Shirt, Home as HomeIcon, Dumbbell, Book, ShoppingBag, Gamepad2,
  Baby, ArrowRight, Zap, Timer, TrendingUp, Package, Shield, RefreshCw
} from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { useProducts } from '../hooks/useProducts';

const HERO_SLIDES = [
  {
    id: 1,
    title: "Premium Electronics",
    subtitle: "Up to 40% off on laptops, phones & accessories",
    badge: "Flash Sale",
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
    cta: "Shop Electronics",
    link: "/search?category=Electronics",
    emoji: "💻"
  },
  {
    id: 2,
    title: "Fashion Week Deals",
    subtitle: "Explore the latest trends, curated for you",
    badge: "New Season",
    gradient: "from-purple-600 via-pink-500 to-rose-400",
    cta: "Explore Fashion",
    link: "/search?category=Fashion",
    emoji: "👗"
  },
  {
    id: 3,
    title: "Home & Kitchen",
    subtitle: "Transform your home with premium products",
    badge: "Best Sellers",
    gradient: "from-amber-500 via-orange-500 to-red-400",
    cta: "Shop Home",
    link: "/search?category=Home",
    emoji: "🏠"
  },
];

const CATEGORIES = [
  { name: 'Electronics', icon: Smartphone, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20', link: '/search?category=Electronics' },
  { name: 'Fashion', icon: Shirt, color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20', link: '/search?category=Fashion' },
  { name: 'Home & Kitchen', icon: HomeIcon, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20', link: '/search?category=Home' },
  { name: 'Sports', icon: Dumbbell, color: 'bg-green-50 text-green-600 dark:bg-green-900/20', link: '/search?category=Sports' },
  { name: 'Books', icon: Book, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20', link: '/search?category=Books' },
  { name: 'Grocery', icon: ShoppingBag, color: 'bg-lime-50 text-lime-600 dark:bg-lime-900/20', link: '/search?category=Grocery' },
  { name: 'Gaming', icon: Gamepad2, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20', link: '/search?category=Gaming' },
  { name: 'Baby & Kids', icon: Baby, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20', link: '/search?category=Kids' },
];

const FEATURES = [
  { icon: Package, title: 'Free Delivery', desc: 'On orders above ₹499', color: 'text-accent' },
  { icon: Shield, title: 'Secure Payments', desc: 'Razorpay encrypted checkout', color: 'text-success' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns', color: 'text-warning' },
  { icon: TrendingUp, title: 'Best Prices', desc: 'Lowest prices guaranteed', color: 'text-info' },
];

const HeroSlide: React.FC<{ slide: typeof HERO_SLIDES[0]; isActive: boolean }> = ({ slide, isActive }) => (
  <motion.div
    initial={{ opacity: 0, scale: 1.02 }}
    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1.02 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center`}
    style={{ pointerEvents: isActive ? 'auto' : 'none' }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
      <div className="max-w-lg space-y-4">
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest"
        >
          {slide.badge}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-extrabold text-white leading-tight"
        >
          {slide.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 text-lg"
        >
          {slide.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to={slide.link}
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition-all hover:gap-3"
          >
            {slide.cta} <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
      <div className="hidden md:block text-9xl select-none">
        {slide.emoji}
      </div>
    </div>
  </motion.div>
);

const FlashSaleTimer: React.FC<{ endsAt: Date }> = ({ endsAt }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, endsAt.getTime() - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-4 h-4 text-danger animate-pulse" />
      <span className="text-danger text-sm font-bold">Ends in</span>
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
        <React.Fragment key={i}>
          <span className="font-mono font-bold bg-danger text-white px-2 py-0.5 rounded text-sm min-w-[2rem] text-center">
            {pad(val)}
          </span>
          {i < 2 && <span className="text-danger font-bold text-sm">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

const Home: React.FC = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const { products, loading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts({ sort: 'popular', limit: 8 });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHeroIndex(i => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const flashSaleEnd = new Date(Date.now() + 4 * 3600000 + 23 * 60000);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-950">
      {/* Hero */}
      <section className="relative h-[420px] md:h-[500px] overflow-hidden">
        {HERO_SLIDES.map((slide, i) => (
          <HeroSlide key={slide.id} slide={slide} isActive={i === heroIndex} />
        ))}

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-white dark:bg-gray-900 border-b border-border dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-secondary dark:bg-gray-800 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text dark:text-white">{title}</p>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Categories */}
        <motion.section variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-text dark:text-white">Shop by Category</h2>
            <Link to="/search" className="text-accent text-sm font-semibold hover:underline flex items-center gap-1">
              All Categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORIES.map(({ name, icon: Icon, color, link }) => (
              <motion.div key={name} variants={itemVariants}>
                <Link
                  to={link}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-gray-900 border border-border dark:border-white/5 hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-text dark:text-white text-center leading-tight">{name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Flash Sale */}
        <section>
          <div className="bg-gradient-to-r from-danger to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">Flash Sale</h2>
                  <p className="text-white/80 text-sm">Prices drop for a limited time only!</p>
                </div>
              </div>
              <FlashSaleTimer endsAt={flashSaleEnd} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white/10 rounded-xl h-40 shimmer" />
                  ))
                : products.slice(0, 4).map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="bg-white rounded-xl p-3 text-text hover:shadow-lg transition-shadow group"
                    >
                      <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-2">
                        {product.images?.[0]?.url && (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                      </div>
                      <p className="text-xs font-semibold line-clamp-2">{product.name}</p>
                      <p className="font-mono font-bold text-accent text-sm mt-1">₹{product.price?.toLocaleString('en-IN')}</p>
                    </Link>
                  ))}
            </div>
          </div>
        </section>

        {/* Trending Products */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-extrabold text-text dark:text-white">Trending Now</h2>
            </div>
            <Link to="/search?sort=popular" className="text-accent text-sm font-semibold hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <motion.div
            className="product-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <ProductCardSkeleton />
                  </motion.div>
                ))
              : products.map((product) => (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
          </motion.div>
        </section>

        {/* App Download Banner */}
        <section className="bg-gradient-to-br from-accent to-accent-dark rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-white space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Mobile App</span>
            <h2 className="text-3xl font-extrabold">Shop Smarter on Mobile</h2>
            <p className="text-white/80">Get exclusive app-only deals, faster checkout and real-time order tracking.</p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
                <span className="text-2xl">🍎</span>
                <div>
                  <p className="text-xs text-white/70">Download on the</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-900 transition-colors">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-xs text-white/70">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </a>
            </div>
          </div>
          <div className="text-8xl shrink-0 select-none hidden md:block">📱</div>
        </section>
      </div>
    </div>
  );
};

export default Home;
