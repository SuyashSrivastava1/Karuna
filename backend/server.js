const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sites', require('./routes/siteRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/volunteer', require('./routes/volunteerRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Karuna Backend is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
