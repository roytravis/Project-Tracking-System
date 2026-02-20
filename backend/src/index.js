const express = require('express');
const cors = require('cors');
const projectRoutes = require('./routes/projects');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/projects', projectRoutes);

// 404 handler (must be after all valid routes)
app.use(notFoundHandler);

// Error handler (must be last middleware)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Project Tracking API running at http://localhost:${PORT}`);
    console.log(`📋 API Base: http://localhost:${PORT}/api/projects`);
});

module.exports = app;
