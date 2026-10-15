import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, strategyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Bot, Send, User, Code2, Save, Copy, Check, Sparkles, ChevronDown } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'Create an RSI strategy that buys when RSI < 30 and sells when RSI > 70',
  'Build a MACD crossover strategy for Nifty stocks',
  'Generate a Bollinger Bands mean reversion strategy',
  'Create a moving average crossover strategy using EMA 20 and EMA 50',
  'Build a momentum strategy based on 52-week high breakout',
];

const CodeBlock = ({ code, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stratName, setStratName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    if (!stratName.trim()) return toast.error('Enter strategy name');
    setSaving(true);
    try {
      await onSave(stratName, code);
      toast.success('Strategy saved!');
      setShowSave(false);
      setStratName('');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-brand-border">
      <div className="flex items-center justify-between px-4 py-2 bg-brand-surface border-b border-brand-border">
        <span className="text-xs text-gray-500 font-mono">strategy.py</span>
        <div className="flex gap-2">
          <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-brand-card">
            {copied ? <><Check size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
          <button onClick={() => setShowSave(!showSave)} className="flex items-center gap-1.5 text-xs text-brand-orange hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-orange-500/10">
            <Save size={11} /> Save Strategy
          </button>
        </div>
      </div>
      <pre className="code-block rounded-none border-0 text-xs max-h-80 overflow-auto p-4">
        <code>{code}</code>
      </pre>
      {showSave && (
        <div className="flex gap-2 p-3 bg-brand-surface border-t border-brand-border">
          <input
            value={stratName}
            onChange={e => setStratName(e.target.value)}
            placeholder="Strategy name..."
            className="input-field flex-1 py-2 text-sm"
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
};

const Message = ({ msg, onSaveStrategy }) => {
  const isUser = msg.role === 'user';
  const hasCode = msg.strategyData?.code;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-brand-orange' : 'bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/30'
      }`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-brand-orange" />}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {msg.loading ? (
          <div className="card px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
            <span className="text-gray-500 text-sm">Generating strategy...</span>
          </div>
        ) : (
          <>
            {/* Only show text bubble if there's actual content */}
            {msg.content ? (
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                isUser
                  ? 'bg-brand-orange text-white rounded-tr-sm'
                  : 'card rounded-tl-sm text-gray-200'
              }`}>
                {msg.content}
              </div>
            ) : null}

            {hasCode && (
              <div className="w-full">
                {msg.strategyData.explanation && (
                  <div className="card p-3 text-xs text-gray-400 leading-relaxed mb-2 border-blue-500/20 bg-blue-500/5">
                    <span className="text-blue-400 font-medium block mb-1">Strategy Explanation</span>
                    {msg.strategyData.explanation}
                  </div>
                )}
                <CodeBlock code={msg.strategyData.code} onSave={onSaveStrategy} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {msg.strategyData.indicators?.map(ind => (
                    <span key={ind} className="badge badge-orange text-xs">{ind}</span>
                  ))}
                  {msg.strategyData.riskLevel && (
                    <span className={`badge text-xs ${
                      msg.strategyData.riskLevel === 'Low' ? 'badge-green'
                        : msg.strategyData.riskLevel === 'High' ? 'badge-red' : 'badge-orange'
                    }`}>
                      {msg.strategyData.riskLevel} Risk
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <span className="text-gray-700 text-xs px-1">{msg.time}</span>
      </div>
    </div>
  );
};

export default function AIChatPage() {
  const [messages, setMessages] = useState([{
    id: 1,
    role: 'assistant',
    content: "👋 Hi! I'm TradeGenesis AI. Describe any trading strategy in plain English and I'll convert it to Python code instantly. You can also ask me about technical indicators, risk management, or market concepts.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setShowSuggestions(false);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const loadingMsg = { id: Date.now() + 1, role: 'assistant', loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const res = await aiAPI.chat({
        message: userText,
        conversationHistory: history,
      });

      const { reply, strategyData, updatedHistory } = res.data;
      setHistory(updatedHistory || []);

      // Clean the display text — strip any raw JSON or code blocks that leaked through
      let displayText = (reply || '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```python[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/\{[\s\S]{200,}\}/g, '')   // strip large JSON blobs
        .trim();

      // If we have code, a short confirmation is enough
      if (strategyData?.code && !displayText) {
        displayText = '✅ Strategy generated! Review the code below, then click "Save Strategy" to add it to your library.';
      }

      // If no code and no text, show a fallback
      if (!strategyData?.code && !displayText) {
        displayText = '⚠️ No response generated. Please try again.';
      }

      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: displayText,
          strategyData,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please check your API key and try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      toast.error('AI service error');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const saveStrategy = async (name, code) => {
    await strategyAPI.create({
      name,
      code,
      naturalLanguage: messages.find(m => m.role === 'user')?.content || '',
      explanation: 'AI generated strategy',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
          <Bot size={16} className="text-brand-orange" />
        </div>
        <div>
          <h1 className="font-display font-bold text-white">AI Strategy Assistant</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Powered by Groq AI (Llama 3.3)
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="badge badge-orange">
            <Sparkles size={10} /> AI Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} onSaveStrategy={saveStrategy} />
        ))}

        {showSuggestions && (
          <div className="animate-slide-up">
            <p className="text-gray-600 text-xs font-medium mb-3 flex items-center gap-2">
              <Sparkles size={11} /> Try these prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs text-gray-400 border border-brand-border hover:border-orange-500/40 hover:text-white bg-brand-surface hover:bg-orange-500/5 px-3 py-2 rounded-lg transition-all text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-brand-border bg-brand-surface/30">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Describe your trading strategy... (e.g. 'Buy when RSI crosses below 30')"
              rows={1}
              className="input-field resize-none min-h-[44px] max-h-32 py-3 pr-4 leading-relaxed"
              style={{ height: 'auto' }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
              disabled={loading}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-brand-orange hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={16} className="text-white" />
            }
          </button>
        </div>
        <p className="text-center text-gray-700 text-xs mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}





// import React, { useState, useRef, useEffect } from 'react';
// import { aiAPI, strategyAPI } from '../services/api';
// import toast from 'react-hot-toast';
// import { Bot, Send, User, Code2, Save, Copy, Check, Sparkles, ChevronDown } from 'lucide-react';

// const SUGGESTED_PROMPTS = [
//   'Create an RSI strategy that buys when RSI < 30 and sells when RSI > 70',
//   'Build a MACD crossover strategy for Nifty stocks',
//   'Generate a Bollinger Bands mean reversion strategy',
//   'Create a moving average crossover strategy using EMA 20 and EMA 50',
//   'Build a momentum strategy based on 52-week high breakout',
// ];

// const CodeBlock = ({ code, onSave }) => {
//   const [copied, setCopied] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [stratName, setStratName] = useState('');
//   const [showSave, setShowSave] = useState(false);

//   const copy = () => {
//     navigator.clipboard.writeText(code);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const save = async () => {
//     if (!stratName.trim()) return toast.error('Enter strategy name');
//     setSaving(true);
//     try {
//       await onSave(stratName, code);
//       toast.success('Strategy saved!');
//       setShowSave(false);
//       setStratName('');
//     } catch { toast.error('Failed to save'); }
//     finally { setSaving(false); }
//   };

//   return (
//     <div className="mt-3 rounded-xl overflow-hidden border border-brand-border">
//       <div className="flex items-center justify-between px-4 py-2 bg-brand-surface border-b border-brand-border">
//         <span className="text-xs text-gray-500 font-mono">strategy.py</span>
//         <div className="flex gap-2">
//           <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-brand-card">
//             {copied ? <><Check size={11} className="text-green-400" /> Copied</> : <><Copy size={11} /> Copy</>}
//           </button>
//           <button onClick={() => setShowSave(!showSave)} className="flex items-center gap-1.5 text-xs text-brand-orange hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-orange-500/10">
//             <Save size={11} /> Save Strategy
//           </button>
//         </div>
//       </div>
//       <pre className="code-block rounded-none border-0 text-xs max-h-80 overflow-auto p-4">
//         <code>{code}</code>
//       </pre>
//       {showSave && (
//         <div className="flex gap-2 p-3 bg-brand-surface border-t border-brand-border">
//           <input
//             value={stratName}
//             onChange={e => setStratName(e.target.value)}
//             placeholder="Strategy name..."
//             className="input-field flex-1 py-2 text-sm"
//             onKeyDown={e => e.key === 'Enter' && save()}
//           />
//           <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2">
//             {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// const Message = ({ msg, onSaveStrategy }) => {
//   const isUser = msg.role === 'user';
//   const hasCode = msg.strategyData?.code;

//   return (
//     <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
//       {/* Avatar */}
//       <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
//         isUser ? 'bg-brand-orange' : 'bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/30'
//       }`}>
//         {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-brand-orange" />}
//       </div>

//       {/* Content */}
//       <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
//         {msg.loading ? (
//           <div className="card px-4 py-3 flex items-center gap-2">
//             <div className="flex gap-1">
//               {[0,1,2].map(i => (
//                 <div key={i} className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
//               ))}
//             </div>
//             <span className="text-gray-500 text-sm">Generating strategy...</span>
//           </div>
//         ) : (
//           <>
//             <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
//               isUser
//                 ? 'bg-brand-orange text-white rounded-tr-sm'
//                 : 'card rounded-tl-sm text-gray-200'
//             }`}>
//               {msg.content}
//             </div>

//             {hasCode && (
//               <div className="w-full">
//                 {msg.strategyData.explanation && (
//                   <div className="card p-3 text-xs text-gray-400 leading-relaxed mb-2 border-blue-500/20 bg-blue-500/5">
//                     <span className="text-blue-400 font-medium block mb-1">Strategy Explanation</span>
//                     {msg.strategyData.explanation}
//                   </div>
//                 )}
//                 <CodeBlock code={msg.strategyData.code} onSave={onSaveStrategy} />
//                 <div className="flex gap-2 mt-2 flex-wrap">
//                   {msg.strategyData.indicators?.map(ind => (
//                     <span key={ind} className="badge badge-orange text-xs">{ind}</span>
//                   ))}
//                   {msg.strategyData.riskLevel && (
//                     <span className={`badge text-xs ${
//                       msg.strategyData.riskLevel === 'Low' ? 'badge-green'
//                         : msg.strategyData.riskLevel === 'High' ? 'badge-red' : 'badge-orange'
//                     }`}>
//                       {msg.strategyData.riskLevel} Risk
//                     </span>
//                   )}
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//         <span className="text-gray-700 text-xs px-1">{msg.time}</span>
//       </div>
//     </div>
//   );
// };

// export default function AIChatPage() {
//   const [messages, setMessages] = useState([{
//     id: 1,
//     role: 'assistant',
//     content: "👋 Hi! I'm TradeGenesis AI. Describe any trading strategy in plain English and I'll convert it to Python code instantly. You can also ask me about technical indicators, risk management, or market concepts.",
//     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//   }]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [history, setHistory] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(true);
//   const bottomRef = useRef(null);
//   const inputRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = async (text) => {
//     const userText = text || input.trim();
//     if (!userText || loading) return;

//     setInput('');
//     setShowSuggestions(false);

//     const userMsg = {
//       id: Date.now(),
//       role: 'user',
//       content: userText,
//       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     };
//     const loadingMsg = { id: Date.now() + 1, role: 'assistant', loading: true };

//     setMessages(prev => [...prev, userMsg, loadingMsg]);
//     setLoading(true);

//     try {
//       const res = await aiAPI.chat({
//         message: userText,
//         conversationHistory: history,
//       });

//       const { reply, strategyData, updatedHistory } = res.data;
//       setHistory(updatedHistory || []);

//       setMessages(prev => [
//         ...prev.filter(m => !m.loading),
//         {
//           id: Date.now() + 2,
//           role: 'assistant',
//           content: reply.replace(/```json[\s\S]*?```/g, '').replace(/```python[\s\S]*?```/g, '').trim() || '✅ Strategy generated above.',
//           strategyData,
//           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         }
//       ]);
//     } catch (err) {
//       setMessages(prev => [
//         ...prev.filter(m => !m.loading),
//         {
//           id: Date.now() + 2,
//           role: 'assistant',
//           content: '❌ Sorry, I encountered an error. Please check your API key and try again.',
//           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         }
//       ]);
//       toast.error('AI service error');
//     } finally {
//       setLoading(false);
//       inputRef.current?.focus();
//     }
//   };

//   const saveStrategy = async (name, code) => {
//     await strategyAPI.create({
//       name,
//       code,
//       naturalLanguage: messages.find(m => m.role === 'user')?.content || '',
//       explanation: 'AI generated strategy',
//     });
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* Header */}
//       <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-border flex-shrink-0">
//         <div className="w-9 h-9 bg-gradient-to-br from-orange-500/30 to-amber-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
//           <Bot size={16} className="text-brand-orange" />
//         </div>
//         <div>
//           <h1 className="font-display font-bold text-white">AI Strategy Assistant</h1>
//           <div className="flex items-center gap-1.5 text-xs text-gray-500">
//             <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
//             Powered by Claude AI
//           </div>
//         </div>
//         <div className="ml-auto flex items-center gap-2">
//           <span className="badge badge-orange">
//             <Sparkles size={10} /> AI Active
//           </span>
//         </div>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
//         {messages.map(msg => (
//           <Message key={msg.id} msg={msg} onSaveStrategy={saveStrategy} />
//         ))}

//         {/* Suggestions */}
//         {showSuggestions && (
//           <div className="animate-slide-up">
//             <p className="text-gray-600 text-xs font-medium mb-3 flex items-center gap-2">
//               <Sparkles size={11} /> Try these prompts
//             </p>
//             <div className="flex flex-wrap gap-2">
//               {SUGGESTED_PROMPTS.map(p => (
//                 <button
//                   key={p}
//                   onClick={() => sendMessage(p)}
//                   className="text-xs text-gray-400 border border-brand-border hover:border-orange-500/40 hover:text-white bg-brand-surface hover:bg-orange-500/5 px-3 py-2 rounded-lg transition-all text-left"
//                 >
//                   {p}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         <div ref={bottomRef} />
//       </div>

//       {/* Input */}
//       <div className="flex-shrink-0 px-6 py-4 border-t border-brand-border bg-brand-surface/30">
//         <div className="flex gap-3 items-end max-w-4xl mx-auto">
//           <div className="flex-1 relative">
//             <textarea
//               ref={inputRef}
//               value={input}
//               onChange={e => setInput(e.target.value)}
//               onKeyDown={e => {
//                 if (e.key === 'Enter' && !e.shiftKey) {
//                   e.preventDefault();
//                   sendMessage();
//                 }
//               }}
//               placeholder="Describe your trading strategy... (e.g. 'Buy when RSI crosses below 30')"
//               rows={1}
//               className="input-field resize-none min-h-[44px] max-h-32 py-3 pr-4 leading-relaxed"
//               style={{ height: 'auto' }}
//               onInput={e => {
//                 e.target.style.height = 'auto';
//                 e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
//               }}
//               disabled={loading}
//             />
//           </div>
//           <button
//             onClick={() => sendMessage()}
//             disabled={!input.trim() || loading}
//             className="w-11 h-11 bg-brand-orange hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
//           >
//             {loading
//               ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               : <Send size={16} className="text-white" />
//             }
//           </button>
//         </div>
//         <p className="text-center text-gray-700 text-xs mt-2">Press Enter to send · Shift+Enter for new line</p>
//       </div>
//     </div>
//   );
// }
