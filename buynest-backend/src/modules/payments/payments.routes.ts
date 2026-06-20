import express, { Router } from 'express';
import { verifyPayment, handleWebhook } from './payments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Webhook endpoint needs raw body verification sometimes, but standard JSON parser works too
router.post('/webhook', express.json(), handleWebhook);

// Protected routes
router.post('/verify', authenticate, verifyPayment);

export default router;
