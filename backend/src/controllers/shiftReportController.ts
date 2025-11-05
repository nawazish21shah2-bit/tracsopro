import { Request, Response } from 'express';
import shiftReportService from '../services/shiftReportService';
import { ReportTypeEnum } from '@prisma/client';

/**
 * @swagger
 * /api/shift-reports:
 *   post:
 *     summary: Create a shift report
 *     tags: [Shift Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *               - content
 *             properties:
 *               shiftId:
 *                 type: string
 *               reportType:
 *                 type: string
 *                 enum: [SHIFT, INCIDENT, EMERGENCY]
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export const createShiftReport = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { shiftId, reportType, content } = req.body;

    if (!shiftId || !content) {
      return res.status(400).json({ error: 'Shift ID and content are required' });
    }

    const report = await shiftReportService.createShiftReport({
      shiftId,
      guardId,
      reportType: reportType || ReportTypeEnum.SHIFT,
      content,
    });

    res.status(201).json({
      message: 'Report created successfully',
      report,
    });
  } catch (error: any) {
    console.error('Error creating shift report:', error);
    res.status(400).json({ error: error.message || 'Failed to create shift report' });
  }
};

/**
 * @swagger
 * /api/shift-reports:
 *   get:
 *     summary: Get all reports for the current guard
 *     tags: [Shift Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of reports to return
 *     responses:
 *       200:
 *         description: List of reports
 *       401:
 *         description: Unauthorized
 */
export const getGuardReports = async (req: Request, res: Response) => {
  try {
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const reports = await shiftReportService.getGuardReports(guardId, limit);

    res.json(reports);
  } catch (error: any) {
    console.error('Error getting guard reports:', error);
    res.status(500).json({ error: error.message || 'Failed to get guard reports' });
  }
};

/**
 * @swagger
 * /api/shift-reports/:id:
 *   get:
 *     summary: Get report by ID
 *     tags: [Shift Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 */
export const getShiftReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const report = await shiftReportService.getShiftReportById(id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Verify report belongs to guard
    if (report.guardId !== guardId) {
      return res.status(403).json({ error: 'Forbidden: This report does not belong to you' });
    }

    res.json(report);
  } catch (error: any) {
    console.error('Error getting shift report:', error);
    res.status(500).json({ error: error.message || 'Failed to get shift report' });
  }
};

/**
 * @swagger
 * /api/shift-reports/shift/:shiftId:
 *   get:
 *     summary: Get all reports for a specific shift
 *     tags: [Shift Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reports for the shift
 *       401:
 *         description: Unauthorized
 */
export const getShiftReports = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reports = await shiftReportService.getShiftReports(shiftId);

    res.json(reports);
  } catch (error: any) {
    console.error('Error getting shift reports:', error);
    res.status(500).json({ error: error.message || 'Failed to get shift reports' });
  }
};

/**
 * @swagger
 * /api/shift-reports/:id:
 *   put:
 *     summary: Update a shift report
 *     tags: [Shift Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 */
export const updateShiftReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const report = await shiftReportService.updateShiftReport(id, guardId, content);

    res.json({
      message: 'Report updated successfully',
      report,
    });
  } catch (error: any) {
    console.error('Error updating shift report:', error);
    res.status(400).json({ error: error.message || 'Failed to update shift report' });
  }
};

/**
 * @swagger
 * /api/shift-reports/:id:
 *   delete:
 *     summary: Delete a shift report
 *     tags: [Shift Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 */
export const deleteShiftReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const guardId = req.user?.id;

    if (!guardId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await shiftReportService.deleteShiftReport(id, guardId);

    res.json({
      message: 'Report deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting shift report:', error);
    res.status(400).json({ error: error.message || 'Failed to delete shift report' });
  }
};
