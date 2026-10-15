# 🚀 TradeGenesis — AI-Powered Algorithmic Trading Platform

> Create, backtest, and paper-trade algorithmic strategies using natural language AI on NSE/BSE markets.

---

## 📁 Project Structure

```
TradeGenesis/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/             # LandingPage, Dashboard, AIChatPage, etc.
│   │   ├── components/        # Layout, UI components
│   │   ├── context/           # AuthContext
│   │   ├── services/          # Axios API service
│   │   └── index.css          # Tailwind + global styles
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                    # Node.js + Express backend
│   ├── controllers/           # authController, aiController, etc.
│   ├── models/                # User, Strategy, Backtest, Trade, Portfolio
│   ├── routes/                # auth, strategies, ai, backtest, paper
│   ├── middleware/            # JWT auth middleware
│   └── index.js
│
├── python-engine/             # FastAPI backtesting engine
│   ├── main.py                # All endpoints + backtesting logic
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Chart.js |
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Python Engine | FastAPI, pandas, numpy, yfinance |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Data | Yahoo Finance (yfinance) for NSE/BSE |

---

## 🏃 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- Anthropic API key → https://console.anthropic.com

---

### Step 1: Clone & Setup

```bash
git clone <your-repo>
cd TradeGenesis
```

---

### Step 2: Backend (Node.js Server)

```bash
cd server
npm install

# Edit .env file:
# MONGODB_URI=mongodb://localhost:27017/tradegenesis
# JWT_SECRET=your_secret_here
# ANTHROPIC_API_KEY=sk-ant-...
# PYTHON_ENGINE_URL=http://localhost:8000

npm run dev
# Server runs on http://localhost:5000
```

---

### Step 3: Python Engine (FastAPI)

```bash
cd python-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Engine runs on http://localhost:8000
```

---

### Step 4: Frontend (React + Vite)

```bash
cd client
npm install

# Edit .env:
# VITE_API_URL=http://localhost:5000/api

npm run dev
# App runs on http://localhost:5173
```

---

### Step 5: Open the App

1. Go to `http://localhost:5173`
2. Click **"Get Started"** → Register
3. Navigate to **AI Assistant** → describe a strategy
4. Save it → Go to **Backtesting** → Run backtest
5. Go to **Paper Trading** → Execute trades

---

## 🐳 Docker (Full Stack)

```bash
# Create .env in root
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env

docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Python Engine: http://localhost:8000

---

## 🔌 API Reference

### Auth
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         (JWT required)
```

### AI
```
POST /api/ai/generate-strategy  { prompt }
POST /api/ai/chat               { message, conversationHistory }
```

### Strategies
```
GET    /api/strategies
POST   /api/strategies      { name, code, ... }
GET    /api/strategies/:id
PUT    /api/strategies/:id
DELETE /api/strategies/:id
```

### Backtest
```
POST /api/backtest/run    { strategyId, symbol, startDate, endDate, initialCapital }
GET  /api/backtest
GET  /api/backtest/:id
```

### Paper Trading
```
POST /api/paper/buy        { symbol, quantity, strategyId? }
POST /api/paper/sell       { symbol, quantity, strategyId? }
GET  /api/paper/portfolio
GET  /api/paper/history
```

### Python Engine
```
GET  /health
GET  /price/:symbol
POST /backtest             { strategy_code, symbol, start_date, end_date, initial_capital }
POST /validate             { code }
GET  /symbols/search?q=
```

---

## 🧠 Writing Strategies

Your strategy code **must** define `run_strategy(df)`:

```python
import pandas as pd
import numpy as np

def run_strategy(df):
    """
    Args:
        df: DataFrame with columns: Open, High, Low, Close, Volume
    Returns:
        DataFrame with 'signal' column: 1=Buy, -1=Sell, 0=Hold
    """
    df = df.copy()
    
    # Example: RSI Strategy
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    df['signal'] = 0
    df.loc[df['rsi'] < 30, 'signal'] = 1   # Buy
    df.loc[df['rsi'] > 70, 'signal'] = -1  # Sell
    
    return df
```

---

## 🔐 Security Features

- JWT authentication on all protected routes
- Code sandboxing in Python engine (AST-based analysis)
- Forbidden imports: os, sys, subprocess, socket, etc.
- Forbidden functions: eval, exec, open, __import__
- Rate limiting: 100 requests per 15 minutes
- Helmet.js for HTTP security headers

---

## 📊 Features

| Feature | Status |
|---------|--------|
| JWT Auth | ✅ |
| AI Strategy Generator | ✅ Claude API |
| Strategy CRUD | ✅ |
| Python Backtesting | ✅ FastAPI + yfinance |
| Paper Trading | ✅ |
| Portfolio Tracking | ✅ |
| Equity Curve Chart | ✅ Chart.js |
| Code Sandboxing | ✅ AST parsing |
| Dark UI | ✅ Tailwind |
| Responsive | ✅ |

---

## ⚠️ Disclaimer

TradeGenesis is for **educational purposes only**. It is not financial advice.
Virtual trading results do not guarantee real market performance.
Always consult a SEBI-registered advisor before investing.
