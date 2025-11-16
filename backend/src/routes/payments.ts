import { Router } from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /payments/intent:
 *   post:
 *     summary: Create payment intent
 *     description: Create a payment intent for one-time payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100.00
 *               currency:
 *                 type: string
 *                 default: usd
 *                 example: usd
 *               description:
 *                 type: string
 *                 example: Security services payment
 *               metadata:
 *                 type: object
 *                 example: { "invoice_id": "inv_123" }
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/intent', authorize('CLIENT'), paymentController.createPaymentIntent);

/**
 * @swagger
 * /payments/invoice:
 *   post:
 *     summary: Create invoice
 *     description: Create an invoice for client services
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                       example: Guard Services
 *                     quantity:
 *                       type: number
 *                       example: 40
 *                     unitPrice:
 *                       type: number
 *                       example: 25.00
 *                     serviceType:
 *                       type: string
 *                       enum: [guard_service, overtime, emergency_response, equipment, other]
 *               description:
 *                 type: string
 *                 example: Monthly security services
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               currency:
 *                 type: string
 *                 default: usd
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/invoice', authorize('ADMIN'), paymentController.createInvoice);

/**
 * @swagger
 * /payments/invoice/monthly:
 *   post:
 *     summary: Generate monthly invoice
 *     description: Generate monthly invoice based on completed shifts
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *             properties:
 *               year:
 *                 type: number
 *                 example: 2024
 *               month:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 11
 *     responses:
 *       201:
 *         description: Monthly invoice generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/invoice/monthly', authorize('ADMIN'), paymentController.generateMonthlyInvoice);

/**
 * @swagger
 * /payments/methods:
 *   get:
 *     summary: Get payment methods
 *     description: Get client's saved payment methods
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/methods', authorize('CLIENT'), paymentController.getPaymentMethods);

/**
 * @swagger
 * /payments/setup-intent:
 *   post:
 *     summary: Create setup intent
 *     description: Create setup intent for adding new payment method
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Setup intent created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/setup-intent', authorize('CLIENT'), paymentController.createSetupIntent);

/**
 * @swagger
 * /payments/auto-pay:
 *   post:
 *     summary: Setup automatic payments
 *     description: Setup automatic payments for client invoices
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 example: pm_1234567890
 *     responses:
 *       200:
 *         description: Automatic payments setup successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/auto-pay', authorize('CLIENT'), paymentController.setupAutomaticPayments);

/**
 * @swagger
 * /payments/invoices:
 *   get:
 *     summary: Get invoices
 *     description: Get client invoices with pagination and filtering
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, paid, void, uncollectible]
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/invoices', authorize('CLIENT', 'ADMIN'), paymentController.getInvoices);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook
 *     description: Handle Stripe webhook events
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook
 */
router.post('/webhook', paymentController.handleWebhook);

export default router;
