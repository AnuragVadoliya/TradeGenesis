import React, { useState, useEffect } from 'react';
import { strategyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  Code2, Plus, Trash2, Edit2, Save, X, Bot,
  Clock, Tag, ChevronDown, ChevronUp, Copy, Check, MessageSquare
} from 'lucide-react';

const TIMEFRAMES = ['1m','5m','15m','30m','1h','1d','1w'];
const ASSET_CLASSES = ['equity','futures','options','crypto'];

const StrategyCard = ({ strategy, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(strategy.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card overflow-hidden hover:border-orange-500/20 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Code2 size={16} className="text-brand-orange" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-white truncate">{strategy.name}</h3>
              {strategy.description && (
                <p className="text-gray-500 text-xs mt-0.5 truncate">{strategy.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => onEdit(strategy)} className="p-1.5 text-gray-500 hover:text-white hover:bg-brand-surface rounded-lg transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={copy} className="p-1.5 text-gray-500 hover:text-white hover:bg-brand-surface rounded-lg transition-colors">
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            </button>
            <button onClick={() => onDelete(strategy._id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Natural Language Preview */}
        {strategy.naturalLanguage && (
          <div className="mt-3 flex items-start gap-2 bg-brand-surface rounded-lg px-3 py-2 border border-brand-border">
            <MessageSquare size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{strategy.naturalLanguage}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="badge badge-orange">{strategy.timeframe}</span>
          <span className="badge badge-blue">{strategy.assetClass}</span>
          {strategy.indicators?.slice(0,3).map(ind => (
            <span key={ind} className="badge bg-brand-surface text-gray-400 border border-brand-border">{ind}</span>
          ))}
          <div className="flex items-center gap-1 text-gray-600 text-xs ml-auto">
            <Clock size={10} />
            {new Date(strategy.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Expandable code */}
      <div className="border-t border-brand-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-gray-500 hover:text-white text-xs transition-colors hover:bg-brand-surface"
        >
          <span className="font-mono">View code</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {expanded && (
          <pre className="code-block rounded-none border-0 border-t border-brand-border text-xs max-h-64 overflow-auto p-4">
            <code>{strategy.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

const StrategyForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || {
    name: '', description: '', naturalLanguage: '', code: '', explanation: '',
    timeframe: '1d', assetClass: 'equity', tags: ''
  });
  const [saving, setSaving] = useState(false);

  // When editing, normalize tags array back to comma string
  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        naturalLanguage: initial.naturalLanguage || '',
        tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : (initial.tags || '')
      });
    }
  }, [initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) return toast.error('Name and code are required');
    if (!form.naturalLanguage.trim()) return toast.error('Please describe your strategy in plain English');
    setSaving(true);
    try {
      await onSave({
        ...form,
        naturalLanguage: form.naturalLanguage.trim(),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="card p-6 border-orange-500/20 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-white">{initial ? 'Edit Strategy' : 'New Strategy'}</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-white"><X size={16} /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name & Description */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Strategy Name *</label>
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="RSI Reversal Strategy"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Description</label>
            <input
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Brief description..."
              className="input-field"
            />
          </div>
        </div>

        {/* Natural Language Description */}
        <div>
          <label className="text-gray-400 text-xs mb-1.5 block flex items-center gap-1.5">
            <MessageSquare size={11} className="text-orange-400" />
            Strategy Logic in Plain English *
          </label>
          <textarea
            value={form.naturalLanguage}
            onChange={e => setForm({...form, naturalLanguage: e.target.value})}
            placeholder="e.g. Buy when RSI crosses above 30 (oversold) and the 50-day moving average is above the 200-day moving average. Sell when RSI crosses below 70 (overbought) or price drops 2% below entry..."
            rows={3}
            className="input-field text-sm leading-relaxed resize-none"
            required
          />
          <p className="text-gray-600 text-xs mt-1">Describe when to buy, sell, and any conditions in simple language.</p>
        </div>

        {/* Timeframe & Asset Class */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Timeframe</label>
            <select
              value={form.timeframe}
              onChange={e => setForm({...form, timeframe: e.target.value})}
              className="input-field"
            >
              {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Asset Class</label>
            <select
              value={form.assetClass}
              onChange={e => setForm({...form, assetClass: e.target.value})}
              className="input-field"
            >
              {ASSET_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Python Code */}
        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">
            Python Code * <span className="text-gray-600">(must define run_strategy(df) function)</span>
          </label>
          <textarea
            value={form.code}
            onChange={e => setForm({...form, code: e.target.value})}
            placeholder={`import pandas as pd\nimport numpy as np\n\ndef run_strategy(df):\n    # Your strategy logic here\n    df['signal'] = 0\n    return df`}
            rows={10}
            className="input-field font-mono text-xs leading-relaxed"
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-gray-400 text-xs mb-1.5 block">Tags <span className="text-gray-600">(comma separated)</span></label>
          <input
            value={form.tags}
            onChange={e => setForm({...form, tags: e.target.value})}
            placeholder="RSI, momentum, reversal"
            className="input-field"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={14} />
            }
            {initial ? 'Update' : 'Save'} Strategy
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default function StrategyBuilderPage() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStrategies(); }, []);

  const fetchStrategies = async () => {
    try {
      const res = await strategyAPI.getAll();
      setStrategies(res.data.strategies || []);
    } catch { toast.error('Failed to load strategies'); }
    finally { setLoading(false); }
  };

  const handleSave = async (data) => {
    try {
      if (editingStrategy) {
        await strategyAPI.update(editingStrategy._id, data);
        toast.success('Strategy updated!');
      } else {
        await strategyAPI.create(data);
        toast.success('Strategy saved!');
      }
      setShowForm(false);
      setEditingStrategy(null);
      fetchStrategies();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this strategy?')) return;
    try {
      await strategyAPI.delete(id);
      toast.success('Strategy deleted');
      setStrategies(prev => prev.filter(s => s._id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const handleEdit = (strategy) => {
    setEditingStrategy(strategy);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = strategies.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase()) ||
    s.naturalLanguage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Strategy Builder</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your algorithmic trading strategies</p>
        </div>
        <div className="flex gap-3">
          <Link to="/ai-chat" className="btn-secondary flex items-center gap-2 text-sm">
            <Bot size={14} /> AI Generate
          </Link>
          <button
            onClick={() => { setShowForm(true); setEditingStrategy(null); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> New Strategy
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <StrategyForm
          initial={editingStrategy}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingStrategy(null); }}
        />
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search strategies..."
          className="input-field max-w-xs"
        />
        <span className="text-gray-600 text-sm">{filtered.length} strategies</span>
      </div>

      {/* Strategies grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="shimmer h-36 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Code2 size={40} className="text-gray-700 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-400 mb-2">No strategies yet</h3>
          <p className="text-gray-600 text-sm mb-5">
            {search ? 'No strategies match your search.' : 'Create your first strategy manually or use the AI assistant.'}
          </p>
          {!search && (
            <div className="flex justify-center gap-3">
              <Link to="/ai-chat" className="btn-primary text-sm">Generate with AI</Link>
              <button onClick={() => setShowForm(true)} className="btn-secondary text-sm">Write Manually</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(strategy => (
            <StrategyCard
              key={strategy._id}
              strategy={strategy}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}





// import React, { useState, useEffect } from 'react';
// import { strategyAPI } from '../services/api';
// import toast from 'react-hot-toast';
// import { Link } from 'react-router-dom';
// import {
//   Code2, Plus, Trash2, Edit2, Save, X, Bot,
//   Clock, Tag, ChevronDown, ChevronUp, Copy, Check
// } from 'lucide-react';

// const TIMEFRAMES = ['1m','5m','15m','30m','1h','1d','1w'];
// const ASSET_CLASSES = ['equity','futures','options','crypto'];

// const StrategyCard = ({ strategy, onDelete, onEdit }) => {
//   const [expanded, setExpanded] = useState(false);
//   const [copied, setCopied] = useState(false);

//   const copy = () => {
//     navigator.clipboard.writeText(strategy.code);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <div className="card overflow-hidden hover:border-orange-500/20 transition-all">
//       <div className="p-5">
//         <div className="flex items-start justify-between gap-3">
//           <div className="flex items-center gap-3 min-w-0">
//             <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
//               <Code2 size={16} className="text-brand-orange" />
//             </div>
//             <div className="min-w-0">
//               <h3 className="font-display font-semibold text-white truncate">{strategy.name}</h3>
//               {strategy.description && (
//                 <p className="text-gray-500 text-xs mt-0.5 truncate">{strategy.description}</p>
//               )}
//             </div>
//           </div>
//           <div className="flex items-center gap-1.5 flex-shrink-0">
//             <button onClick={() => onEdit(strategy)} className="p-1.5 text-gray-500 hover:text-white hover:bg-brand-surface rounded-lg transition-colors">
//               <Edit2 size={13} />
//             </button>
//             <button onClick={copy} className="p-1.5 text-gray-500 hover:text-white hover:bg-brand-surface rounded-lg transition-colors">
//               {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
//             </button>
//             <button onClick={() => onDelete(strategy._id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
//               <Trash2 size={13} />
//             </button>
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-2 mt-4">
//           <span className="badge badge-orange">{strategy.timeframe}</span>
//           <span className="badge badge-blue">{strategy.assetClass}</span>
//           {strategy.indicators?.slice(0,3).map(ind => (
//             <span key={ind} className="badge bg-brand-surface text-gray-400 border border-brand-border">{ind}</span>
//           ))}
//           <div className="flex items-center gap-1 text-gray-600 text-xs ml-auto">
//             <Clock size={10} />
//             {new Date(strategy.createdAt).toLocaleDateString()}
//           </div>
//         </div>
//       </div>

//       {/* Expandable code */}
//       <div className="border-t border-brand-border">
//         <button
//           onClick={() => setExpanded(!expanded)}
//           className="w-full flex items-center justify-between px-5 py-2.5 text-gray-500 hover:text-white text-xs transition-colors hover:bg-brand-surface"
//         >
//           <span className="font-mono">View code</span>
//           {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
//         </button>
//         {expanded && (
//           <pre className="code-block rounded-none border-0 border-t border-brand-border text-xs max-h-64 overflow-auto p-4">
//             <code>{strategy.code}</code>
//           </pre>
//         )}
//       </div>
//     </div>
//   );
// };

// const StrategyForm = ({ initial, onSave, onCancel }) => {
//   const [form, setForm] = useState(initial || {
//     name: '', description: '', code: '', explanation: '',
//     timeframe: '1d', assetClass: 'equity', tags: ''
//   });
//   const [saving, setSaving] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.name || !form.code) return toast.error('Name and code are required');
//     setSaving(true);
//     try {
//       await onSave({
//         ...form,
//         tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
//       });
//     } finally { setSaving(false); }
//   };

//   return (
//     <div className="card p-6 border-orange-500/20 animate-slide-up">
//       <div className="flex items-center justify-between mb-5">
//         <h3 className="font-display font-semibold text-white">{initial ? 'Edit Strategy' : 'New Strategy'}</h3>
//         <button onClick={onCancel} className="text-gray-500 hover:text-white"><X size={16} /></button>
//       </div>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div className="grid sm:grid-cols-2 gap-4">
//           <div>
//             <label className="text-gray-400 text-xs mb-1.5 block">Strategy Name *</label>
//             <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
//               placeholder="RSI Reversal Strategy" className="input-field" required />
//           </div>
//           <div>
//             <label className="text-gray-400 text-xs mb-1.5 block">Description</label>
//             <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
//               placeholder="Brief description..." className="input-field" />
//           </div>
//         </div>

//         <div className="grid sm:grid-cols-2 gap-4">
//           <div>
//             <label className="text-gray-400 text-xs mb-1.5 block">Timeframe</label>
//             <select value={form.timeframe} onChange={e => setForm({...form, timeframe: e.target.value})}
//               className="input-field">
//               {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
//             </select>
//           </div>
//           <div>
//             <label className="text-gray-400 text-xs mb-1.5 block">Asset Class</label>
//             <select value={form.assetClass} onChange={e => setForm({...form, assetClass: e.target.value})}
//               className="input-field">
//               {ASSET_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}
//             </select>
//           </div>
//         </div>

//         <div>
//           <label className="text-gray-400 text-xs mb-1.5 block">
//             Python Code * <span className="text-gray-600">(must define run_strategy(df) function)</span>
//           </label>
//           <textarea value={form.code} onChange={e => setForm({...form, code: e.target.value})}
//             placeholder={`import pandas as pd\nimport numpy as np\n\ndef run_strategy(df):\n    # Your strategy logic here\n    df['signal'] = 0\n    return df`}
//             rows={10} className="input-field font-mono text-xs leading-relaxed" required />
//         </div>

//         <div>
//           <label className="text-gray-400 text-xs mb-1.5 block">Tags (comma separated)</label>
//           <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
//             placeholder="RSI, momentum, reversal" className="input-field" />
//         </div>

//         <div className="flex gap-3 pt-2">
//           <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
//             {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
//             {initial ? 'Update' : 'Save'} Strategy
//           </button>
//           <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default function StrategyBuilderPage() {
//   const [strategies, setStrategies] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingStrategy, setEditingStrategy] = useState(null);
//   const [search, setSearch] = useState('');

//   useEffect(() => { fetchStrategies(); }, []);

//   const fetchStrategies = async () => {
//     try {
//       const res = await strategyAPI.getAll();
//       setStrategies(res.data.strategies || []);
//     } catch { toast.error('Failed to load strategies'); }
//     finally { setLoading(false); }
//   };

//   const handleSave = async (data) => {
//     try {
//       if (editingStrategy) {
//         await strategyAPI.update(editingStrategy._id, data);
//         toast.success('Strategy updated!');
//       } else {
//         await strategyAPI.create(data);
//         toast.success('Strategy saved!');
//       }
//       setShowForm(false);
//       setEditingStrategy(null);
//       fetchStrategies();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Save failed');
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm('Delete this strategy?')) return;
//     try {
//       await strategyAPI.delete(id);
//       toast.success('Strategy deleted');
//       setStrategies(prev => prev.filter(s => s._id !== id));
//     } catch { toast.error('Delete failed'); }
//   };

//   const handleEdit = (strategy) => {
//     setEditingStrategy(strategy);
//     setShowForm(true);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const filtered = strategies.filter(s =>
//     s.name.toLowerCase().includes(search.toLowerCase()) ||
//     s.description?.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="p-6 max-w-5xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex flex-wrap items-center justify-between gap-4">
//         <div>
//           <h1 className="font-display font-bold text-2xl text-white">Strategy Builder</h1>
//           <p className="text-gray-500 text-sm mt-0.5">Manage your algorithmic trading strategies</p>
//         </div>
//         <div className="flex gap-3">
//           <Link to="/ai-chat" className="btn-secondary flex items-center gap-2 text-sm">
//             <Bot size={14} /> AI Generate
//           </Link>
//           <button onClick={() => { setShowForm(true); setEditingStrategy(null); }} className="btn-primary flex items-center gap-2 text-sm">
//             <Plus size={14} /> New Strategy
//           </button>
//         </div>
//       </div>

//       {/* Form */}
//       {showForm && (
//         <StrategyForm
//           initial={editingStrategy}
//           onSave={handleSave}
//           onCancel={() => { setShowForm(false); setEditingStrategy(null); }}
//         />
//       )}

//       {/* Search */}
//       <div className="flex items-center gap-3">
//         <input
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//           placeholder="Search strategies..."
//           className="input-field max-w-xs"
//         />
//         <span className="text-gray-600 text-sm">{filtered.length} strategies</span>
//       </div>

//       {/* Strategies grid */}
//       {loading ? (
//         <div className="grid gap-4">
//           {[1,2,3].map(i => <div key={i} className="shimmer h-36 rounded-xl" />)}
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="card p-16 text-center">
//           <Code2 size={40} className="text-gray-700 mx-auto mb-4" />
//           <h3 className="font-display font-semibold text-gray-400 mb-2">No strategies yet</h3>
//           <p className="text-gray-600 text-sm mb-5">
//             {search ? 'No strategies match your search.' : 'Create your first strategy manually or use the AI assistant.'}
//           </p>
//           {!search && (
//             <div className="flex justify-center gap-3">
//               <Link to="/ai-chat" className="btn-primary text-sm">Generate with AI</Link>
//               <button onClick={() => setShowForm(true)} className="btn-secondary text-sm">Write Manually</button>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="grid gap-4">
//           {filtered.map(strategy => (
//             <StrategyCard
//               key={strategy._id}
//               strategy={strategy}
//               onDelete={handleDelete}
//               onEdit={handleEdit}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
