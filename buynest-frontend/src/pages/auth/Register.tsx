import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterData = z.infer<typeof registerSchema>;

const BENEFITS = [
  'Free delivery on orders above ₹499',
  'Early access to flash sales',
  'Earn loyalty points on every purchase',
  'Exclusive member-only deals',
];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    const result = await registerUser({ email: data.email, password: data.password, full_name: data.full_name });
    if (result.success) navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light via-white to-secondary dark:from-gray-950 dark:via-dark dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Benefits Panel */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:block space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
              </div>
              <span className="font-extrabold text-2xl text-text dark:text-white">Buy<span className="text-accent">Nest</span></span>
            </div>
            <h2 className="text-3xl font-extrabold text-text dark:text-white leading-tight">
              Join Millions of Happy Shoppers
            </h2>
            <p className="text-muted mt-2">Create your free account and unlock exclusive benefits</p>
          </div>
          <ul className="space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <span className="text-text dark:text-white font-medium">{benefit}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Register Form */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border dark:border-white/10 p-8 space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-text dark:text-white">Create Account</h1>
              <p className="text-muted text-sm mt-1">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-text dark:text-white mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    {...register('full_name')}
                    type="text"
                    placeholder="John Doe"
                    id="fullname-input"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-secondary dark:bg-white/5 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all ${errors.full_name ? 'border-danger' : 'border-border dark:border-white/10 focus:border-accent'}`}
                  />
                </div>
                {errors.full_name && <p className="text-danger text-xs mt-1">{errors.full_name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-text dark:text-white mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    id="email-input"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-secondary dark:bg-white/5 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all ${errors.email ? 'border-danger' : 'border-border dark:border-white/10 focus:border-accent'}`}
                  />
                </div>
                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-text dark:text-white mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    id="password-input"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm bg-secondary dark:bg-white/5 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all ${errors.password ? 'border-danger' : 'border-border dark:border-white/10 focus:border-accent'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-text dark:text-white mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    {...register('confirm_password')}
                    type="password"
                    placeholder="Confirm your password"
                    id="confirm-password-input"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-secondary dark:bg-white/5 text-text dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all ${errors.confirm_password ? 'border-danger' : 'border-border dark:border-white/10 focus:border-accent'}`}
                  />
                </div>
                {errors.confirm_password && <p className="text-danger text-xs mt-1">{errors.confirm_password.message}</p>}
              </div>

              <p className="text-xs text-muted">
                By registering, you agree to BuyNest's{' '}
                <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
              </p>

              <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
                Create Account <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
