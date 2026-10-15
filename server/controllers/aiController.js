const axios = require('axios');

// ─── Groq config ───────────────────────────────────────────────────────────────
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';

// ─── Raw Groq call ─────────────────────────────────────────────────────────────
async function callGroq(messages, maxTokens = 4096) {
  const response = await axios.post(GROQ_URL, {
    model: GROQ_MODEL,
    max_tokens: maxTokens,
    temperature: 0.1,          // low temp = more deterministic / follows instructions better
    messages
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });
  return response.data.choices[0].message.content;
}

// ─── JSON extractor — tries multiple patterns ──────────────────────────────────
function extractJSON(text) {
  // 1. bare JSON object
  const bare = text.match(/\{[\s\S]*\}/);
  if (bare) {
    try { return JSON.parse(bare[0]); } catch (_) {}
  }
  // 2. ```json ... ```
  const jsonBlock = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlock) {
    try { return JSON.parse(jsonBlock[1]); } catch (_) {}
  }
  // 3. ``` ... ```
  const block = text.match(/```\s*([\s\S]*?)\s*```/);
  if (block) {
    try { return JSON.parse(block[1]); } catch (_) {}
  }
  return null;
}

// ─── Extract Python code block if JSON failed ──────────────────────────────────
function extractPythonCode(text) {
  const m = text.match(/```python\s*([\s\S]*?)\s*```/);
  return m ? m[1].trim() : null;
}

function buildStrategyResult(raw, prompt) {
  let parsed = extractJSON(raw);

  if (!parsed) {
    const code = extractPythonCode(raw);
    parsed = {
      code: code || buildFallbackCode(prompt),
      explanation: raw.replace(/```[\s\S]*?```/g, '').trim().slice(0, 300),
      indicators: [],
      riskLevel: 'Medium',
      timeframe: '1d',
      suggestedStocks: ['RELIANCE', 'TCS']
    };
  }

  if (!parsed.code) {
    parsed.code = buildFallbackCode(prompt);
  }

  return parsed;
}

// ─── System prompt for strategy generation ─────────────────────────────────────
const STRATEGY_SYSTEM = `You are a Python trading strategy code generator.
You MUST ONLY respond with a single valid JSON object. No explanation before or after. No markdown. Just the raw JSON.

JSON format (fill in all fields):
{"code":"<python code here>","explanation":"<one sentence>","indicators":["<ind1>"],"riskLevel":"Low","timeframe":"1d","suggestedStocks":["RELIANCE","TCS"]}

Python code rules (CRITICAL — violation causes errors):
- Function signature: def run_strategy(df):
- df has columns: Open, High, Low, Close, Volume (case-sensitive, capital first letter)
- ONLY import pandas as pd and numpy as np — no other imports allowed
- First line inside function: df['signal'] = 0
- Last line: return df
- Use df.loc[] for assignments, never chained indexing
- No datetime, no df.index access, no reset_index(), no set_index()
- Signals: 1=buy, -1=sell, 0=hold

Example of correct output:
{"code":"import pandas as pd\nimport numpy as np\n\ndef run_strategy(df):\n    df['signal'] = 0\n    df['ema20'] = df['Close'].ewm(span=20, adjust=False).mean()\n    df['ema50'] = df['Close'].ewm(span=50, adjust=False).mean()\n    df.loc[df['ema20'] > df['ema50'], 'signal'] = 1\n    df.loc[df['ema20'] < df['ema50'], 'signal'] = -1\n    return df","explanation":"Buys when EMA 20 crosses above EMA 50 and sells when it crosses below.","indicators":["EMA20","EMA50"],"riskLevel":"Medium","timeframe":"1d","suggestedStocks":["RELIANCE","TCS","INFY"]}`;

// ─── System prompt for general chat ───────────────────────────────────────────
const CHAT_SYSTEM = `You are TradeGenesis AI, an expert in Indian stock markets (NSE/BSE) and algorithmic trading.

Help users with:
- Trading strategy concepts and indicators (RSI, MACD, EMA, Bollinger Bands, ATR, etc.)
- Indian market context (Nifty, Sensex, NSE/BSE, INR)
- Risk management and position sizing

When the user asks to CREATE or GENERATE or BUILD or CODE a strategy, you MUST respond ONLY with this exact JSON (no extra text):
{"code":"import pandas as pd\nimport numpy as np\n\ndef run_strategy(df):\n    df['signal'] = 0\n    # your logic here\n    return df","explanation":"strategy explanation","indicators":["ind1"],"riskLevel":"Low|Medium|High","timeframe":"1d","suggestedStocks":["RELIANCE"]}

For general questions (not code requests), respond in plain conversational text.`;

