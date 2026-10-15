const User = require('../models/User');
const Trade = require('../models/Trade');
const Portfolio = require('../models/Portfolio');
const axios = require('axios');

// Get simulated current price for Indian stocks
const getStockPrice = async (symbol) => {
  try {
    const pythonUrl = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';
    const response = await axios.get(`${pythonUrl}/price/${symbol}.NS`, { timeout: 10000 });
    return response.data.price;
  } catch {
    // Fallback mock prices for demo
    const mockPrices = {
      'RELIANCE': 2845.50,
      'TCS': 3756.25,
      'INFY': 1456.80,
      'HDFC': 1623.45,
      'ICICIBANK': 987.30,
      'WIPRO': 452.60,
      'HCLTECH': 1234.70,
      'BAJFINANCE': 6789.90,
      'ADANIENT': 2456.30,
      'TATAMOTORS': 678.45
    };
    return mockPrices[symbol.replace('.NS', '')] || Math.random() * 1000 + 500;
  }
};

const buyStock = async (req, res) => {
  try {
    const { symbol, quantity, strategyId } = req.body;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid symbol and quantity required' });
    }

    const user = await User.findById(req.user._id);
    const price = await getStockPrice(symbol);
    const total = price * quantity;

    if (user.virtualBalance < total) {
      return res.status(400).json({
        error: `Insufficient balance. Need ₹${total.toFixed(2)}, available ₹${user.virtualBalance.toFixed(2)}`
      });
    }

    // Deduct balance
    user.virtualBalance -= total;
    await user.save();

    // Record trade
    const trade = await Trade.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      type: 'BUY',
      quantity,
      price,
      total,
      strategyId
    });

    // Update portfolio
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId: req.user._id, holdings: [] });
    }

    const existingHolding = portfolio.holdings.find(h => h.symbol === symbol.toUpperCase());
    if (existingHolding) {
      const newTotalInvested = existingHolding.totalInvested + total;
      const newQuantity = existingHolding.quantity + quantity;
      existingHolding.avgBuyPrice = newTotalInvested / newQuantity;
      existingHolding.quantity = newQuantity;
      existingHolding.totalInvested = newTotalInvested;
      existingHolding.currentPrice = price;
      existingHolding.currentValue = price * newQuantity;
      existingHolding.unrealizedPnl = existingHolding.currentValue - newTotalInvested;
      existingHolding.unrealizedPnlPercent = (existingHolding.unrealizedPnl / newTotalInvested) * 100;
    } else {
      portfolio.holdings.push({
        symbol: symbol.toUpperCase(),
        quantity,
        avgBuyPrice: price,
        currentPrice: price,
        totalInvested: total,
        currentValue: total,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0
      });
    }
    portfolio.totalTrades += 1;
    await portfolio.save();

    res.json({
      success: true,
      trade,
      newBalance: user.virtualBalance,
      message: `Bought ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}`
    });

  } catch (err) {
    console.error('Buy error:', err);
    res.status(500).json({ error: 'Trade execution failed' });
  }
};

const sellStock = async (req, res) => {
  try {
    const { symbol, quantity, strategyId } = req.body;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid symbol and quantity required' });
    }

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    const holding = portfolio?.holdings.find(h => h.symbol === symbol.toUpperCase());

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({
        error: `Insufficient holdings. You have ${holding?.quantity || 0} shares of ${symbol}`
      });
    }

    const price = await getStockPrice(symbol);
    const total = price * quantity;
    const pnl = (price - holding.avgBuyPrice) * quantity;

    // Update portfolio
    holding.quantity -= quantity;
    holding.totalInvested -= holding.avgBuyPrice * quantity;
    holding.currentPrice = price;
    if (holding.quantity === 0) {
      portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol.toUpperCase());
    } else {
      holding.currentValue = price * holding.quantity;
      holding.unrealizedPnl = holding.currentValue - holding.totalInvested;
      holding.unrealizedPnlPercent = (holding.unrealizedPnl / holding.totalInvested) * 100;
    }
    portfolio.realizedPnl += pnl;
    portfolio.totalTrades += 1;
    await portfolio.save();

    // Credit balance
    const user = await User.findById(req.user._id);
    user.virtualBalance += total;
    await user.save();

    const trade = await Trade.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      type: 'SELL',
      quantity,
      price,
      total,
      pnl,
      strategyId
    });

    res.json({
      success: true,
      trade,
      newBalance: user.virtualBalance,
      pnl,
      message: `Sold ${quantity} shares of ${symbol} at ₹${price.toFixed(2)} | P&L: ₹${pnl.toFixed(2)}`
    });

  } catch (err) {
    console.error('Sell error:', err);
    res.status(500).json({ error: 'Trade execution failed' });
  }
};

const getPortfolio = async (req, res) => {
  try {
    const [user, portfolio, recentTrades] = await Promise.all([
      User.findById(req.user._id),
      Portfolio.findOne({ userId: req.user._id }),
      Trade.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20)
    ]);

    res.json({
      success: true,
      virtualBalance: user.virtualBalance,
      portfolio: portfolio || { holdings: [], realizedPnl: 0, totalTrades: 0 },
      recentTrades
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
};

const getTradeHistory = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('strategyId', 'name');

    res.json({ success: true, trades });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
};

module.exports = { buyStock, sellStock, getPortfolio, getTradeHistory };
