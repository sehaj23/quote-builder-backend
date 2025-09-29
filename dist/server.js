import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDatabase, testConnection } from '@/config/database.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import companyRoutes from '@/routes/companyRoutes.js';
import itemRoutes, { individualItemRouter, categoryRouter } from '@/routes/itemRoutes.js';
import quoteRoutes, { individualQuoteRouter } from '@/routes/quoteRoutes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:1420',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await testConnection();
        const response = {
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
    }
    catch (error) {
        const response = {
            success: false,
            error: 'Service health check failed'
        };
        res.status(503).json(response);
    }
});
app.use('/api/companies', companyRoutes);
app.use('/api/companies/:companyId/items', itemRoutes);
app.use('/api/items', individualItemRouter);
app.use('/api/companies/:companyId/categories', categoryRouter);
app.use('/api/companies/:companyId/quotes', quoteRoutes);
app.use('/api/quotes', individualQuoteRouter);
app.get('/', (req, res) => {
    const response = {
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
app.use(notFoundHandler);
app.use(errorHandler);
const startServer = async () => {
    try {
        console.log('🔄 Starting QuoteBuilder Backend Server...');
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API base URL: http://localhost:${PORT}/api`);
            console.log(`✅ QuoteBuilder Backend Server started successfully!`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
export default app;
//# sourceMappingURL=server.js.map