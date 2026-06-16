import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import supportController from '../controllers/supportController.js';

const router = Router();

router.use(authenticate);

router.post('/tickets', supportController.createTicket);
router.get('/tickets/mine', supportController.getMyTickets);
router.get('/tickets/inbox', supportController.getInbox);
router.get('/tickets/:id', supportController.getTicketById);
router.post('/tickets/:id/replies', supportController.replyToTicket);
router.patch('/tickets/:id', supportController.updateTicketStatus);
router.post('/tickets/:id/chat', supportController.openTicketChat);

export default router;
