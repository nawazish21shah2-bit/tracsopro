import express from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const settingsController = new SettingsController();

// All settings routes require authentication
router.use(authenticate);

// Notification settings
router.get('/notifications', settingsController.getNotificationSettings.bind(settingsController));
router.put('/notifications', settingsController.updateNotificationSettings.bind(settingsController));

// Profile settings
router.get('/profile', settingsController.getProfileSettings.bind(settingsController));
router.put('/profile', settingsController.updateProfileSettings.bind(settingsController));

// Support
router.post('/support/contact', settingsController.submitSupportRequest.bind(settingsController));

// Guard-specific settings
router.get('/attendance-history', settingsController.getAttendanceHistory.bind(settingsController));
router.get('/past-jobs', settingsController.getPastJobs.bind(settingsController));

export default router;
