import { Router } from 'express';
import adminSiteController from '../controllers/adminSiteController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// List sites with optional filters
router.get('/', adminSiteController.getSites.bind(adminSiteController));

// Create a site as admin (requires clientId in body)
router.post('/', adminSiteController.createSite.bind(adminSiteController));

// Update site
router.put('/:id', adminSiteController.updateSite.bind(adminSiteController));

// Delete site
router.delete('/:id', adminSiteController.deleteSite.bind(adminSiteController));

export default router;
