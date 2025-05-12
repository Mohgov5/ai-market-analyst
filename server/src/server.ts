// src/server.ts
import app from './App';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Get port from environment variable or use default
const PORT = process.env.PORT || 8000;

// Set up MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-market-analyst';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Create HTTP server
const server = createServer(app);

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A client connected');
  
  // Handle subscriptions to currency updates
  socket.on('subscribe', (data: { currency: string }) => {
    socket.join(data.currency);
    console.log(`Client subscribed to ${data.currency}`);
  });
  
  // Handle unsubscriptions
  socket.on('unsubscribe', (data: { currency: string }) => {
    socket.leave(data.currency);
    console.log(`Client unsubscribed from ${data.currency}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// For testing purposes, simulate price updates
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const currencies = ['btc', 'eth', 'sol', 'ada', 'bnb'];
    
    currencies.forEach(currency => {
      const price = Math.random() * 1000; // Random price for demo
      io.to(currency).emit('price_update', {
        currency,
        price,
        timestamp: new Date().toISOString()
      });
    });
  }, 5000); // Update every 5 seconds
}