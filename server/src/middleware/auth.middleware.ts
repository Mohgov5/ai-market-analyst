// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/user.model';
import User from '../models/user.model';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthMiddleware');

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

export const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET as string;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
  
  if (!jwtSecret || !refreshTokenSecret) {
    throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET environment variable is not set');
  }
  
  // Access token (short-lived)
  const accessToken = jwt.sign(
    { id: userId },
    jwtSecret,
    { expiresIn: '1h' }
  );
  
  // Refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: userId },
    refreshTokenSecret,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Optional: Admin-only middleware
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // This is just a placeholder. In a real app, you would have a role field in your user model
    const user = await User.findById(req.user._id);
    
    if (user && (user as any).role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    logger.error('Admin check error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};