// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import User, { IUser } from '../models/user.model';
import { generateTokens } from '../middleware/auth.middleware';
import { createLogger } from '../utils/logger';
import jwt from 'jsonwebtoken';

const logger = createLogger('AuthController');

interface AuthRequest extends Request {
  user?: IUser;
}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Please provide email, password and name' });
    }
    
    // Check for valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user: IUser = new User({
      email,
      password, // Will be hashed by the model's pre-save hook
      name
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(String(user._id));
    
    // Set refresh token as HTTP-only cookie for added security
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      accessToken
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user by email
    const user = await User.findOne({ email }) as IUser;
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(String(user._id));
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    logger.info(`User authenticated: ${user.email}`);
    
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      accessToken
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from request body or cookie
    const tokenFromBody = req.body.refreshToken;
    const tokenFromCookie = req.cookies?.refreshToken;
    const refreshToken = tokenFromBody || tokenFromCookie;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    
    if (!refreshTokenSecret) {
      logger.error('REFRESH_TOKEN_SECRET environment variable is not set');
      return res.status(500).json({ message: 'Internal server error' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, refreshTokenSecret) as { id: string };
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(decoded.id);
    
    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.status(200).json({
      accessToken: tokens.accessToken
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    return res.status(500).json({ message: 'Server error during token refresh' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    return res.status(200).json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        profilePicture: req.user.profilePicture,
        preferences: req.user.preferences,
        createdAt: req.user.createdAt
      }
    });
  } catch (error: any) {
    logger.error('Profile retrieval error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logout successful' });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get full user document with password
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    logger.error('Password change error:', error);
    return res.status(500).json({ message: 'Server error during password change', error: error.message });
  }
};