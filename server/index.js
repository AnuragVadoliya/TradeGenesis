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

// Trust reverse proxies (Render, Cloudflare, Heroku) for rate-limiting
app.set('trust proxy', 1);

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

// Standalone Backtest & Price endpoints (serves as built-in engine if PYTHON_ENGINE_URL targets self or Render fallback)
const { executeBacktest } = require('./utils/backtestEngine');

app.post('/backtest', (req, res) => {
  try {
    const { strategy_code, symbol, start_date, end_date, initial_capital } = req.body;
    const results = executeBacktest(strategy_code, symbol, start_date, end_date, initial_capital);
    res.json(results);
  } catch (err) {
    res.status(400).json({ detail: err.message });
  }
});

app.get('/price/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  const mockPrices = {
    'RELIANCE': 2980.50, 'TCS': 3840.20, 'INFY': 1540.60, 'HDFCBANK': 1690.40,
    'ICICIBANK': 1110.80, 'SBIN': 815.30, 'TATAMOTORS': 960.50, 'BAJFINANCE': 7120.00
  };
  const clean = symbol.toUpperCase().replace(/\.(NS|BO)$/, '');
  const price = mockPrices[clean] || 1250.00;
  res.json({ symbol, price });
});

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
