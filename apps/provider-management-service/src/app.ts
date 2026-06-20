import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from '../winston/logger';
import providerRoutes from '../routes/ProviderRoutes';
import { ErrorHandlingMiddleware } from '../middleware/ErrorHandlingMiddleware';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Body Parser
app.use(express.json());

// Logging Middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Routes
app.use('/api/providers', providerRoutes);

// Error Handling
app.use(ErrorHandlingMiddleware);

export default app;
