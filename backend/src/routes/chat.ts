import { Router } from 'express';
import chatController from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /chat:
 *   get:
 *     summary: Get user chats
 *     description: Get all chats for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', chatController.getUserChats);

/**
 * @swagger
 * /chat/search:
 *   get:
 *     summary: Search chats
 *     description: Search chats and messages by query
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Unauthorized
 */
router.get('/search', chatController.searchChats);

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Create new chat
 *     description: Create a new chat with specified participants
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - participantIds
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [direct, group, team]
 *                 example: direct
 *               name:
 *                 type: string
 *                 example: Project Discussion
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user1", "user2"]
 *     responses:
 *       201:
 *         description: Chat created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/', chatController.createChat);

/**
 * @swagger
 * /chat/{chatId}:
 *   get:
 *     summary: Get chat by ID
 *     description: Get a specific chat by its ID
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:chatId', chatController.getChatById);

/**
 * @swagger
 * /chat/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     description: Get messages for a specific chat with pagination
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       400:
 *         description: Invalid chat ID
 *       401:
 *         description: Unauthorized
 */
router.get('/:chatId/messages', chatController.getChatMessages);

/**
 * @swagger
 * /chat/{chatId}/messages:
 *   post:
 *     summary: Send message
 *     description: Send a message to a specific chat
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello, how are you?
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file, location]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid message data
 *       401:
 *         description: Unauthorized
 */
router.post('/:chatId/messages', chatController.sendMessage);

/**
 * @swagger
 * /chat/{chatId}/read:
 *   post:
 *     summary: Mark messages as read
 *     description: Mark specific messages as read in a chat
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageIds
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["msg1", "msg2", "msg3"]
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *       400:
 *         description: Invalid message IDs
 *       401:
 *         description: Unauthorized
 */
router.post('/:chatId/read', chatController.markMessagesAsRead);

export default router;
