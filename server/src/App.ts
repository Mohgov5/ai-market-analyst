// src/app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { httpLogger, setupGlobalErrorHandling } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import currencyRoutes from './routes/currency.routes';
import analysisRoutes from './routes/analysis.routes';
import userRoutes from './routes/user.routes';
import newsRoutes from './routes/news.routes';
// Load environment variables
dotenv.config();

// Set up global error handling
setupGlobalErrorHandling();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:3000'
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(httpLogger); // Utilisation du logger HTTP personnalisé

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-market-analyst';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/user', userRoutes);
app.use('/api/news', newsRoutes); // Ajout des routes pour les news

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;