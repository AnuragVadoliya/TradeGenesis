const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  date: String,
  type: { type: String, enum: ['BUY', 'SELL'] },
  price: Number,
  quantity: Number,
  pnl: Number
}, { _id: false });

const backtestSchema = new mongoose.Schema({
  strategyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Strategy',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  startDate: Date,
  endDate: Date,
  initialCapital: {
    type: Number,
    default: 100000
  },
  results: {
    totalProfit: Number,
    totalReturn: Number,
    winRate: Number,
    totalTrades: Number,
    winningTrades: Number,
    losingTrades: Number,
    maxDrawdown: Number,
    sharpeRatio: Number,
    finalCapital: Number,
    equityCurve: [{ date: String, equity: Number }],
    trades: [tradeSchema]
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: String
}, { timestamps: true });

module.exports = mongoose.model('Backtest', backtestSchema);
