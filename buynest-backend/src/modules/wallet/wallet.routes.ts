import { Router } from 'express';
import { getTransactions, topupWallet } from './wallet.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/transactions', getTransactions);
router.post('/topup', topupWallet);

export default router;
