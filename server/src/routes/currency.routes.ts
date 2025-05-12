// src/routes/currency.routes.ts
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { currencyService } from '../services/currency.service';

const router = Router();

/**
 * @route   GET /api/currencies/crypto
 * @desc    Get all cryptocurrencies
 * @access  Private
 */
router.get('/crypto', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const cryptos = await currencyService.getCryptocurrencies();
    res.status(200).json(cryptos);
  } catch (error: any) {
    console.error('Error fetching cryptocurrencies:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch cryptocurrencies' });
  }
});

/**
 * @route   GET /api/currencies/fiat
 * @desc    Get all fiat currencies
 * @access  Private
 */
router.get('/fiat', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const fiats = await currencyService.getFiatCurrencies();
    res.status(200).json(fiats);
  } catch (error: any) {
    console.error('Error fetching fiat currencies:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch fiat currencies' });
  }
});

/**
 * @route   GET /api/currencies/:type/:id
 * @desc    Get details for a specific currency
 * @access  Private
 */
router.get('/:type/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;
    
    if (type !== 'crypto' && type !== 'fiat') {
      return res.status(400).json({ message: 'Type must be either "crypto" or "fiat"' });
    }
    
    const currency = await currencyService.getCurrencyDetails(id, type as 'crypto' | 'fiat');
    res.status(200).json(currency);
  } catch (error: any) {
    console.error(`Error fetching ${req.params.type} details:`, error);
    res.status(500).json({ message: error.message || `Failed to fetch ${req.params.type} details` });
  }
});

/**
 * @route   GET /api/currencies/:id/history
 * @desc    Get price history for a currency
 * @access  Private
 */
router.get('/:id/history', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeframe = '1m', limit = '100' } = req.query;
    
    const validTimeframes = ['1h', '1d', '1w', '1m', '1y', 'all'];
    if (!validTimeframes.includes(timeframe as string)) {
      return res.status(400).json({ message: 'Invalid timeframe parameter' });
    }
    
    const parsedLimit = parseInt(limit as string, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ message: 'Invalid limit parameter' });
    }
    
    const history = await currencyService.getCurrencyPriceHistory({
      id,
      timeframe: timeframe as '1h' | '1d' | '1w' | '1m' | '1y' | 'all',
      limit: parsedLimit
    });
    
    res.status(200).json(history);
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch price history' });
  }
});

export default router;