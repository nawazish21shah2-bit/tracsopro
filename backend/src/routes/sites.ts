import { Router } from 'express';
import siteController from '../controllers/siteController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Site management routes (Client only)
router.post('/', authorize('CLIENT'), siteController.createSite);
router.get('/my-sites', authorize('CLIENT'), siteController.getClientSites);
router.get('/active', siteController.getActiveSites); // Available to all authenticated users
router.get('/:id', siteController.getSiteById);
router.put('/:id', authorize('CLIENT'), siteController.updateSite);
router.delete('/:id', authorize('CLIENT'), siteController.deleteSite);

export default router;
