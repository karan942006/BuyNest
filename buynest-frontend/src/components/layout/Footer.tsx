import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Subscribed! Get 10% off your first order.');
      setEmail('');
    }
  };

  const links = {
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Blog', path: '/blog' },
    ],
    help: [
      { label: 'Help Center', path: '/help' },
      { label: 'Contact Support', path: '/support' },
      { label: 'Returns', path: '/returns' },
      { label: 'Track Order', path: '/orders' },
    ],
    sellers: [
      { label: 'Sell on BuyNest', path: '/seller' },
      { label: 'Seller Portal', path: '/seller/dashboard' },
      { label: 'Seller Help', path: '/seller/help' },
      { label: 'Advertise', path: '/advertise' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Refund Policy', path: '/refund' },
    ],
  };

  return (
    <footer className="bg-dark text-white mt-16">
      {/* Newsletter */}
      <div className="bg-accent py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">Get Exclusive Deals</h3>
            <p className="text-accent-light text-sm mt-1">Subscribe and save 10% on your first order</p>
          </div>
          <form onSubmit={handleNewsletter} className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="flex-1 md:w-72 px-4 py-2.5 rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-white text-accent font-bold rounded-lg hover:bg-accent-light transition-colors text-sm"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <span className="font-extrabold text-xl text-white">Buy<span className="text-accent">Nest</span></span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your Home for Everything. India's premium e-commerce destination for the best products at the best prices.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>1800-XXX-XXXX (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>support@buynest.com</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-bold text-white mb-4 capitalize">{section}</h4>
              <ul className="space-y-2">
                {items.map(({ label, path }) => (
                  <li key={path}>
                    <Link
                      to={path}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BuyNest. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { icon: Facebook, label: 'Facebook', href: '#' },
              { icon: Twitter, label: 'Twitter', href: '#' },
              { icon: Instagram, label: 'Instagram', href: '#' },
              { icon: Youtube, label: 'YouTube', href: '#' },
            ].map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Payments by</span>
            <span className="font-bold text-white">Razorpay</span>
            <span>·</span>
            <span>Powered by</span>
            <span className="font-bold text-white">Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
