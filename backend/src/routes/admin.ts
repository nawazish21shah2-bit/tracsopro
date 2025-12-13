/**
 * Admin Routes - Routes for admin (security company) operations
 * Streamlined for admin-to-super-admin payment flow
 */

import express from 'express';
import { authenticateToken, authorize, requireAdmin, AuthRequest } from '../middleware/auth';
import adminService from '../services/adminService';
import adminPaymentController from '../controllers/adminPaymentController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/admin/subscription
 * Get admin's complete subscription information (company + subscription + plans)
 * Consolidated endpoint - replaces separate /company and /subscription endpoints
 * Access: ADMIN (own company) or SUPER_ADMIN (all companies)
 */
router.get('/subscription', requireAdmin, adminPaymentController.getAdminSubscriptionInfo);

/**
 * GET /api/admin/dashboard/stats
 * Get admin dashboard statistics
 * Access: ADMIN (own company) or SUPER_ADMIN (all companies)
 */
router.get('/dashboard/stats', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const stats = await adminService.getDashboardStats(adminId, req.securityCompanyId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
    });
  }
});

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity for admin dashboard
 * Access: ADMIN (own company) or SUPER_ADMIN (all companies)
 */
router.get('/dashboard/activity', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await adminService.getRecentActivity(limit, req.securityCompanyId);
    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
    });
  }
});

/**
 * GET /api/admin/company
 * Legacy endpoint - uses same controller for backward compatibility
 * @deprecated Use /api/admin/subscription instead (includes company info)
 * Access: ADMIN (own company) or SUPER_ADMIN (all companies)
 */
router.get('/company', requireAdmin, adminPaymentController.getAdminSubscriptionInfo);

export default router;

