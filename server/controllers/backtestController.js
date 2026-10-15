const axios = require('axios');
const Backtest = require('../models/Backtest');
const Strategy = require('../models/Strategy');

const runBacktest = async (req, res) => {
  try {
    const { strategyId, symbol, startDate, endDate, initialCapital } = req.body;

    if (!strategyId || !symbol) {
      return res.status(400).json({ error: 'Strategy ID and symbol are required' });
    }

    const strategy = await Strategy.findOne({ _id: strategyId, createdBy: req.user._id });
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    // Create backtest record
    const backtest = await Backtest.create({
      strategyId,
      createdBy: req.user._id,
      symbol: symbol.toUpperCase(),
      startDate: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: endDate || new Date(),
      initialCapital: initialCapital || 100000,
      status: 'running'
    });

    // Call Python engine
    const pythonUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

    try {
      const pythonResponse = await axios.post(`${pythonUrl}/backtest`, {
        strategy_code: strategy.code,
        symbol: symbol.toUpperCase(),
        start_date: startDate || null,
        end_date: endDate || null,
        initial_capital: initialCapital || 100000
      }, { timeout: 120000 });

      const results = pythonResponse.data;

      // Update backtest with results
      await Backtest.findByIdAndUpdate(backtest._id, {
        results,
        status: 'completed'
      });

      // Update strategy with latest backtest
      await Strategy.findByIdAndUpdate(strategyId, { backtestResults: backtest._id });

      res.json({
        success: true,
        backtestId: backtest._id,
        results
      });

    } catch (pythonErr) {
      await Backtest.findByIdAndUpdate(backtest._id, {
        status: 'failed',
        errorMessage: pythonErr.response?.data?.detail || pythonErr.message
      });

      res.status(500).json({
        error: 'Backtest execution failed',
        details: pythonErr.response?.data?.detail || pythonErr.message
      });
    }

  } catch (err) {
    console.error('Backtest error:', err);
    res.status(500).json({ error: 'Failed to run backtest' });
  }
};

const getBacktests = async (req, res) => {
  try {
    const backtests = await Backtest.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('strategyId', 'name')
      .limit(20);

    res.json({ success: true, backtests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch backtests' });
  }
};

const getBacktest = async (req, res) => {
  try {
    const backtest = await Backtest.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).populate('strategyId', 'name code');

    if (!backtest) {
      return res.status(404).json({ error: 'Backtest not found' });
    }

    res.json({ success: true, backtest });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch backtest' });
  }
};

module.exports = { runBacktest, getBacktests, getBacktest };
