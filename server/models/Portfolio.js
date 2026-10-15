const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  quantity: { type: Number, required: true, min: 0 },
  avgBuyPrice: { type: Number, required: true },
  currentPrice: { type: Number, default: 0 },
  totalInvested: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unrealizedPnl: { type: Number, default: 0 },
  unrealizedPnlPercent: { type: Number, default: 0 }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  holdings: [holdingSchema],
  realizedPnl: {
    type: Number,
    default: 0
  },
  totalTrades: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
