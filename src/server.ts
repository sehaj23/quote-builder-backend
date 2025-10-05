import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { initDatabase, testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ApiResponse } from './types/index.js';

// Route imports
import companyRoutes from './routes/companyRoutes.js';
import itemRoutes, { individualItemRouter, categoryRouter } from './routes/itemRoutes.js';
import quoteRoutes, { individualQuoteRouter } from './routes/quoteRoutes.js';
import userRoutes from './routes/userRoutes.js';
import superUserRoutes, { individualSuperUserRouter } from './routes/superUserRoutes.js';
import attachmentRoutes, { individualAttachmentRouter } from './routes/attachmentRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Log environment info for debugging
console.log('🔧 Environment Variables Check:');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST ? 'SET' : 'MISSING');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env['FRONTEND_URL'] || 'http://localhost:1420',
    'http://localhost:1421',
    'http://localhost:1422'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbHealthy = await testConnection();
    
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      },
      message: 'Service is running'
    };
    
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Service health check failed'
    };
    
    res.status(503).json(response);
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);

// Item routes - nested under companies and as individual routes
app.use('/api/companies/:companyId/items', itemRoutes);
app.use('/api/items', individualItemRouter);
app.use('/api/companies/:companyId/categories', categoryRouter);

// Quote routes - nested under companies and as individual routes  
app.use('/api/companies/:companyId/quotes', quoteRoutes);
app.use('/api/quotes', individualQuoteRouter);

// User routes
app.use('/api/users', userRoutes);

// Super User routes - company-scoped and individual admin routes
app.use('/api/companies/:companyId/users', superUserRoutes);
app.use('/api/admin/users', individualSuperUserRouter);

// Attachment routes - nested under companies and as individual routes
app.use('/api/companies', attachmentRoutes);
app.use('/api/attachments', individualAttachmentRouter);

// Activity routes
app.use('/api/activities', activityRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'QuoteBuilder Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    message: 'QuoteBuilder Backend API is running'
  };
  
  res.json(response);
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize database
    console.log('🔄 Starting QuoteBuilder Backend Server...');
    await initDatabase();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API base URL: http://localhost:${PORT}/api`);
      console.log(`✅ QuoteBuilder Backend Server started successfully!`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export default app;