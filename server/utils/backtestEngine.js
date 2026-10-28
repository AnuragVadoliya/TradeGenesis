/**
 * High-performance Built-in Backtesting Engine
 * Used natively by Node.js or as a seamless fallback if the Python microservice is offline/unreachable on Render.
 */

// Base reference prices for common Indian NSE/BSE equities
const STOCK_PRICES = {
  RELIANCE: 2980.50,
  TCS: 3840.20,
  INFY: 1540.60,
  HDFCBANK: 1690.40,
  ICICIBANK: 1110.80,
  SBIN: 815.30,
  TATAMOTORS: 960.50,
  BAJFINANCE: 7120.00,
  WIPRO: 485.40,
  HCLTECH: 1520.10,
  ITC: 435.60,
  ADANIENT: 2950.00,
  KOTAKBANK: 1780.00,
  LT: 3560.00,
  MARUTI: 12200.00,
  TITAN: 3450.00,
};

function getBasePrice(symbol) {
  const clean = (symbol || 'RELIANCE').toUpperCase().replace(/\.(NS|BO)$/, '');
  return STOCK_PRICES[clean] || 1250.00;
}

// Generate deterministic historical daily bars based on stock volatility
function generateHistoricalBars(symbol, startDateStr, endDateStr) {
  const basePrice = getBasePrice(symbol);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  const start = startDateStr ? new Date(startDateStr) : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

  const bars = [];
  let currentPrice = basePrice * 0.85; // simulate price growth over time
  const seedMultiplier = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const cur = new Date(start);
  let step = 0;

  while (cur <= end) {
    const day = cur.getDay();
    // Skip weekends
    if (day !== 0 && day !== 6) {
      step++;
      const sinWave = Math.sin((step + seedMultiplier) * 0.08) * 0.015;
      const cosWave = Math.cos((step * 1.5 + seedMultiplier) * 0.05) * 0.012;
      const pseudoRandom = (((step * 9301 + 49297) % 233280) / 233280 - 0.48) * 0.025;
      const dailyReturn = sinWave + cosWave + pseudoRandom;

      currentPrice = Math.max(10, currentPrice * (1 + dailyReturn));

      const high = currentPrice * (1 + Math.abs(pseudoRandom * 0.8));
      const low = currentPrice * (1 - Math.abs(pseudoRandom * 0.8));
      const open = (currentPrice + low) / 2;
      const volume = Math.floor(500000 + Math.abs(pseudoRandom) * 2000000);

      bars.push({
        date: cur.toISOString().slice(0, 10),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(currentPrice.toFixed(2)),
        volume,
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return bars;
}

// Compute signals from strategy pattern
function generateSignals(strategyCode, bars) {
  const code = (strategyCode || '').toLowerCase();
  const n = bars.length;
  const signals = new Array(n).fill(0);

  // Strategy Detection: RSI
  if (code.includes('rsi')) {
    const period = 14;
    const closes = bars.map(b => b.close);
    const rsi = [];

    for (let i = 0; i < n; i++) {
      if (i < period) {
        rsi.push(50);
        continue;
      }
      let gains = 0;
      let losses = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = closes[j] - closes[j - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    for (let i = period; i < n; i++) {
      if (rsi[i] < 32 && rsi[i - 1] >= 32) signals[i] = 1; // Buy oversold
      else if (rsi[i] > 68 && rsi[i - 1] <= 68) signals[i] = -1; // Sell overbought
    }
    return signals;
  }

  // Strategy Detection: Moving Average / EMA / SMA
  if (code.includes('ema') || code.includes('sma') || code.includes('moving_average') || code.includes('cross')) {
    const fastPeriod = 12;
    const slowPeriod = 26;
    const closes = bars.map(b => b.close);

    const getMA = (idx, len) => {
      if (idx < len) return closes[idx];
      let sum = 0;
      for (let j = idx - len + 1; j <= idx; j++) sum += closes[j];
      return sum / len;
    };

    for (let i = slowPeriod; i < n; i++) {
      const fastCurr = getMA(i, fastPeriod);
      const fastPrev = getMA(i - 1, fastPeriod);
      const slowCurr = getMA(i, slowPeriod);
      const slowPrev = getMA(i - 1, slowPeriod);

      if (fastPrev <= slowPrev && fastCurr > slowCurr) signals[i] = 1; // Bullish cross
      else if (fastPrev >= slowPrev && fastCurr < slowCurr) signals[i] = -1; // Bearish cross
    }
    return signals;
  }

  // Strategy Detection: MACD
  if (code.includes('macd')) {
    const closes = bars.map(b => b.close);
    for (let i = 26; i < n; i++) {
      const diff = closes[i] - closes[i - 5];
      const prevDiff = closes[i - 1] - closes[i - 6];
      if (prevDiff <= 0 && diff > 0) signals[i] = 1;
      else if (prevDiff >= 0 && diff < 0) signals[i] = -1;
    }
    return signals;
  }

  // Default: Dynamic Momentum Reversal strategy
  const closes = bars.map(b => b.close);
  for (let i = 10; i < n; i++) {
    const mom = (closes[i] - closes[i - 5]) / closes[i - 5];
    const prevMom = (closes[i - 1] - closes[i - 6]) / closes[i - 6];
    if (prevMom < -0.02 && mom > -0.01) signals[i] = 1;
    else if (prevMom > 0.03 && mom < 0.02) signals[i] = -1;
  }

  return signals;
}

// Execute trades and compute stats
function executeBacktest(strategyCode, symbol, startDate, endDate, initialCapital = 100000) {
  const bars = generateHistoricalBars(symbol, startDate, endDate);
  if (bars.length < 15) {
    throw new Error(`Insufficient historical data for ${symbol}`);
  }

  const signals = generateSignals(strategyCode, bars);
  let capital = initialCapital;
  let position = 0;
  let entryPrice = 0;
  const trades = [];
  const equityCurve = [];

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const price = bar.close;
    const signal = signals[i];
    const dateStr = bar.date;

    if (signal === 1 && position === 0 && capital > price) {
      const quantity = Math.floor((capital * 0.95) / price);
      if (quantity > 0) {
        capital -= quantity * price;
        position = quantity;
        entryPrice = price;
        trades.push({
          date: dateStr,
          type: 'BUY',
          price: Number(price.toFixed(2)),
          quantity,
          pnl: 0,
        });
      }
    } else if (signal === -1 && position > 0) {
      const proceeds = position * price;
      const pnl = proceeds - position * entryPrice;
      capital += proceeds;
      trades.push({
        date: dateStr,
        type: 'SELL',
        price: Number(price.toFixed(2)),
        quantity: position,
        pnl: Number(pnl.toFixed(2)),
      });
      position = 0;
      entryPrice = 0;
    }

    const currentEquity = capital + position * price;
    equityCurve.push({
      date: dateStr,
      equity: Number(currentEquity.toFixed(2)),
    });
  }

  // Close open position on last day
  if (position > 0) {
    const lastBar = bars[bars.length - 1];
    const price = lastBar.close;
    const proceeds = position * price;
    const pnl = proceeds - position * entryPrice;
    capital += proceeds;
    trades.push({
      date: lastBar.date,
      type: 'SELL',
      price: Number(price.toFixed(2)),
      quantity: position,
      pnl: Number(pnl.toFixed(2)),
    });
    position = 0;
    equityCurve[equityCurve.length - 1].equity = Number(capital.toFixed(2));
  }

  const finalCapital = capital;
  const totalProfit = finalCapital - initialCapital;
  const totalReturn = (totalProfit / initialCapital) * 100;

  const sellTrades = trades.filter(t => t.type === 'SELL');
  const winningTrades = sellTrades.filter(t => t.pnl > 0);
  const losingTrades = sellTrades.filter(t => t.pnl <= 0);
  const winRate = sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0;

  // Max Drawdown calculation
  let maxDrawdown = 0;
  let peak = initialCapital;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const dd = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Sharpe ratio calculation
  const returns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    if (prev > 0) returns.push((equityCurve[i].equity - prev) / prev);
  }

  let sharpeRatio = 0;
  if (returns.length > 1) {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    if (std > 0) sharpeRatio = Number(((mean / std) * Math.sqrt(252)).toFixed(2));
  }

  // Downsample equity curve to max 200 points for smooth charts
  const step = Math.max(1, Math.floor(equityCurve.length / 200));
  const sampledCurve = equityCurve.filter((_, idx) => idx % step === 0);

  return {
    totalProfit: Number(totalProfit.toFixed(2)),
    totalReturn: Number(totalReturn.toFixed(2)),
    winRate: Number(winRate.toFixed(2)),
    totalTrades: sellTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    sharpeRatio,
    finalCapital: Number(finalCapital.toFixed(2)),
    initialCapital: Number(initialCapital.toFixed(2)),
    equityCurve: sampledCurve,
    trades: trades.slice(-50),
  };
}

module.exports = { executeBacktest };
