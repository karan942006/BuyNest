import Razorpay from 'razorpay';
import { env } from './env';
import logger from './logger';

let razorpay: Razorpay | null = null;

try {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    const RazorpayConstructor = (Razorpay as any).default || Razorpay;
    razorpay = new RazorpayConstructor({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay initialized successfully.');
  } else {
    logger.warn('Razorpay credentials missing. Payment endpoints will operate in sandbox mode.');
  }
} catch (error) {
  logger.error('Failed to initialize Razorpay client:', error);
}

export { razorpay };
export default razorpay;
