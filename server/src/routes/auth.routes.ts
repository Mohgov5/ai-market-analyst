// server/src/routes/auth.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Register a new user
router.post('/register', (req: Request, res: Response) => {
  authController.register(req, res);
});

// Login
router.post('/login', (req: Request, res: Response) => {
  authController.login(req, res);
});

// Refresh access token
router.post('/refresh-token', (req: Request, res: Response) => {
  authController.refreshToken(req, res);
});

// Get user profile (protected route)
router.get('/profile', authenticateJWT, (req: AuthRequest, res: Response) => {
  authController.getProfile(req, res);
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  authController.logout(req, res);
});

export default router;