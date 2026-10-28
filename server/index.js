const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const ENV_PATH = require('path').join(__dirname, '.env');
require('dotenv').config({ path: ENV_PATH });

console.log(process.env.GROQ_API_KEY
  ? `🔑 GROQ_API_KEY loaded from ${ENV_PATH} (${process.env.GROQ_API_KEY.slice(0, 8)}…)`
  : `🔑 GROQ_API_KEY is MISSING — check ${ENV_PATH}`);

const app = express();

// Security middleware
app.use(helmet());

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CORS_ORIGIN].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/strategies', require('./routes/strategies'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/backtest', require('./routes/backtest'));
app.use('/api/paper', require('./routes/paper'));
app.use('/api/portfolio', require('./routes/portfolio'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'TradeGenesis Server' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