// ─── Generate Strategy endpoint ────────────────────────────────────────────────
const generateStrategy = async (req, res) => {
  try {
    const { prompt, conversationHistory = [] } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Force JSON by making the user message very explicit
    const forcedPrompt = `Generate a Python trading strategy for: ${prompt}

IMPORTANT: Respond ONLY with the JSON object. No text before or after.`;

    const messages = [
      { role: 'system', content: STRATEGY_SYSTEM },
      ...conversationHistory,
      { role: 'user', content: forcedPrompt }
    ];

    const raw = await callGroq(messages, 4096);
    console.log('[generateStrategy] raw response preview:', raw.slice(0, 200));

    const parsed = buildStrategyResult(raw, prompt);

    res.json({ success: true, strategy: parsed, assistantMessage: raw });

  } catch (err) {
    console.error('AI generate error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to generate strategy',
      details: err.response?.data?.error?.message || err.message
    });
  }
};

// ─── Chat endpoint ─────────────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Detect if user is asking for code generation
    const isCodeRequest = /(create|generate|build|write|make|code|python|strategy for|give me)/i.test(message);

    const systemPrompt = isCodeRequest ? STRATEGY_SYSTEM : CHAT_SYSTEM;

    const userMessage = isCodeRequest
      ? `Generate a Python trading strategy for: ${message}\nRespond ONLY with the JSON object.`
      : message;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const raw = await callGroq(messages, 2048);
    console.log('[chat] raw response preview:', raw.slice(0, 200));

    // Try to extract JSON (strategy data)
    let strategyData = null;
    let reply = raw;

    const parsed = extractJSON(raw);
    if (parsed && parsed.code) {
      strategyData = parsed;
      // Clean the reply shown in chat — remove raw JSON blob
      reply = parsed.explanation
        ? `✅ Strategy generated! ${parsed.explanation}`
        : '✅ Strategy generated! Click "Save Strategy" to add it to your library.';
    } else {
      // Try python block
      const code = extractPythonCode(raw);
      if (code) {
        strategyData = {
          code,
          explanation: raw.replace(/```[\s\S]*?```/g, '').trim().slice(0, 300),
          indicators: [],
          riskLevel: 'Medium',
          timeframe: '1d',
          suggestedStocks: ['RELIANCE', 'TCS']
        };
        reply = strategyData.explanation || '✅ Here is your strategy code:';
      }
    }

    // Strip raw JSON from display reply if it leaked through
    reply = reply.replace(/\{[\s\S]{100,}\}/g, '').trim();
    if (!reply) reply = strategyData ? '✅ Strategy ready above.' : '⚠️ No response generated.';

    res.json({
      success: true,
      reply,
      strategyData,
      updatedHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: raw }
      ]
    });

  } catch (err) {
    console.error('AI chat error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'AI service unavailable',
      details: err.response?.data?.error?.message || err.message
    });
  }
};

// ─── Fallback code if AI completely fails to return valid code ─────────────────
function buildFallbackCode(prompt) {
  return `import pandas as pd
import numpy as np

def run_strategy(df):
    """Strategy based on: ${prompt.slice(0, 60)}"""
    df['signal'] = 0

    # EMA crossover as default fallback
    df['ema20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['ema50'] = df['Close'].ewm(span=50, adjust=False).mean()

    df.loc[df['ema20'] > df['ema50'], 'signal'] = 1
    df.loc[df['ema20'] < df['ema50'], 'signal'] = -1

    return df`;
}

const chatHandler = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const isCodeRequest = /(create|generate|build|write|make|code|python|strategy for|give me)/i.test(message);

    let raw;
    let strategyData = null;
    let reply = '';

    if (isCodeRequest) {
      const forcedPrompt = `Generate a Python trading strategy for: ${message}

IMPORTANT: Respond ONLY with the JSON object. No text before or after.`;

      const messages = [
        { role: 'system', content: STRATEGY_SYSTEM },
        ...conversationHistory,
        { role: 'user', content: forcedPrompt }
      ];

      raw = await callGroq(messages, 4096);
      console.log('[chat][strategy] raw response preview:', raw.slice(0, 200));

      strategyData = buildStrategyResult(raw, message);
      reply = strategyData.explanation
        ? `Strategy generated! ${strategyData.explanation}`
        : 'Strategy generated! Review the code below, then click "Save Strategy" to add it to your library.';
    } else {
      const messages = [
        { role: 'system', content: CHAT_SYSTEM },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      raw = await callGroq(messages, 2048);
      console.log('[chat][general] raw response preview:', raw.slice(0, 200));
      reply = raw;
    }

    reply = reply.replace(/\{[\s\S]{100,}\}/g, '').trim();
    if (!reply) reply = strategyData ? 'Strategy ready above.' : 'No response generated.';

    res.json({
      success: true,
      reply,
      strategyData,
      updatedHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: raw }
      ]
    });

  } catch (err) {
    console.error('AI chat error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'AI service unavailable',
      details: err.response?.data?.error?.message || err.message
    });
  }
};

module.exports = { generateStrategy, chat: chatHandler };








