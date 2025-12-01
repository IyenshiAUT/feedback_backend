const express = require('express');
const cors = require('cors');
require('dotenv').config();

const feedbackRoutes = require('./routes/feedback');
require('./config/database'); // Initialize SQLite database

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Team MIMH Feedback API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Team MIMH Feedback API',
    endpoints: {
      health: '/api/health',
      feedback: {
        getAll: 'GET /api/feedback',
        getOne: 'GET /api/feedback/:id',
        create: 'POST /api/feedback',
        update: 'PUT /api/feedback/:id',
        delete: 'DELETE /api/feedback/:id',
        getByProject: 'GET /api/feedback/project/:projectType',
        getStats: 'GET /api/feedback/stats/summary'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
});
