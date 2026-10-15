const mongoose = require('mongoose');

const strategySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Strategy name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  naturalLanguage: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: [true, 'Strategy code is required']
  },
  explanation: {
    type: String
  },
  indicators: [{
    type: String
  }],
  assetClass: {
    type: String,
    enum: ['equity', 'futures', 'options', 'crypto'],
    default: 'equity'
  },
  timeframe: {
    type: String,
    enum: ['1m', '5m', '15m', '30m', '1h', '1d', '1w'],
    default: '1d'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  backtestResults: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Backtest'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Strategy', strategySchema);
