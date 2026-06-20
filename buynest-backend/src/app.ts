import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error.middleware';

// Router imports
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import cartRoutes from './modules/cart/cart.routes';
import ordersRoutes from './modules/orders/orders.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import supportRoutes from './modules/support/support.routes';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for API, can restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Morgan http logger
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/support', supportRoutes);

// Simple seller/admin analytics helper router
app.get('/api/analytics', async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      sales: [
        { month: 'Jan', revenue: 45000, orders: 120 },
        { month: 'Feb', revenue: 52000, orders: 140 },
        { month: 'Mar', revenue: 61000, orders: 165 },
        { month: 'Apr', revenue: 58000, orders: 155 },
        { month: 'May', revenue: 71000, orders: 190 },
        { month: 'Jun', revenue: 85000, orders: 230 }
      ],
      revenue: 372000,
      total_orders: 1000,
      active_products: 450,
      customers: 820
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  logger.info(`BuyNest Backend Server running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
});

export default app;
