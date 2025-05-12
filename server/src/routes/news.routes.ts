// src/routes/news.routes.ts
import { Router, Request, Response, NextFunction } from 'express';

// Define a custom AuthRequest type
interface AuthRequest extends Request {
  user?: { id: string; role: string }; // Adjust based on your JWT payload structure
}
import { authenticateJWT } from '../middleware/auth.middleware';
import { newsService } from '../services/news.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('NewsRoutes');

/**
 * @route   GET /api/news
 * @desc    Get general financial news
 * @access  Private
 */
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { limit = '10', category } = req.query;
    
    // Validate limit parameter
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
      res.status(400).json({ message: 'Limit must be a number between 1 and 50' });
      return;
    }
    
    // Get news with optional category filter
    const news = await newsService.getFinancialNews(
      parsedLimit, 
      category as string | undefined
    );
    
    res.status(200).json(news);
  } catch (error: any) {
    logger.error('Error fetching financial news:', error);
    next(error);
  }
});

/**
 * @route   GET /api/news/currency/:id
 * @desc    Get news for a specific currency
 * @access  Private
 */
router.get('/currency/:id', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { limit = '5' } = req.query;
    
    // Validate limit parameter
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 30) {
      res.status(400).json({ message: 'Limit must be a number between 1 and 30' });
      return;
    }
    
    // Validate currency ID
    if (!id || id.trim().length === 0) {
      res.status(400).json({ message: 'Currency ID is required' });
      return;
    }
    
    const news = await newsService.getCurrencyNews(id, parsedLimit);
    res.status(200).json(news);
  } catch (error: any) {
    logger.error(`Error fetching news for currency ${req.params.id}:`, error);
    next(error);
  }
});

/**
 * @route   GET /api/news/sentiment
 * @desc    Get news filtered by sentiment
 * @access  Private
 */
router.get('/sentiment', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sentiment, limit = '10' } = req.query;
    
    // Validate sentiment parameter
    if (!sentiment || !['positive', 'negative', 'neutral'].includes(sentiment as string)) {
      res.status(400).json({ message: 'Valid sentiment parameter required (positive, negative, or neutral)' });
      return;
    }
    
    // Validate limit parameter
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
      res.status(400).json({ message: 'Limit must be a number between 1 and 50' });
      return;
    }
    
    // Get news filtered by sentiment
    const news = await newsService.getFinancialNews(parsedLimit);
    
    // Filter news by sentiment
    let filteredNews;
    if (sentiment === 'positive') {
      filteredNews = news.filter(article => (article.sentiment || 0) > 0.2);
    } else if (sentiment === 'negative') {
      filteredNews = news.filter(article => (article.sentiment || 0) < -0.2);
    } else {
      filteredNews = news.filter(article => 
        (article.sentiment || 0) >= -0.2 && 
        (article.sentiment || 0) <= 0.2
      );
    }
    
    res.status(200).json(filteredNews);
  } catch (error: any) {
    logger.error('Error fetching news by sentiment:', error);
    next(error);
  }
});

/**
 * @route   GET /api/news/search
 * @desc    Search news with a keyword
 * @access  Private
 */
router.get('/search', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, limit = '10' } = req.query;
    
    // Validate search query
    if (!query || (query as string).trim().length < 2) {
      res.status(400).json({ message: 'Search query must be at least 2 characters' });
      return;
    }
    
    // Validate limit parameter
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 50) {
      res.status(400).json({ message: 'Limit must be a number between 1 and 50' });
      return;
    }
    
    // Get news with search query
    const news = await newsService.searchNews(query as string, parsedLimit);
    
    res.status(200).json(news);
  } catch (error: any) {
    logger.error('Error searching news:', error);
    next(error);
  }
});

/**
 * @route   GET /api/news/sources
 * @desc    Get list of available news sources
 * @access  Private
 */
router.get('/sources', authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get available news sources
    const sources = await newsService.getNewsSources();
    
    res.status(200).json(sources);
  } catch (error: any) {
    logger.error('Error fetching news sources:', error);
    next(error);
  }
});

export default router;