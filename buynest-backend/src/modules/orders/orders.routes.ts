import { Router } from 'express';
import { createOrder, getOrders, getOrderById } from './orders.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

export default router;
