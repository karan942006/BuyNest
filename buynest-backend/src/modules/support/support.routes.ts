import { Router } from 'express';
import { getTickets, createTicket, getTicketMessages, sendTicketMessage } from './support.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id/messages', getTicketMessages);
router.post('/tickets/:id/messages', sendTicketMessage);

export default router;
