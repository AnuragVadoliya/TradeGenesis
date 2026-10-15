const Strategy = require('../models/Strategy');

const createStrategy = async (req, res) => {
  try {
    const { name, description, naturalLanguage, code, explanation, indicators, assetClass, timeframe, tags } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const strategy = await Strategy.create({
      name,
      description,
      naturalLanguage: naturalLanguage || '',
      code,
      explanation,
      indicators: indicators || [],
      assetClass: assetClass || 'equity',
      timeframe: timeframe || '1d',
      tags: tags || [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, strategy });
  } catch (err) {
    console.error('Create strategy error:', err);
    res.status(500).json({ error: 'Failed to create strategy' });
  }
};

const getStrategies = async (req, res) => {
  try {
    const strategies = await Strategy.find({ createdBy: req.user._id, isActive: true })
      .sort({ createdAt: -1 })
      .populate('backtestResults');

    res.json({ success: true, strategies });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
};

const getStrategy = async (req, res) => {
  try {
    const strategy = await Strategy.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({ success: true, strategy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch strategy' });
  }
};

const updateStrategy = async (req, res) => {
  try {
    const { name, description, code, explanation } = req.body;

    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { name, description, code, explanation },
      { new: true }
    );

    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({ success: true, strategy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update strategy' });
  }
};

const deleteStrategy = async (req, res) => {
  try {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json({ success: true, message: 'Strategy deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete strategy' });
  }
};

module.exports = { createStrategy, getStrategies, getStrategy, updateStrategy, deleteStrategy };
