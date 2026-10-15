from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import yfinance as yf
import traceback
import ast
import sys
import io
from contextlib import redirect_stdout
from datetime import datetime, timedelta
import math
import logging

# ─── Logger (prints full tracebacks to uvicorn console) ───────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tradegen")

app = FastAPI(title="TradeGenesis Python Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Models ────────────────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    strategy_code: str
    symbol: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    initial_capital: float = 100000.0

class StrategyValidateRequest(BaseModel):
    code: str

# ─── Security: AST-based Code Check ───────────────────────────────────────────

FORBIDDEN_IMPORTS = [
    'os', 'sys', 'subprocess', 'shutil', 'pathlib', 'socket',
    'urllib', 'requests', 'http', 'ftplib', 'smtplib',
    'pickle', 'shelve', 'marshal', 'builtins',
]

FORBIDDEN_CALLS = ['eval', 'exec', 'compile', 'open', '__import__']
FORBIDDEN_METHODS = ['system', 'popen', 'spawn', 'exec_', 'call']

def is_code_safe(code: str) -> tuple[bool, str]:
    """Parse AST to detect dangerous code patterns."""
    if not code or not code.strip():
        return False, "Strategy code is empty"

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax error: {e}"

    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    top = alias.name.split('.')[0]
                    if top in FORBIDDEN_IMPORTS:
                        return False, f"Forbidden import: {top}"
            elif isinstance(node, ast.ImportFrom):
                top = (node.module or "").split('.')[0]
                if top in FORBIDDEN_IMPORTS:
                    return False, f"Forbidden import: {top}"

        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in FORBIDDEN_CALLS:
                    return False, f"Forbidden function call: {node.func.id}"
            if isinstance(node.func, ast.Attribute):
                if node.func.attr in FORBIDDEN_METHODS:
                    return False, f"Forbidden method call: {node.func.attr}"

    func_names = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    if 'run_strategy' not in func_names:
        return False, "Code must define a function named 'run_strategy(df)'"

    return True, "OK"


# ─── Strategy Executor ─────────────────────────────────────────────────────────

def execute_strategy(code: str, df: pd.DataFrame) -> pd.DataFrame:
    """
    Execute strategy code safely.

    Security model:
      - Dangerous imports/calls are blocked BEFORE execution by is_code_safe() AST scan.
      - __import__ is re-exposed via a whitelist wrapper so pandas/numpy C-extensions
        can resolve their internal sub-modules inside exec(). Without this, any
        pandas operation that lazily loads a sub-module raises '__import__ not found'.
      - Only pandas, numpy, math, statistics sub-modules are allowed through the wrapper.
    """

    ALLOWED_MODULES = {
        'pandas', 'numpy', 'math', 'statistics',
        'numpy.core', 'numpy.lib', 'numpy.linalg',
        'pandas.core', 'pandas.compat',
    }

    def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
        top = name.split('.')[0]
        if top not in {'pandas', 'numpy', 'math', 'statistics'}:
            raise ImportError(
                f"Import '{name}' is not allowed in strategy code. "
                f"Only pandas, numpy, math, and statistics are permitted."
            )
        return __import__(name, globals or {}, locals or {}, fromlist, level)

    safe_builtins = {
        # Import machinery — whitelisted wrapper
        '__import__': _safe_import,
        '__build_class__': __build_class__,
        '__name__': '__strategy__',
        '__spec__': None,
        '__loader__': None,
        '__package__': None,
        # Iteration / functional
        'len': len, 'range': range, 'enumerate': enumerate,
        'zip': zip, 'map': map, 'filter': filter,
        'sorted': sorted, 'reversed': reversed,
        'any': any, 'all': all, 'next': next, 'iter': iter,
        # Type constructors
        'list': list, 'dict': dict, 'tuple': tuple, 'set': set,
        'frozenset': frozenset, 'bytearray': bytearray,
        'int': int, 'float': float, 'str': str, 'bool': bool,
        'complex': complex, 'bytes': bytes,
        # Math builtins
        'abs': abs, 'max': max, 'min': min, 'sum': sum,
        'round': round, 'divmod': divmod, 'pow': pow,
        # Introspection
        'print': print, 'isinstance': isinstance,
        'issubclass': issubclass, 'type': type,
        'hasattr': hasattr, 'getattr': getattr, 'setattr': setattr,
        'callable': callable, 'id': id, 'hash': hash,
        'repr': repr, 'format': format,
        'vars': vars, 'dir': dir,
        # Exceptions
        'Exception': Exception, 'BaseException': BaseException,
        'ValueError': ValueError, 'TypeError': TypeError,
        'KeyError': KeyError, 'IndexError': IndexError,
        'AttributeError': AttributeError, 'RuntimeError': RuntimeError,
        'StopIteration': StopIteration, 'NotImplementedError': NotImplementedError,
        'ZeroDivisionError': ZeroDivisionError, 'OverflowError': OverflowError,
        'ImportError': ImportError, 'NameError': NameError,
        # Constants
        'None': None, 'True': True, 'False': False,
        'NotImplemented': NotImplemented, 'Ellipsis': Ellipsis,
        # Slice / object
        'slice': slice, 'object': object,
    }

    safe_globals = {
        '__builtins__': safe_builtins,
        'pd': pd,
        'np': np,
    }

    try:
        exec(compile(code, '<strategy>', 'exec'), safe_globals)
    except Exception as e:
        logger.error(f"[execute_strategy] exec failed:\n{traceback.format_exc()}")
        raise

    if 'run_strategy' not in safe_globals:
        raise ValueError("run_strategy function not found after execution")

    try:
        result = safe_globals['run_strategy'](df.copy())
    except Exception as e:
        logger.error(f"[execute_strategy] run_strategy() failed:\n{traceback.format_exc()}")
        raise

    return result


# ─── Data Fetching ─────────────────────────────────────────────────────────────

def fetch_stock_data(symbol: str, start_date: str = None, end_date: str = None) -> pd.DataFrame:
    """Fetch historical OHLCV data from Yahoo Finance."""
    yf_symbol = symbol
    if not symbol.endswith('.NS') and not symbol.endswith('.BO') and '.' not in symbol:
        yf_symbol = f"{symbol}.NS"

    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    if not start_date:
        start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

    logger.info(f"[fetch] {yf_symbol}  {start_date} → {end_date}")

    ticker = yf.Ticker(yf_symbol)
    df = ticker.history(start=start_date, end=end_date)

    if df.empty:
        raise ValueError(
            f"No data found for '{symbol}'. "
            "Check the symbol name — NSE suffix (.NS) is added automatically."
        )

    df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
    df.index = pd.to_datetime(df.index)
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    logger.info(f"[fetch] Got {len(df)} rows for {yf_symbol}")
    return df


# ─── Backtesting Engine ────────────────────────────────────────────────────────

def run_backtest_engine(df: pd.DataFrame, signals: pd.Series, initial_capital: float) -> dict:
    """Simulate trades from signal column and compute performance metrics."""
    capital = initial_capital
    position = 0
    entry_price = 0.0
    trades = []
    equity_curve = []

    for i, (date, row) in enumerate(df.iterrows()):
        price = float(row['Close'])
        signal = int(signals.iloc[i]) if i < len(signals) else 0
        date_str = str(date.date()) if hasattr(date, 'date') else str(date)[:10]

        if signal == 1 and position == 0 and capital > price:
            quantity = int(capital * 0.95 / price)
            if quantity > 0:
                cost = quantity * price
                capital -= cost
                position = quantity
                entry_price = price
                trades.append({'date': date_str, 'type': 'BUY',
                                'price': round(price, 2), 'quantity': quantity, 'pnl': 0})

        elif signal == -1 and position > 0:
            proceeds = position * price
            pnl = proceeds - (position * entry_price)
            capital += proceeds
            trades.append({'date': date_str, 'type': 'SELL',
                            'price': round(price, 2), 'quantity': position, 'pnl': round(pnl, 2)})
            position = 0
            entry_price = 0.0

        current_equity = capital + (position * price)
        equity_curve.append({'date': date_str, 'equity': round(current_equity, 2)})

    # Force-close open position at last bar
    if position > 0:
        last_price = float(df['Close'].iloc[-1])
        pnl = (last_price - entry_price) * position
        capital += position * last_price
        trades.append({'date': str(df.index[-1].date()), 'type': 'SELL',
                        'price': round(last_price, 2), 'quantity': position, 'pnl': round(pnl, 2)})

    final_capital = capital
    total_profit = final_capital - initial_capital
    total_return = (total_profit / initial_capital) * 100

    sell_trades = [t for t in trades if t['type'] == 'SELL']
    winning_trades = [t for t in sell_trades if t['pnl'] > 0]
    losing_trades = [t for t in sell_trades if t['pnl'] <= 0]
    win_rate = (len(winning_trades) / len(sell_trades) * 100) if sell_trades else 0

    equity_values = [e['equity'] for e in equity_curve]
    max_drawdown = 0.0
    if equity_values:
        peak = equity_values[0]
        for val in equity_values:
            if val > peak:
                peak = val
            dd = (peak - val) / peak * 100 if peak > 0 else 0
            if dd > max_drawdown:
                max_drawdown = dd

    returns = []
    for i in range(1, len(equity_values)):
        if equity_values[i - 1] > 0:
            returns.append((equity_values[i] - equity_values[i - 1]) / equity_values[i - 1])

    sharpe_ratio = 0.0
    if returns and np.std(returns) > 0:
        sharpe_ratio = round((np.mean(returns) / np.std(returns)) * math.sqrt(252), 2)

    return {
        'totalProfit': round(total_profit, 2),
        'totalReturn': round(total_return, 2),
        'winRate': round(win_rate, 2),
        'totalTrades': len(sell_trades),
        'winningTrades': len(winning_trades),
        'losingTrades': len(losing_trades),
        'maxDrawdown': round(max_drawdown, 2),
        'sharpeRatio': sharpe_ratio,
        'finalCapital': round(final_capital, 2),
        'initialCapital': round(initial_capital, 2),
        'equityCurve': equity_curve[::max(1, len(equity_curve) // 200)],
        'trades': trades[-50:],
    }


# ─── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "TradeGenesis Python Engine"}


@app.get("/price/{symbol}")
def get_price(symbol: str):
    try:
        yf_symbol = symbol if '.' in symbol else f"{symbol}.NS"
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period="1d")
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No price data for {symbol}")
        price = float(hist['Close'].iloc[-1])
        return {"symbol": symbol, "price": round(price, 2)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/backtest")
def backtest(request: BacktestRequest):
    """Run a full backtest for a trading strategy."""

    # 1. Security check
    is_safe, reason = is_code_safe(request.strategy_code)
    if not is_safe:
        logger.warning(f"[backtest] Code rejected by safety check: {reason}")
        raise HTTPException(status_code=400, detail=f"Unsafe code detected: {reason}")

    # 2. Fetch market data
    try:
        df = fetch_stock_data(request.symbol, request.start_date, request.end_date)
    except Exception as e:
        logger.error(f"[backtest] Data fetch failed: {e}")
        raise HTTPException(status_code=400, detail=f"Data fetch error: {str(e)}")

    if len(df) < 20:
        raise HTTPException(status_code=400,
                            detail="Not enough historical data (need at least 20 bars)")

    # 3. Execute strategy code
    try:
        result_df = execute_strategy(request.strategy_code, df)
    except ImportError as e:
        raise HTTPException(status_code=400, detail=f"Strategy import error: {str(e)}")
    except SyntaxError as e:
        raise HTTPException(status_code=400, detail=f"Strategy syntax error: {str(e)}")
    except Exception as e:
        logger.error(f"[backtest] Strategy execution error:\n{traceback.format_exc()}")
        raise HTTPException(status_code=400,
                            detail=f"Strategy execution error: {type(e).__name__}: {str(e)}")

    # 4. Validate result shape
    if not isinstance(result_df, pd.DataFrame):
        raise HTTPException(status_code=400,
                            detail="run_strategy(df) must return a pandas DataFrame")
    if 'signal' not in result_df.columns:
        raise HTTPException(status_code=400,
                            detail="Returned DataFrame must have a 'signal' column with values 1 (buy), -1 (sell), or 0 (hold)")

    # 5. Run backtest engine
    try:
        results = run_backtest_engine(df, result_df['signal'], request.initial_capital)
        logger.info(f"[backtest] Done — {request.symbol} return={results['totalReturn']}%")
        return results
    except Exception as e:
        logger.error(f"[backtest] Engine error:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Backtest engine error: {str(e)}")


@app.post("/validate")
def validate_strategy(request: StrategyValidateRequest):
    """Validate strategy code without running it."""
    is_safe, reason = is_code_safe(request.code)
    return {"valid": is_safe, "reason": reason}


@app.get("/symbols/search")
def search_symbols(q: str):
    nse_symbols = [
        "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
        "WIPRO", "HCLTECH", "BAJFINANCE", "ADANIENT", "TATAMOTORS",
        "SBIN", "AXISBANK", "KOTAKBANK", "LT", "ASIANPAINT",
        "MARUTI", "SUNPHARMA", "ULTRACEMCO", "TITAN", "NESTLEIND",
        "HINDUNILVR", "BAJAJFINSV", "ITC", "M&M", "POWERGRID",
        "NTPC", "ONGC", "COALINDIA", "JSWSTEEL", "TATASTEEL",
    ]
    filtered = [s for s in nse_symbols if q.upper() in s]
    return {"symbols": filtered[:10]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

