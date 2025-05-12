// src/routes/analysis.routes.ts
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { analysisService } from '../services/analysis.service';

const router = Router();

/**
 * @route   GET /api/analysis/technical/:id
 * @desc    Get technical analysis for a currency
 * @access  Private
 */
router.get('/technical/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const analysis = await analysisService.getTechnicalAnalysis(id);
    res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Error fetching technical analysis:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch technical analysis' });
  }
});

/**
 * @route   GET /api/analysis/sentiment/:id
 * @desc    Get sentiment analysis for a currency
 * @access  Private
 */
router.get('/sentiment/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await analysisService.getSentimentAnalysis(id);
    res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Error fetching sentiment analysis:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch sentiment analysis' });
  }
});

/**
 * @route   GET /api/analysis/combined/:id
 * @desc    Get combined analysis for a currency
 * @access  Private
 */
router.get('/combined/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await analysisService.getCombinedAnalysis(id);
    res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Error fetching combined analysis:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch combined analysis' });
  }
});

export default router;