// src/routes/user.routes.ts
import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import User from '../models/user.model';

const router = Router();

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is added by the authenticateJWT middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch user profile' });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is added by the authenticateJWT middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { name, email, preferences } = req.body;
    
    // Check if email is already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(preferences && { preferences })
      },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: error.message || 'Failed to update user profile' });
  }
});

/**
 * @route   PUT /api/user/watchlist
 * @desc    Update user watchlist
 * @access  Private
 */
router.put('/watchlist', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is added by the authenticateJWT middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { action, currencyId } = req.body;
    
    if (!action || !currencyId || (action !== 'add' && action !== 'remove')) {
      return res.status(400).json({ message: 'Invalid request. Action must be "add" or "remove" and currencyId is required' });
    }
    
    let updateQuery;
    
    if (action === 'add') {
      updateQuery = { $addToSet: { watchlist: currencyId } };
    } else {
      updateQuery = { $pull: { watchlist: currencyId } };
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateQuery,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ 
      message: `Currency ${action === 'add' ? 'added to' : 'removed from'} watchlist`,
      watchlist: updatedUser.watchlist
    });
  } catch (error: any) {
    console.error('Error updating watchlist:', error);
    res.status(500).json({ message: error.message || 'Failed to update watchlist' });
  }
});

export default router;