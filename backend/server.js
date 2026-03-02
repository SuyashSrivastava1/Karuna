const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------

// CORS — allow all Vite dev-server ports + local origins
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://localhost:5182',
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// HTTP request logging
app.use(morgan('dev'));

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// --------------- Routes ---------------

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sites', require('./routes/siteRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/volunteer', require('./routes/volunteerRoutes'));
app.use('/api/volunteer-todos', require('./routes/volunteerTodoRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/flags', require('./routes/flagRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'Karuna Backend',
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString()
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'Karuna Backend',
        version: '1.0.0',
        description: 'Disaster Relief Coordination Platform API',
        docs: '/api/health'
    });
});

// --------------- Error Handling ---------------

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// --------------- Start Server ---------------

app.listen(PORT, () => {
    console.log(`\n🚀 Karuna Backend running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Mode:   ${process.env.NODE_ENV || 'development'}\n`);
});
