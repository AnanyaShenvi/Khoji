import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, BookOpen, Search, Briefcase, FileText, CheckCircle,
  Clock, Plus, LogOut, ChevronRight, ChevronDown, Settings, Users,
  Map, Lightbulb, Play, Target, CheckSquare, Zap, BarChart3, Scissors,
  PenTool, MonitorSmartphone, Link as LinkIcon, Camera, Bookmark,
  UserPlus, Copy, Shield, Eye, Edit3, Crown, Folder, FolderPlus,
  TrendingUp, AlertTriangle, Layers, Calendar, DollarSign, Hash,
  MessageSquare, X, Check, Home, Key, Share2, Globe, Store, Sparkles,
  ShieldCheck, Compass, PieChart, GitBranch, Flag, Palette
} from 'lucide-react';

// The Khoji Design Bible dictates a tactile, editorial, magazine-like feel.
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  
  :root {
    --color-paper: #FDFBF7;
    --color-charcoal: #1C1C1C;
    --color-editorial-blue: #1E293B;
    --color-creative-orange: #E65C00;
    --color-warm-yellow: #F2A900;
    --color-forest-green: #2E7D32;
    --color-editorial-red: #D32F2F;
  }

  body {
    background-color: var(--color-paper);
    color: var(--color-charcoal);
    font-family: 'Inter', sans-serif;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  }

  .font-editorial { font-family: 'Playfair Display', serif; }
  .font-mono-editorial { font-family: 'JetBrains Mono', monospace; }

  .shadow-editorial { box-shadow: 6px 6px 0px 0px var(--color-charcoal); }
  .shadow-editorial-hover:hover { box-shadow: 8px 8px 0px 0px var(--color-charcoal); transform: translate(-2px, -2px); }
  .shadow-editorial-sm { box-shadow: 3px 3px 0px 0px var(--color-charcoal); }

  .masking-tape {
    position: absolute;
    background-color: rgba(242, 169, 0, 0.6);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    backdrop-filter: blur(2px);
    z-index: 10;
  }

  @keyframes growBar { from { width: 0%; } }
  .animate-grow-bar { animation: growBar 1s ease-out forwards; }

  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-slide-up { animation: fadeSlideUp 0.45s ease-out forwards; }

  .stagger-1 { animation-delay: 0.05s; }
  .stagger-2 { animation-delay: 0.1s; }
  .stagger-3 { animation-delay: 0.15s; }
  .stagger-4 { animation-delay: 0.2s; }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: var(--color-paper); }
  ::-webkit-scrollbar-thumb { background: var(--color-charcoal); border: 2px solid var(--color-paper); }
`;

// ---------------------------------------------------------------------------
// LOCAL PERSISTENCE LAYER (simulates Khoji's backend for this front-end build)
// ---------------------------------------------------------------------------
const LS_PROJECTS_KEY = 'khoji_projects_v1';
const LS_INVITES_KEY = 'khoji_invite_codes_v1';

const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const safeParse = (raw, fallback) => {
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
};

const loadProjects = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(LS_PROJECTS_KEY), []);
};

const persistProjects = (projects) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
};

const loadInviteMap = () => {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem(LS_INVITES_KEY), {});
};

const persistInviteMap = (map) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_INVITES_KEY, JSON.stringify(map));
};

const ROLE_META = {
  Owner: { icon: Crown, color: '#E65C00', desc: 'Full control, including billing and deleting the project.' },
  Admin: { icon: ShieldCheck, color: '#1E293B', desc: 'Can manage members, edit everything, and regenerate invites.' },
  Editor: { icon: Edit3, color: '#2E7D32', desc: 'Can edit questionnaire answers, tasks, and blueprint notes.' },
  Viewer: { icon: Eye, color: '#6B7280', desc: 'Read-only access to the blueprint and dashboard.' },
};

// ---------------------------------------------------------------------------
// BASE EDITORIAL UI ATOMS (preserved from the original design system)
// ---------------------------------------------------------------------------
const Button = ({ children, variant = 'primary', className = '', onClick, icon: Icon, iconLeft, disabled = false, type = 'button' }) => {
  const baseStyle = "inline-flex items-center justify-center px-6 py-3 font-bold transition-all duration-200 border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#1C1C1C] text-[#FDFBF7] hover:bg-[#333] shadow-[4px_4px_0px_0px_#E65C00] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#E65C00]",
    secondary: "bg-[#FDFBF7] border-2 border-[#1C1C1C] text-[#1C1C1C] shadow-[4px_4px_0px_0px_#1C1C1C] hover:bg-gray-50 active:translate-y-1 active:shadow-[0px_0px_0px_0px_#1C1C1C]",
    tertiary: "text-[#1C1C1C] hover:text-[#E65C00] underline underline-offset-4 decoration-2",
    ghost: "text-gray-500 hover:text-[#1C1C1C] hover:bg-gray-100",
    danger: "bg-white border-2 border-[#D32F2F] text-[#D32F2F] shadow-[4px_4px_0px_0px_#D32F2F] hover:bg-[#D32F2F]/5 active:translate-y-1 active:shadow-[0px_0px_0px_0px_#D32F2F]",
  };

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {iconLeft && <iconLeft.icon className="mr-2 w-5 h-5" />}
      {children}
      {Icon && <Icon className="ml-2 w-5 h-5" />}
    </button>
  );
};

const PaperCard = ({ children, className = '', onClick, tape = false }) => (
  <div
    onClick={onClick}
    className={`relative bg-white border-2 border-[#1C1C1C] p-6 shadow-editorial transition-transform ${onClick ? 'cursor-pointer shadow-editorial-hover' : ''} ${className}`}
  >
    {tape && <div className="masking-tape w-24 h-6 -top-3 left-1/2 transform -translate-x-1/2 -rotate-2" />}
    {children}
  </div>
);

const Badge = ({ children, tone = 'dark', className = '' }) => {
  const tones = {
    dark: 'bg-[#1C1C1C] text-white',
    orange: 'bg-[#E65C00] text-white',
    yellow: 'bg-[#F2A900] text-[#1C1C1C]',
    green: 'bg-[#2E7D32] text-white',
    red: 'bg-[#D32F2F] text-white',
    outline: 'bg-transparent text-[#1C1C1C] border-2 border-[#1C1C1C]',
    subtle: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-block text-[10px] font-bold px-2 py-1 uppercase tracking-widest ${tones[tone]} ${className}`}>{children}</span>;
};

const ExplainWhy = ({ summary, explanation, psychology, impact }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-4 border-2 border-[#1C1C1C] bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-[#1C1C1C] hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center"><Lightbulb className="w-4 h-4 mr-2 text-[#F2A900]" /> {summary || 'Explain Why'}</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-5 py-4 border-t-2 border-[#1C1C1C] bg-[#FDFBF7] text-sm text-gray-800 space-y-4">
          <div>
            <span className="font-bold uppercase tracking-widest text-xs text-[#E65C00] block mb-1">The Reasoning</span>
            <p className="leading-relaxed">{explanation}</p>
          </div>
          {psychology && (
            <div>
              <span className="font-bold uppercase tracking-widest text-xs text-[#1E293B] block mb-1">Consumer Psychology</span>
              <p className="leading-relaxed">{psychology}</p>
            </div>
          )}
          {impact && (
            <div className="flex items-center bg-[#2E7D32]/10 p-3 border-l-4 border-[#2E7D32]">
              <Target className="w-4 h-4 text-[#2E7D32] mr-2 shrink-0" />
              <span className="font-bold text-[#2E7D32]">Expected Impact: {impact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BeforeAfter = ({ before, after }) => (
  <div className="flex flex-col md:flex-row items-stretch border-2 border-[#1C1C1C] bg-white my-4 relative">
    <div className="masking-tape w-16 h-6 -top-3 -left-4 transform -rotate-12" />
    <div className="flex-1 p-6 bg-gray-100 border-b-2 md:border-b-0 md:border-r-2 border-[#1C1C1C]">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Current Approach</span>
      <p className="font-editorial text-lg text-gray-500 line-through decoration-2 decoration-[#D32F2F]">{before}</p>
    </div>
    <div className="flex-1 p-6 bg-white">
      <span className="text-xs font-bold uppercase tracking-widest text-[#E65C00] block mb-2">Khoji Recommended</span>
      <p className="font-editorial text-xl font-bold text-[#1C1C1C]">{after}</p>
    </div>
  </div>
);

const Modal = ({ title, onClose, children, icon: Icon, wide = false }) => (
  <div className="fixed inset-0 bg-[#1C1C1C]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-[#FDFBF7] border-2 border-[#1C1C1C] shadow-[8px_8px_0px_0px_#1C1C1C] w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[85vh] overflow-y-auto relative`}
    >
      <div className="sticky top-0 bg-[#1C1C1C] text-white px-6 py-4 flex items-center justify-between z-10">
        <h3 className="font-editorial font-black text-xl flex items-center">
          {Icon && <Icon className="w-5 h-5 mr-2 text-[#F2A900]" />}
          {title}
        </h3>
        <button onClick={onClose} className="hover:text-[#E65C00] transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// RICH VISUAL COMPONENTS — used throughout the Marketing Blueprint
// ---------------------------------------------------------------------------

const ScoreBarChart = ({ scores }) => (
  <div className="space-y-4">
    {Object.entries(scores).map(([key, score], idx) => (
      <div key={key}>
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
          <span>{key}</span>
          <span className="font-mono-editorial">{score}/100</span>
        </div>
        <div className="w-full bg-gray-200 h-3 border-2 border-[#1C1C1C]">
          <div
            className="h-full bg-[#E65C00] animate-grow-bar"
            style={{ width: `${score}%`, animationDelay: `${idx * 80}ms` }}
          />
        </div>
      </div>
    ))}
  </div>
);

const SwotMatrix = ({ swot }) => {
  const quadrants = [
    { key: 'strengths', label: 'Strengths', color: '#2E7D32', bg: 'bg-[#2E7D32]/10' },
    { key: 'weaknesses', label: 'Weaknesses', color: '#D32F2F', bg: 'bg-[#D32F2F]/10' },
    { key: 'opportunities', label: 'Opportunities', color: '#1E293B', bg: 'bg-[#1E293B]/10' },
    { key: 'threats', label: 'Threats', color: '#F2A900', bg: 'bg-[#F2A900]/10' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 border-[#1C1C1C] p-2 bg-[#1C1C1C]">
      {quadrants.map(q => (
        <div key={q.key} className={`p-5 border-2 border-[#1C1C1C] ${q.bg} bg-white`}>
          <h4 className="font-editorial font-black text-lg mb-3 pb-2 border-b-2" style={{ borderColor: q.color, color: q.color }}>{q.label}</h4>
          <ul className="space-y-2">
            {(swot[q.key] || []).map((item, i) => (
              <li key={i} className="text-sm font-medium flex items-start">
                <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: q.color }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const CompetitorTable = ({ competitors, brandName }) => (
  <div className="overflow-x-auto border-2 border-[#1C1C1C] shadow-editorial-sm">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-[#1C1C1C] text-white text-left uppercase tracking-widest text-xs">
          <th className="p-3 font-bold">Player</th>
          <th className="p-3 font-bold">Strength</th>
          <th className="p-3 font-bold">Weakness</th>
          <th className="p-3 font-bold">Price Tier</th>
          <th className="p-3 font-bold">Your Opening</th>
        </tr>
      </thead>
      <tbody>
        <tr className="bg-[#F2A900]/20 border-t-2 border-[#1C1C1C] font-bold">
          <td className="p-3">{brandName} (You)</td>
          <td className="p-3" colSpan={4}>This is where you sit today — the recommendations below close the gap.</td>
        </tr>
        {competitors.map((c, i) => (
          <tr key={i} className={`border-t-2 border-[#1C1C1C] ${i % 2 ? 'bg-gray-50' : 'bg-white'}`}>
            <td className="p-3 font-bold">{c.name}</td>
            <td className="p-3 text-gray-700">{c.strength}</td>
            <td className="p-3 text-gray-700">{c.weakness}</td>
            <td className="p-3 text-gray-700">{c.priceTier}</td>
            <td className="p-3 text-[#E65C00] font-bold">{c.opening}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PersonaCard = ({ persona }) => (
  <PaperCard className="relative overflow-hidden">
    <div className="masking-tape w-20 h-6 -top-3 right-6 transform rotate-3" />
    <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-dashed border-gray-300">
      <div className="w-14 h-14 rounded-full bg-[#1E293B] text-white flex items-center justify-center font-editorial font-black text-xl shrink-0 border-2 border-[#1C1C1C]">
        {persona.name.charAt(0)}
      </div>
      <div>
        <h4 className="font-editorial font-black text-xl leading-tight">{persona.name}</h4>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{persona.role}, {persona.age}</span>
      </div>
    </div>
    <p className="font-editorial italic text-lg text-[#1C1C1C] mb-4">"{persona.quote}"</p>
    <div className="grid grid-cols-1 gap-3">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#2E7D32] block mb-1">Goals</span>
        <p className="text-sm text-gray-700">{persona.goals}</p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#D32F2F] block mb-1">Pain Points</span>
        <p className="text-sm text-gray-700">{persona.painPoints}</p>
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-[#E65C00] block mb-1">Where They're Found</span>
        <p className="text-sm text-gray-700">{persona.channels}</p>
      </div>
    </div>
  </PaperCard>
);

const PositioningMatrix = ({ axes, points, brandName }) => (
  <div className="border-2 border-[#1C1C1C] bg-white p-8 shadow-editorial-sm">
    <div className="relative w-full aspect-square max-w-lg mx-auto border-2 border-[#1C1C1C]">
      <div className="absolute inset-0 border-l-2 border-t-2 border-dashed border-gray-300" style={{ left: '50%', top: 0, bottom: 0, width: 0 }} />
      <div className="absolute left-0 right-0 border-t-2 border-dashed border-gray-300" style={{ top: '50%' }} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 -rotate-90 origin-right whitespace-nowrap">{axes.yLow}</div>
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">{axes.yHigh}</div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-gray-500">{axes.xHigh}</div>
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-gray-500 -rotate-90 whitespace-nowrap">{axes.xLow}</div>
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center group"
          style={{ left: `${p.x}%`, top: `${100 - p.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className={`w-4 h-4 rounded-full border-2 border-[#1C1C1C] ${p.isYou ? 'bg-[#E65C00] w-6 h-6 z-20 shadow-editorial-sm' : 'bg-white z-10'}`} />
          <span className={`mt-1 text-[10px] font-bold whitespace-nowrap px-1 ${p.isYou ? 'bg-[#1C1C1C] text-white' : 'text-gray-600'}`}>{p.label}</span>
        </div>
      ))}
    </div>
    <p className="text-center text-xs text-gray-500 font-bold uppercase tracking-widest mt-6">{brandName}'s white space is marked in orange</p>
  </div>
);

const HorizontalTimeline = ({ items }) => (
  <div className="relative pl-8 border-l-2 border-[#1C1C1C] space-y-8">
    {items.map((item, i) => (
      <div key={i} className="relative">
        <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-[#F2A900] border-2 border-[#1C1C1C] flex items-center justify-center text-[10px] font-black">{i + 1}</div>
        <div className="flex items-center gap-2 mb-1">
          <Badge tone="outline">{item.window}</Badge>
          <Badge tone={item.priority === 'Critical' ? 'red' : item.priority === 'High' ? 'orange' : 'subtle'}>{item.priority}</Badge>
        </div>
        <h4 className="font-editorial font-bold text-xl">{item.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
      </div>
    ))}
  </div>
);

const RoadmapQuarters = ({ quarters }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {quarters.map((q, i) => (
      <div key={i} className="border-2 border-[#1C1C1C] bg-white flex flex-col">
        <div className="bg-[#1E293B] text-white p-3 text-center">
          <span className="font-editorial font-black text-lg">{q.label}</span>
        </div>
        <div className="p-4 space-y-3 flex-1">
          {q.goals.map((g, gi) => (
            <div key={gi} className="text-sm border-l-4 border-[#E65C00] pl-3 py-1">
              <p className="font-bold">{g}</p>
            </div>
          ))}
        </div>
        <div className="p-3 bg-gray-50 border-t-2 border-[#1C1C1C] text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Theme: {q.theme}</span>
        </div>
      </div>
    ))}
  </div>
);

const PriorityMatrix = ({ items }) => {
  const quadrantOf = (impact, effort) => {
    if (impact === 'High' && effort === 'Low') return 0;
    if (impact === 'High' && effort === 'High') return 1;
    if (impact === 'Low' && effort === 'Low') return 2;
    return 3;
  };
  const quadrants = [
    { title: 'Quick Wins', desc: 'High Impact / Low Effort', color: '#2E7D32' },
    { title: 'Major Projects', desc: 'High Impact / High Effort', color: '#E65C00' },
    { title: 'Fill-Ins', desc: 'Low Impact / Low Effort', color: '#1E293B' },
    { title: 'Reconsider', desc: 'Low Impact / High Effort', color: '#D32F2F' },
  ];
  const buckets = [[], [], [], []];
  items.forEach(it => buckets[quadrantOf(it.impact, it.effort)].push(it));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quadrants.map((q, i) => (
        <div key={i} className="border-2 border-[#1C1C1C] bg-white">
          <div className="p-3 border-b-2 border-[#1C1C1C] flex items-center justify-between" style={{ backgroundColor: `${q.color}1A` }}>
            <span className="font-editorial font-black" style={{ color: q.color }}>{q.title}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{q.desc}</span>
          </div>
          <ul className="p-4 space-y-2 min-h-[80px]">
            {buckets[i].map((it, ii) => (
              <li key={ii} className="text-sm font-bold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: q.color }} />
                {it.title}
              </li>
            ))}
            {buckets[i].length === 0 && <li className="text-xs text-gray-400 italic">No items here yet.</li>}
          </ul>
        </div>
      ))}
    </div>
  );
};

const PaletteSwatches = ({ palette }) => (
  <div className="flex flex-wrap gap-4">
    {palette.map(sw => (
      <div key={sw.hex} className="flex flex-col items-center">
        <div className="w-24 h-24 border-2 border-[#1C1C1C] shadow-editorial-sm rounded-full mb-2" style={{ backgroundColor: sw.hex }} />
        <span className="text-xs font-mono-editorial font-bold uppercase">{sw.hex}</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{sw.role}</span>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// ADAPTIVE QUESTIONNAIRE ENGINE — the Khoji Discovery Engine (KDE)
// 40-60 question flow, branching on business classification, with mandatory
// and optional questions plus dynamically injected AI follow-ups.
// ---------------------------------------------------------------------------

const CORE_QUESTIONS = [
  {
    id: 'welcome', title: 'Meet Your Brand', question: 'What is the name of your business?',
    type: 'text', key: 'brandName', placeholder: 'e.g. Acme Corp', mandatory: true,
    why: 'We use this to personalize your entire workspace and strategy blueprint.'
  },
  {
    id: 'vision', title: "The Founder's Vision", question: 'In one or two sentences, what is the ultimate vision for this brand?',
    type: 'textarea', key: 'vision', placeholder: 'We want to revolutionize how people...', mandatory: true,
    why: 'AI can generate tactics, but it cannot invent your soul. We align all marketing advice to your long-term ambition.'
  },
  {
    id: 'classification_1', title: 'Business Classification', question: 'Which category best describes your business?',
    options: ['SaaS', 'Handmade', 'E-commerce / D2C', 'Services / Agency', 'Creator / Influencer', 'Offline Retail', 'Beauty & Personal Care', 'Luxury Goods'],
    key: 'businessType', mandatory: true,
    why: 'This is a major routing decision. The strategy for a SaaS company is fundamentally different from a Handmade brand.'
  },
  {
    id: 'classification_2', title: 'Market Target', question: 'Who primarily buys from you?',
    options: ['Consumers (B2C)', 'Businesses (B2B)', 'Both (B2B2C)', 'Government / Enterprise'],
    key: 'businessModel', mandatory: true,
    why: 'B2B relies on logic, ROI, and multiple stakeholders. B2C relies on emotion, identity, and impulse. This changes everything.'
  },
  {
    id: 'classification_3', title: 'Primary Presence', question: 'Where does most of your business actually happen today?',
    options: ['Instagram-first', 'Website / E-commerce-first', 'Offline / Physical-store-first', 'Marketplace-first (Amazon, Etsy...)', 'Multi-channel, fairly balanced'],
    key: 'primaryPresence', mandatory: true,
    why: "We tailor channel recommendations to where you already have traction, instead of asking you to start from zero."
  },
  {
    id: 'industry', title: 'Industry Context', question: 'What industry or niche are you in?',
    type: 'text', key: 'industry', placeholder: 'e.g. Sustainable skincare', mandatory: true,
    why: 'Industry context lets us pull realistic competitor patterns and benchmark language.'
  },
  {
    id: 'stage', title: 'Current Stage', question: 'Where is the business right now?',
    options: ['Just an Idea', 'Pre-launch', 'Recently Launched (0-100 customers)', 'Growing', 'Established'],
    key: 'stage', mandatory: true,
    why: "We won't recommend advanced SEO strategies if you haven't validated your first 10 sales yet."
  },
  {
    id: 'mainOffering', title: 'The Offering', question: 'In plain language, what exactly do you sell?',
    type: 'textarea', key: 'mainOffering', placeholder: 'A subscription box of...', mandatory: true,
    why: 'A precise description of the offer prevents us from generating generic, forgettable messaging.'
  },
  {
    id: 'targetAudience', title: 'Target Audience', question: 'Who is your ideal customer? Be as specific as you can.',
    type: 'textarea', key: 'targetAudience', placeholder: 'Working professionals aged 25-35 who...', mandatory: true,
    why: 'Precision here is the single biggest driver of marketing ROI. Vague audiences produce vague campaigns.'
  },
  {
    id: 'pricePoint', title: 'Price Positioning', question: 'How would you describe your pricing?',
    options: ['Budget / Value', 'Mid-market', 'Premium', 'Luxury'],
    key: 'pricePoint', mandatory: true,
    why: 'Price tier dictates tone of voice, channel choice, and the entire visual language of your brand.'
  },
];

// Branch questions keyed by businessType classification
const BRANCH_QUESTIONS = {
  'SaaS': [
    { id: 'saas_metrics', title: 'SaaS & B2B Economics', question: 'What is your current Customer Acquisition Cost (CAC) to Lifetime Value (LTV) ratio?', options: ["Don't know yet", 'CAC is higher than LTV', 'Balanced (1:3)', 'Highly profitable (1:5+)'], key: 'unitEconomics', mandatory: true, why: "In B2B/SaaS, unit economics dictate your entire marketing strategy. If we don't know this, we can't recommend paid acquisition safely." },
    { id: 'saas_onboarding', title: 'Product Experience', question: 'How long does it take a new user to experience the core value of your software?', type: 'textarea', key: 'timeToValue', mandatory: true, why: 'Time-to-value directly impacts churn. Marketing cannot fix a leaky bucket caused by slow onboarding.' },
    { id: 'saas_pricing_model', title: 'Pricing Model', question: 'How is your product priced?', options: ['Flat monthly/annual', 'Per-seat', 'Usage-based', 'Freemium + upgrade'], key: 'pricingModel', mandatory: true, why: 'Pricing model changes which messaging levers (seats, usage, value) actually convert.' },
    { id: 'saas_churn', title: 'Retention', question: 'What does your monthly churn look like?', options: ["Don't track it yet", 'Under 3% (healthy)', '3-7% (watch closely)', 'Over 7% (urgent)'], key: 'churnRate', mandatory: false, why: 'Churn tells us whether to prioritize acquisition or retention marketing first.' },
    { id: 'saas_trial', title: 'Trial Experience', question: 'Do you offer a free trial or demo?', options: ['Free trial, no card required', 'Free trial, card required', 'Live demo only', 'No trial at all'], key: 'freeTrial', mandatory: false, why: 'Trial friction is one of the biggest hidden killers of SaaS conversion rates.' },
    { id: 'saas_integrations', title: 'Ecosystem Fit', question: 'What tools or platforms does your product integrate with?', type: 'textarea', key: 'integrations', mandatory: false, why: 'Integrations are a powerful, underused SEO and partnership marketing channel for SaaS.' },
  ],
  'Handmade': [
    { id: 'd2c_craft', title: 'The Craft & Story', question: 'What makes your production process unique compared to mass-produced alternatives?', type: 'textarea', key: 'craftStory', mandatory: true, why: 'For handmade brands, your process is your marketing. We need to extract your story to build premium positioning.' },
    { id: 'd2c_packaging', title: 'Unboxing Experience', question: 'How do you currently package your products for shipping?', options: ['Basic utility packaging', 'Custom boxes but simple', 'Highly curated unboxing experience', 'Eco-friendly / minimalist'], key: 'packaging', mandatory: true, why: 'Packaging is the only marketing channel with a 100% open rate. It dictates repeat purchase behavior.' },
    { id: 'd2c_capacity', title: 'Production Capacity', question: 'How many units can you realistically produce per month right now?', options: ['Under 20', '20-100', '100-500', '500+'], key: 'productionCapacity', mandatory: true, why: "We won't recommend a viral campaign that could crash a supply chain you can't yet support." },
    { id: 'd2c_sourcing', title: 'Materials & Sourcing', question: 'Where do your materials or ingredients come from?', type: 'text', key: 'materialSourcing', mandatory: false, why: 'Sourcing transparency is a strong trust and premium-pricing lever for handmade goods.' },
    { id: 'd2c_customization', title: 'Personalization', question: 'Can customers customize or personalize what they buy?', options: ['Fully custom, made to order', 'Some customization options', 'No, fixed catalog'], key: 'customization', mandatory: false, why: 'Customization is a powerful differentiator against mass-market competitors and justifies premium pricing.' },
    { id: 'd2c_price_justify', title: 'Value Justification', question: 'If a customer asked why your product costs more than a factory-made version, what would you say?', type: 'textarea', key: 'priceJustification', mandatory: false, why: 'This becomes the backbone of your product page and ad copy.' },
  ],
  'E-commerce / D2C': [
    { id: 'ecom_platform', title: 'Storefront', question: 'Where do you currently sell online?', options: ['Shopify / own website', 'Instagram / social shop', 'Amazon or other marketplace', 'Multiple platforms'], key: 'currentPlatform', mandatory: true, why: 'Your platform determines what levers (SEO, ads, algorithm) actually move revenue.' },
    { id: 'ecom_aov', title: 'Average Order Value', question: 'What is your average order value (AOV) roughly?', type: 'text', placeholder: 'e.g. ₹1,500', key: 'aov', mandatory: true, why: 'AOV determines whether we should focus on volume acquisition or bundling/upsell strategies.' },
    { id: 'ecom_returns', title: 'Returns', question: 'What is your rough return/refund rate?', options: ['Under 5%', '5-15%', '15-30%', "Don't track it"], key: 'returnRate', mandatory: false, why: 'High return rates often signal a sizing, description, or expectation-setting problem marketing can fix.' },
    { id: 'ecom_fulfillment', title: 'Fulfillment', question: 'How do you currently fulfill orders?', options: ['Self-fulfilled', '3PL / warehouse partner', 'Dropshipping', 'Print/produce on demand'], key: 'fulfillmentModel', mandatory: false, why: 'Fulfillment speed is now a top-3 factor in D2C repeat purchase decisions.' },
    { id: 'ecom_repeat', title: 'Repeat Purchases', question: 'What percentage of revenue comes from repeat customers?', options: ['Mostly first-time buyers', 'Roughly even split', 'Mostly repeat buyers', "Don't know yet"], key: 'repeatPurchaseRate', mandatory: false, why: 'This tells us whether to prioritize acquisition or lifecycle/retention marketing.' },
    { id: 'ecom_shipping', title: 'Shipping Speed', question: 'How fast do orders typically reach customers?', options: ['Same/next day', '2-4 days', '5-10 days', '10+ days'], key: 'shippingSpeed', mandatory: false, why: 'Shipping speed expectations directly affect conversion copy and trust badges.' },
  ],
  'Services / Agency': [
    { id: 'svc_type', title: 'Service Definition', question: 'Describe the core service you deliver in one sentence.', type: 'textarea', key: 'serviceType', mandatory: true, why: 'Clear service definition prevents scope confusion in your marketing messaging.' },
    { id: 'svc_cycle', title: 'Sales Cycle', question: 'How long does it typically take to close a new client?', options: ['Under a week', '1-4 weeks', '1-3 months', '3+ months'], key: 'salesCycleLength', mandatory: true, why: 'Sales cycle length determines whether we build a lead-gen funnel or a trust/authority funnel.' },
    { id: 'svc_retention', title: 'Client Retention', question: 'Are your clients mostly one-off projects or ongoing retainers?', options: ['Mostly one-off', 'Mix of both', 'Mostly retainers'], key: 'clientRetention', mandatory: false, why: 'Retainer-heavy businesses should market differently than project-based ones.' },
    { id: 'svc_referral', title: 'Referral Engine', question: 'Where do most of your current clients come from?', type: 'textarea', key: 'referralSource', mandatory: false, why: 'We amplify what is already working before introducing new channels.' },
    { id: 'svc_capacity', title: 'Delivery Capacity', question: 'How many clients could your team take on right now without breaking?', options: ['1-2 more', '3-5 more', '5-10 more', '10+'], key: 'teamCapacity', mandatory: false, why: "There's no point generating demand your team can't fulfill." },
    { id: 'svc_proof', title: 'Social Proof', question: 'Do you have case studies or testimonials ready to publish?', options: ['Yes, several strong ones', 'A few, need polishing', 'None yet'], key: 'caseStudies', mandatory: false, why: 'Proof assets are the highest-converting content type for services businesses.' },
  ],
  'Creator / Influencer': [
    { id: 'creator_platform', title: 'Primary Platform', question: 'Which platform is your main audience on?', options: ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Multiple, fairly even'], key: 'platformFocus', mandatory: true, why: 'Every platform rewards a different content format and posting cadence.' },
    { id: 'creator_size', title: 'Audience Size', question: 'Roughly how large is your following on your main platform?', type: 'text', placeholder: 'e.g. 12,000', key: 'audienceSize', mandatory: true, why: 'Audience size determines whether we focus on growth or monetization first.' },
    { id: 'creator_engagement', title: 'Engagement', question: 'What is your rough engagement rate (likes+comments / followers)?', type: 'text', placeholder: 'e.g. 4%', key: 'engagementRate', mandatory: false, why: 'Engagement rate matters more than follower count for brand deals and conversions.' },
    { id: 'creator_monetization', title: 'Monetization', question: 'How do you currently make money from your audience?', options: ['Brand deals / sponsorships', 'Own products', 'Affiliate / referral', 'Not monetized yet'], key: 'monetizationModel', mandatory: false, why: 'This determines whether the strategy should center on audience growth or on conversion assets.' },
    { id: 'creator_frequency', title: 'Content Cadence', question: 'How often do you currently post?', options: ['Daily', '3-5x / week', '1-2x / week', 'Inconsistent'], key: 'contentFrequency', mandatory: false, why: 'Consistency compounds faster than virality on almost every platform algorithm.' },
    { id: 'creator_deals', title: 'Brand Partnerships', question: 'Are you actively seeking brand partnerships?', options: ['Yes, actively pitching', 'Open to inbound only', 'Not interested right now'], key: 'brandDeals', mandatory: false, why: 'This shapes whether we build a media kit and outreach plan into your roadmap.' },
  ],
  'Offline Retail': [
    { id: 'retail_location', title: 'Location', question: 'Where is your store located (city / area type)?', type: 'text', key: 'storeLocation', mandatory: true, why: 'Local marketing tactics differ hugely between high-footfall and destination locations.' },
    { id: 'retail_traffic', title: 'Foot Traffic', question: 'How would you describe your current foot traffic?', options: ['Very low', 'Moderate, inconsistent', 'Steady', 'Strong, consistent'], key: 'footTraffic', mandatory: true, why: 'This tells us whether to prioritize local discovery or in-store conversion tactics.' },
    { id: 'retail_competition', title: 'Local Competition', question: 'Who are your closest physical competitors and what do they do well?', type: 'textarea', key: 'localCompetition', mandatory: false, why: 'Local competitive mapping reveals gaps you can own within walking distance.' },
    { id: 'retail_online', title: 'Online Presence', question: 'Do you have any online presence today?', options: ['None', 'Google Business Profile only', 'Social media only', 'Full website + socials'], key: 'onlinePresence', mandatory: false, why: 'Even offline-first businesses now get discovered online before the first visit.' },
    { id: 'retail_staff', title: 'Team Size', question: 'How many staff work at the store?', options: ['Just me', '2-5', '6-15', '15+'], key: 'staffSize', mandatory: false, why: 'Staff capacity affects how ambitious an in-store activation plan can be.' },
    { id: 'retail_events', title: 'Events & Promotions', question: 'Do you run in-store events or promotions?', options: ['Regularly', 'Occasionally', 'Never'], key: 'eventsPromotions', mandatory: false, why: 'Events are one of the highest-ROI local marketing levers for offline retail.' },
  ],
  'Beauty & Personal Care': [
    { id: 'beauty_category', title: 'Product Category', question: 'What category best fits your products?', options: ['Skincare', 'Haircare', 'Makeup / Color cosmetics', 'Fragrance', 'Wellness / Personal care'], key: 'productCategory', mandatory: true, why: 'Each beauty subcategory has distinct proof points buyers expect to see.' },
    { id: 'beauty_ingredients', title: 'Ingredient Story', question: 'What is unique or notable about your ingredients or formulation?', type: 'textarea', key: 'ingredientStory', mandatory: true, why: 'Ingredient storytelling is the single biggest trust driver in beauty marketing.' },
    { id: 'beauty_certs', title: 'Certifications', question: 'Do you have any certifications (cruelty-free, organic, dermatologically tested)?', options: ['Yes, several', 'One or two', 'None yet, but planned', 'Not applicable'], key: 'regulatoryCerts', mandatory: false, why: 'Certifications reduce purchase risk and are highly shareable trust badges.' },
    { id: 'beauty_seeding', title: 'Influencer Seeding', question: 'Have you sent products to creators for organic reviews?', options: ['Yes, ongoing program', 'Tried it once or twice', 'Never'], key: 'influencerSeeding', mandatory: false, why: 'Seeding is the highest-leverage discovery channel in the beauty category right now.' },
    { id: 'beauty_gifting', title: 'Gifting Potential', question: 'Is your product commonly bought as a gift?', options: ['Yes, frequently', 'Sometimes', 'Rarely'], key: 'giftingPotential', mandatory: false, why: 'Gifting occasions unlock a completely separate seasonal marketing calendar.' },
  ],
  'Luxury Goods': [
    { id: 'lux_exclusivity', title: 'Exclusivity', question: 'How exclusive is access to your product?', options: ['Open to anyone who can pay', 'Limited drops / editions', 'Invite-only / waitlist'], key: 'exclusivityLevel', mandatory: true, why: 'Exclusivity mechanics are core to luxury demand psychology and must be reflected in messaging.' },
    { id: 'lux_craft', title: 'Craftsmanship Story', question: 'What is the craftsmanship or heritage story behind the product?', type: 'textarea', key: 'craftsmanshipStory', mandatory: true, why: 'Luxury buyers pay for the story and provenance as much as the object itself.' },
    { id: 'lux_experience', title: 'Client Experience', question: 'How would you describe the buying experience today?', options: ['Purely transactional', 'Some personal touches', 'White-glove, highly personal'], key: 'clientExperience', mandatory: false, why: 'In luxury, the experience of buying is itself a marketing asset.' },
    { id: 'lux_scarcity', title: 'Scarcity Strategy', question: 'Do you intentionally limit supply or availability?', options: ['Yes, deliberately', 'Not yet, but open to it', 'No, we sell as much as possible'], key: 'scarcityStrategy', mandatory: false, why: 'Perceived scarcity is one of the strongest luxury conversion levers available.' },
  ],
};

// Extra questions keyed by business model (B2B / B2C), skipped if the key was already asked
const MODEL_QUESTIONS = {
  'Businesses (B2B)': [
    { id: 'b2b_decision', title: 'Buying Committee', question: 'Who is typically involved in the decision to buy from you?', type: 'textarea', key: 'decisionMakers', mandatory: true, why: 'B2B purchases rarely have one decision-maker — messaging must speak to every stakeholder.' },
    { id: 'b2b_contract', title: 'Contract Length', question: 'What is a typical contract or engagement length?', options: ['One-time purchase', 'Monthly', 'Annual', 'Multi-year'], key: 'contractLength', mandatory: false, why: 'Contract length changes how aggressively we can pursue paid acquisition given payback period.' },
    { id: 'b2b_stakeholders', title: 'Stakeholder Count', question: 'On average, how many people sign off before a deal closes?', options: ['Just 1', '2-3', '4-6', '7+'], key: 'stakeholderCount', mandatory: false, why: 'More stakeholders means we need more content assets tailored to each role.' },
  ],
  'Consumers (B2C)': [
    { id: 'b2c_frequency', title: 'Purchase Frequency', question: 'How often does a typical customer buy from you?', options: ['One-time purchase', 'Occasionally', 'Regularly / subscription'], key: 'purchaseFrequency', mandatory: true, why: 'Purchase frequency determines whether we prioritize acquisition or lifecycle marketing.' },
    { id: 'b2c_emotion', title: 'Emotional Driver', question: 'What emotion does a customer feel right before they buy from you?', type: 'textarea', key: 'emotionalDriver', mandatory: false, why: 'B2C decisions are driven by emotion first, justified by logic second. Naming the emotion sharpens every ad.' },
    { id: 'b2c_decision_type', title: 'Decision Type', question: 'Is buying from you more of an impulse decision or a considered one?', options: ['Impulse (under 5 minutes)', 'Considered (some research)', 'Highly considered (days/weeks)'], key: 'impulseVsConsidered', mandatory: false, why: 'This changes whether ad creative should drive instant action or nurture over time.' },
  ],
};

// Universal deep-dive pool — mostly optional, applies across all business types
const DEEP_DIVE_QUESTIONS = [
  { id: 'competitors', title: 'Competitive Landscape', question: 'Who are your top 2-3 competitors (direct or indirect)?', type: 'textarea', key: 'competitors', mandatory: true, why: 'Naming real competitors lets us map genuine white space instead of guessing.' },
  { id: 'differentiator', title: 'Differentiation', question: 'What do you do that your competitors genuinely cannot copy easily?', type: 'textarea', key: 'differentiator', mandatory: true, why: 'A defensible differentiator is the foundation of every positioning statement we write.' },
  { id: 'currentChannels', title: 'Current Channels', question: 'What marketing channels are you using today, if any?', type: 'text', key: 'currentChannels', placeholder: 'e.g. Instagram, word of mouth', mandatory: true, why: 'We build on what already works rather than starting from a blank slate.' },
  { id: 'mainChallenge_early', title: 'Biggest Challenge', question: 'If Khoji could solve one marketing problem for you today, what would it be?', type: 'textarea', key: 'mainChallenge', mandatory: true, why: "This helps prioritize the Action Center so you get immediate ROI from the Blueprint." },
  { id: 'brandValues', title: 'Brand Values', question: 'What three values does your brand refuse to compromise on?', type: 'textarea', key: 'brandValues', mandatory: false, why: 'Values become the filter for every future marketing and product decision.' },
  { id: 'brandVoice', title: 'Brand Voice', question: 'If your brand were a person speaking, how would they sound?', options: ['Professional & authoritative', 'Playful & witty', 'Bold & disruptive', 'Minimal & quiet', 'Luxurious & refined', 'Warm & friendly'], key: 'brandVoice', mandatory: false, why: 'Voice consistency is what makes a brand feel like a coherent personality rather than a logo.' },
  { id: 'marketingBudget', title: 'Marketing Budget', question: "What's your realistic monthly marketing budget right now?", options: ['Under $500', '$500-$2,000', '$2,000-$10,000', '$10,000+'], key: 'marketingBudget', mandatory: false, why: "We won't recommend tactics you can't actually afford to execute well." },
  { id: 'teamSize', title: 'Marketing Team', question: 'Who currently handles marketing?', options: ['Just the founder(s)', '1 dedicated marketer', 'Small in-house team', 'Agency / freelancers'], key: 'teamSize', mandatory: false, why: 'Team capacity determines how many initiatives can realistically run in parallel.' },
  { id: 'contentCapacity', title: 'Content Capacity', question: 'How much time can you realistically dedicate to content creation weekly?', options: ['Under 2 hours', '2-5 hours', '5-10 hours', '10+ hours'], key: 'contentCreationCapacity', mandatory: false, why: 'This shapes whether we recommend daily content or a leaner, higher-quality cadence.' },
  { id: 'previousAttempts', title: 'Marketing History', question: 'What marketing have you tried before that did NOT work?', type: 'textarea', key: 'previousMarketingAttempts', mandatory: false, why: 'Knowing what failed prevents us from recommending the same dead end twice.' },
  { id: 'biggestWin', title: 'Biggest Win', question: 'What is the best marketing result you have had so far, even a small one?', type: 'textarea', key: 'biggestWin', mandatory: false, why: 'We double down on proven signals before introducing untested tactics.' },
  { id: 'seasonality', title: 'Seasonality', question: 'Does demand for your business change with seasons or events?', options: ['Very seasonal', 'Somewhat seasonal', 'Steady year-round'], key: 'seasonality', mandatory: false, why: 'Seasonality reshapes the entire 12-month content and promotion calendar.' },
  { id: 'geoFocus', title: 'Geographic Focus', question: 'What is your geographic focus?', options: ['Hyper-local (single city/area)', 'National', 'Global'], key: 'geographicFocus', mandatory: false, why: 'Geography determines whether local SEO or broad digital reach matters more.' },
  { id: 'mainKPI', title: 'North Star Metric', question: 'Which single metric matters most to you right now?', options: ['Revenue', 'New customers', 'Website traffic', 'Brand awareness', 'Repeat purchase rate'], key: 'mainKPI', mandatory: false, why: 'Every recommendation in your Blueprint is ranked against this north star.' },
  { id: 'growthTimeframe', title: 'Growth Horizon', question: 'What timeframe are you optimizing for?', options: ['Next 30 days survival', '6-month growth', '1-year scale', 'Long-term brand building'], key: 'growthGoalTimeframe', mandatory: false, why: 'This determines the pacing of the roadmap — aggressive sprints versus compounding plays.' },
  { id: 'paidAds', title: 'Paid Advertising', question: 'How do you feel about paid advertising?', options: ['Ready to invest now', 'Open to it once organic proves out', 'Prefer to avoid it'], key: 'paidAdsWillingness', mandatory: false, why: 'This determines whether the roadmap leads with organic-first or paid-assisted growth.' },
  { id: 'existingAssets', title: 'Brand Assets', question: 'What brand assets do you already have?', options: ['Nothing yet', 'Logo only', 'Logo + basic guidelines', 'Full brand kit (colors, type, imagery)'], key: 'existingAssets', mandatory: false, why: "We won't waste your time redesigning what's already working." },
  { id: 'socialProof', title: 'Social Proof', question: 'Do you have testimonials, reviews, or case studies you can showcase?', options: ['Plenty, ready to use', 'A few, scattered', 'None yet'], key: 'testimonialsSocialProof', mandatory: false, why: 'Social proof is consistently one of the highest-converting content types across every channel.' },
  { id: 'website', title: 'Digital Home', question: 'Do you have a website today?', options: ['Yes, and it converts well', 'Yes, but it needs work', 'No website yet'], key: 'websiteStatus', mandatory: false, why: 'Every channel we recommend eventually needs a strong landing destination.' },
  { id: 'launchTimeline', title: 'Urgency', question: 'Is there a specific deadline or launch date driving this plan?', type: 'text', key: 'launchTimeline', placeholder: 'e.g. Festive season, funding round, none', mandatory: false, why: 'Deadlines reorder priorities — we sequence the roadmap around real dates when they exist.' },
];

// Heuristic: if a free-text answer looks too short/thin, dynamically inject a
// clarifying follow-up question right after it — simulating an AI consultant
// probing for more context, as a real strategist would in an interview.
const THIN_ANSWER_FOLLOWUPS = {
  vision: { question: "Quick follow-up — what would success look like for you in 12 months, concretely?", key: 'visionFollowup' },
  mainOffering: { question: "Got it — what's the #1 outcome or transformation the customer gets, in their own words?", key: 'offeringFollowup' },
  targetAudience: { question: 'A bit more detail helps — what does this person struggle with right before they find you?', key: 'audienceFollowup' },
  differentiator: { question: "Let's dig one layer deeper — why hasn't a competitor already copied this?", key: 'differentiatorFollowup' },
  craftStory: { question: 'Tell us a bit more — what does a customer notice in the first 10 seconds of unboxing?', key: 'craftStoryFollowup' },
};

const isThin = (val) => typeof val === 'string' && val.trim().length > 0 && val.trim().length < 25;

// Builds the full adaptive sequence for the current answer state.
const buildQuestionSequence = (answers) => {
  const seq = [...CORE_QUESTIONS];

  const branch = BRANCH_QUESTIONS[answers.businessType];
  if (branch) seq.push(...branch);

  const modelQs = MODEL_QUESTIONS[answers.businessModel];
  if (modelQs) {
    modelQs.forEach(q => {
      if (!seq.find(existing => existing.key === q.key)) seq.push(q);
    });
  }

  seq.push(...DEEP_DIVE_QUESTIONS);

  const withFollowups = [];
  seq.forEach(q => {
    withFollowups.push(q);
    const followupDef = THIN_ANSWER_FOLLOWUPS[q.key];
    if (followupDef && isThin(answers[q.key])) {
      withFollowups.push({
        id: `${q.id}_followup`,
        title: `Follow-up: ${q.title}`,
        question: followupDef.question,
        type: 'textarea',
        key: followupDef.key,
        mandatory: false,
        isAiFollowup: true,
        why: 'Khoji noticed this answer could use more depth — a sharper answer here means a sharper Blueprint.',
      });
    }
  });

  return withFollowups;
};

// ---------------------------------------------------------------------------
// AI RESEARCH WAR ROOM — generates a bespoke, premium consulting Blueprint
// purely from the current project's dynamic answers. No hardcoded company
// names or data ever appear here; everything derives from `answers`.
// ---------------------------------------------------------------------------

const pick = (arr, seedStr) => {
  // deterministic-ish pick so the same answers always render the same blueprint
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  return arr[hash % arr.length];
};

const splitList = (raw, fallbackArr) => {
  if (!raw || typeof raw !== 'string') return fallbackArr;
  const parts = raw.split(/,| and |\n|;/i).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts.slice(0, 3) : fallbackArr;
};

const generateDynamicBlueprint = (answers) => {
  const bName = answers.brandName || 'Your Business';
  const bType = answers.businessType || 'Business';
  const bModel = answers.businessModel || 'B2C';
  const industry = answers.industry || 'your category';
  const audience = answers.targetAudience || 'your ideal customer';
  const stage = answers.stage || 'Growing';
  const offering = answers.mainOffering || 'your product or service';

  let blueprint = {
    version: '2.0',
    date: new Date().toLocaleDateString(),
    brandName: bName,
    industry,
    healthScores: { brand: 0, market: 0, customers: 0, marketing: 0, growth: 0 },
    sections: {},
    tasks: [],
  };

  // ---- Health Scores (dynamic by stage + how thoroughly the founder answered) ----
  const answeredCount = Object.values(answers).filter(v => typeof v === 'string' && v.trim().length > 0).length;
  const richnessBonus = Math.min(15, Math.floor(answeredCount / 4));
  if (stage === 'Just an Idea') {
    blueprint.healthScores = { brand: 35 + richnessBonus, market: 55, customers: 25 + richnessBonus, marketing: 15, growth: 10 };
  } else if (stage === 'Pre-launch') {
    blueprint.healthScores = { brand: 45 + richnessBonus, market: 60, customers: 35 + richnessBonus, marketing: 25, growth: 20 };
  } else if (stage === 'Established') {
    blueprint.healthScores = { brand: 82 + Math.min(8, richnessBonus), market: 88, customers: 85, marketing: 74, growth: 78 };
  } else {
    blueprint.healthScores = { brand: 60 + richnessBonus, market: 72, customers: 58 + richnessBonus, marketing: 48, growth: 44 };
  }
  Object.keys(blueprint.healthScores).forEach(k => { blueprint.healthScores[k] = Math.min(98, blueprint.healthScores[k]); });

  // ---- Executive Summary ----
  blueprint.sections.executiveSummary = {
    content: `${bName} is positioned as a ${answers.pricePoint || 'developing'} ${bType} in the ${industry} space, operating primarily through ${answers.primaryPresence || 'a mix of channels'}. Based on your current stage (${stage}), the immediate priority is establishing a cohesive brand narrative that resonates with ${audience}. While your vision ("${answers.vision || 'sustainable growth'}") is strong, execution needs to shift from generic outreach toward highly targeted positioning built around ${answers.differentiator || 'your core differentiator'}.`,
    highlights: [
      `Primary opportunity: sharpen positioning around ${answers.differentiator ? 'your stated differentiator' : 'a clear, ownable differentiator'}.`,
      `Biggest risk today: ${answers.mainChallenge || 'inconsistent marketing execution'}.`,
      `Recommended north star: ${answers.mainKPI || 'sustainable customer growth'} over the next ${answers.growthGoalTimeframe || '6 months'}.`,
    ],
  };

  // ---- Brand Analysis ----
  blueprint.sections.brandAnalysis = {
    content: `Right now, ${bName}'s brand exists mostly in the founder's head rather than as a documented, repeatable system. Assets on hand: ${answers.existingAssets || 'not yet specified'}. Voice preference leans ${answers.brandVoice || 'undefined — this should be your first decision'}. Values you won't compromise on: ${answers.brandValues || 'not yet articulated'}.`,
    recommendations: [
      {
        title: 'Codify a One-Page Brand Sheet',
        reasoning: `Every touchpoint — from packaging to ads — currently gets reinvented from scratch. A single reference sheet (voice, values, visual rules) stops that drift.`,
        psychology: 'Consistency is a trust signal. Consumers subconsciously equate a coherent brand with a reliable business.',
        impact: 'Faster content production, stronger brand recall.',
        priority: 'High',
      },
    ],
  };

  // ---- Product Analysis ----
  blueprint.sections.productAnalysis = {
    content: `${offering} sits at a ${answers.pricePoint || 'mid-market'} price point. ${answers.priceJustification ? 'You already have a clear value justification: ' + answers.priceJustification : 'A clear articulation of why the price is justified is still missing from your customer-facing messaging.'}`,
    recommendations: [
      {
        title: 'Translate Features into Outcomes',
        reasoning: `Customers don't buy ${offering.split(' ').slice(0, 4).join(' ')}... — they buy the transformation it creates. Every product description should lead with the outcome.`,
        psychology: 'People justify purchases with logic but decide with the emotional payoff of the outcome.',
        impact: 'Higher click-through and conversion on product pages.',
        priority: 'High',
      },
    ],
  };

  // ---- Market Research ----
  const marketSize = pick(['Emerging and fragmented', 'Growing steadily, no dominant leader', 'Mature but ripe for a challenger brand', 'Crowded but under-served at the premium end'], industry + bType);
  blueprint.sections.marketResearch = {
    content: `The ${industry} category is best described as: "${marketSize}." Given your ${bModel} model and ${answers.geographicFocus || 'undefined'} geographic focus, the addressable opportunity favors ${bModel === 'Businesses (B2B)' ? 'account-based, relationship-driven growth' : 'community-led, content-driven growth'}.`,
    swot: {
      strengths: splitList(answers.differentiator, ['A clear point of view the market lacks', 'Founder-led authenticity', 'Agility to move faster than incumbents']),
      weaknesses: splitList(answers.previousMarketingAttempts, ['Inconsistent marketing execution', 'Limited brand documentation', 'Unproven paid acquisition']),
      opportunities: splitList(answers.biggestWin, [`Untapped demand on ${answers.primaryPresence || 'your primary channel'}`, 'Category storytelling gap competitors ignore', 'Underused referral / word-of-mouth loop']),
      threats: [`Larger players commoditizing ${industry}`, 'Rising customer acquisition costs', 'Attention fragmentation across platforms'],
    },
  };

  // ---- Customer Personas ----
  const personaBase = audience.split(/,| and /i)[0] || 'Core Customer';
  blueprint.sections.customerAnalysis = {
    content: `Your stated audience is: "${audience}." We've translated this into two working personas to sharpen messaging.`,
    personas: [
      {
        name: 'The Primary Buyer',
        role: personaBase.length > 28 ? personaBase.slice(0, 28) + '…' : personaBase,
        age: bModel === 'Businesses (B2B)' ? '30-45, Decision-maker' : '25-40',
        quote: answers.emotionalDriver ? `I just want to feel ${answers.emotionalDriver.split(' ').slice(0, 6).join(' ')}.` : `I want a brand that actually gets what I need.`,
        goals: answers.mainOffering ? `Find a reliable way to get: ${answers.mainOffering}` : 'Solve their core problem without friction.',
        painPoints: answers.mainChallenge || 'Too many generic options, not enough trust signals.',
        channels: answers.primaryPresence || 'Social media and search',
      },
      {
        name: 'The Skeptical Researcher',
        role: bModel === 'Businesses (B2B)' ? 'Evaluator / Influencer' : 'Considered Purchaser',
        age: '28-50',
        quote: "I need proof before I commit — show me it actually works.",
        goals: 'Validate the decision with reviews, comparisons, and proof before purchasing.',
        painPoints: answers.testimonialsSocialProof === 'None yet' ? 'Cannot find enough social proof to feel confident.' : 'Needs comparison content to justify the choice.',
        channels: 'Search, review sites, referrals',
      },
    ],
  };

  // ---- Competitor Analysis ----
  const compNames = splitList(answers.competitors, ['Competitor A', 'Competitor B']);
  const compRows = compNames.map((name, i) => ({
    name,
    strength: i === 0 ? 'Established brand recognition' : 'Aggressive pricing',
    weakness: i === 0 ? 'Generic, impersonal brand voice' : 'Weak storytelling and community',
    priceTier: i === 0 ? 'Mid-to-premium' : 'Budget-to-mid',
    opening: i === 0 ? `Win on authenticity and ${answers.brandVoice || 'a sharper voice'}` : `Win on story and craft, not price`,
  }));
  blueprint.sections.competitorAnalysis = {
    content: `You named ${compNames.join(' and ')} as reference points. Neither is likely to out-execute you on story or specificity — that is your lane.`,
    competitors: compRows,
  };

  // ---- Positioning ----
  let positioningBefore = 'Broad, generic messaging trying to appeal to everyone.';
  let positioningAfter = `Hyper-focused messaging targeting ${audience} seeking a ${answers.pricePoint || 'considered'} ${bType} solution.`;
  if (bType === 'SaaS') {
    positioningBefore = 'Focusing on software features and technical specs.';
    positioningAfter = 'Focusing on business outcomes, ROI, and workflow automation for users.';
  } else if (bType === 'Handmade') {
    positioningBefore = 'Marketing the product purely as a functional item.';
    positioningAfter = "Marketing the craft, the founder's story, and the exclusivity of small-batch production.";
  } else if (bType === 'Luxury Goods') {
    positioningBefore = 'Competing on visibility and reach.';
    positioningAfter = 'Competing on exclusivity, craftsmanship, and scarcity.';
  }
  blueprint.sections.positioning = {
    beforeAfter: { before: positioningBefore, after: positioningAfter },
    matrix: {
      axes: { xLow: 'Accessible', xHigh: 'Premium', yLow: 'Functional', yHigh: 'Emotional' },
      points: [
        { label: bName, x: answers.pricePoint === 'Luxury' ? 88 : answers.pricePoint === 'Premium' ? 72 : answers.pricePoint === 'Mid-market' ? 50 : 25, y: bModel === 'Businesses (B2B)' ? 35 : 70, isYou: true },
        { label: compNames[0] || 'Competitor A', x: 60, y: 40 },
        { label: compNames[1] || 'Competitor B', x: 30, y: 55 },
      ],
    },
    recommendations: [
      {
        title: 'Define Your Core Brand Archetype',
        reasoning: `As a ${bModel} brand, customers need to connect with your identity before they evaluate price.`,
        psychology: "Consumers use brands as shortcuts to identity. If your brand doesn't clearly state who it is for, buyers experience cognitive friction and abandon the purchase.",
        impact: 'Higher conversion rates and increased brand loyalty.',
        priority: 'High',
      },
    ],
  };

  // ---- Marketing Channels ----
  let primaryChannel = 'Instagram & TikTok';
  if (bModel === 'Businesses (B2B)' || bType === 'SaaS') primaryChannel = 'LinkedIn & SEO-driven Content';
  if (bType === 'Offline Retail') primaryChannel = 'Local SEO & Google Business Profile';
  if (bType === 'Creator / Influencer') primaryChannel = answers.platformFocus || 'Instagram & YouTube';
  blueprint.sections.marketingChannels = {
    content: `Based on your reliance on ${answers.currentChannels || 'organic word of mouth'}, the priority is diversifying and stabilizing acquisition rather than abandoning what already works.`,
    recommendations: [
      {
        title: `Dominate ${primaryChannel} as Pillar 1`,
        reasoning: `Your target audience (${audience}) spends significant discovery time on ${primaryChannel}.`,
        psychology: 'Meeting users where they already exhibit high-intent discovery behavior reduces customer acquisition cost (CAC).',
        impact: 'Sustainable, scalable lead generation.',
        priority: 'Critical',
      },
      {
        title: answers.paidAdsWillingness === 'Prefer to avoid it' ? 'Build an Organic Referral Loop' : 'Layer in Targeted Paid Acquisition',
        reasoning: answers.paidAdsWillingness === 'Prefer to avoid it' ? 'Since paid is off the table for now, a structured referral incentive becomes your growth engine instead.' : `Your ${answers.marketingBudget || 'stated budget'} supports a controlled paid pilot once organic messaging is validated.`,
        psychology: 'Referred customers convert faster because trust is inherited from the referrer.',
        impact: 'Lower blended CAC over time.',
        priority: 'Medium',
      },
    ],
  };

  // ---- Sales Channels ----
  blueprint.sections.salesChannels = {
    content: `Given your ${answers.currentPlatform || answers.primaryPresence || 'current setup'}, the sales path should be shortened wherever friction exists between discovery and checkout.`,
    recommendations: [
      {
        title: 'Reduce Path-to-Purchase Friction',
        reasoning: bType === 'Services / Agency' ? `With a ${answers.salesCycleLength || 'multi-step'} sales cycle, every extra step in scheduling a call costs you leads.` : 'Every additional click between discovery and checkout costs conversion.',
        psychology: 'Decision fatigue causes drop-off; simpler paths convert more intent into revenue.',
        impact: 'Improved conversion rate across all channels.',
        priority: 'High',
      },
    ],
  };

  // ---- Visual Identity / Brand Identity ----
  let paletteRoles = [
    { hex: '#1C1C1C', role: 'Primary / Anchor' },
    { hex: '#FDFBF7', role: 'Background' },
    { hex: '#E65C00', role: 'Accent / CTA' },
  ];
  if (answers.pricePoint === 'Luxury') paletteRoles = [{ hex: '#0F172A', role: 'Primary' }, { hex: '#F8FAFC', role: 'Background' }, { hex: '#D4AF37', role: 'Accent / Gold' }];
  if (answers.brandVoice === 'Playful & witty') paletteRoles = [{ hex: '#FF6B6B', role: 'Primary' }, { hex: '#4ECDC4', role: 'Secondary' }, { hex: '#FFE66D', role: 'Accent' }];
  if (bType === 'Beauty & Personal Care') paletteRoles = [{ hex: '#F4E1D2', role: 'Background' }, { hex: '#8B5E4B', role: 'Primary' }, { hex: '#D97D54', role: 'Accent' }];

  blueprint.sections.visualIdentity = {
    palette: paletteRoles,
    typography: answers.pricePoint === 'Luxury' ? 'A refined serif (headings) + a clean grotesque sans (body)' : 'A confident editorial serif (headings) + a warm, readable sans-serif (body)',
    archetype: pick(['The Creator', 'The Everyman', 'The Sage', 'The Rebel', 'The Caregiver', 'The Explorer'], bName + bType),
    recommendations: [
      {
        title: 'Standardize Visual Language Across Touchpoints',
        reasoning: `Current assets on hand: ${answers.existingAssets || 'minimal'}. Without a shared rulebook, every new post or package dilutes brand recall.`,
        psychology: 'Visual consistency builds trust. Inconsistent branding subconsciously signals unreliability to potential buyers.',
        impact: 'Increased perceived value and brand recognition.',
        priority: 'Medium',
      },
    ],
  };
  blueprint.sections.brandIdentity = blueprint.sections.visualIdentity;

  // ---- Content Strategy ----
  blueprint.sections.contentStrategy = {
    content: `With ${answers.contentCreationCapacity || 'limited stated capacity'} available weekly, content needs to be prioritized ruthlessly rather than produced constantly.`,
    pillars: [
      { name: 'Proof & Trust', desc: `Testimonials, results, and behind-the-scenes proof (status: ${answers.testimonialsSocialProof || 'to be gathered'}).` },
      { name: 'Founder Story', desc: `${answers.vision ? 'Built around your stated vision.' : 'Built around why you started this.'}` },
      { name: 'Education', desc: `Content that helps ${audience} solve the problem ${offering} addresses.` },
      { name: 'Product in Action', desc: `Real usage or unboxing moments that show, not tell.` },
    ],
    recommendations: [
      {
        title: 'Batch-produce a Monthly Content Sprint',
        reasoning: `Given ${answers.contentCreationCapacity || 'limited'} weekly hours, batching one sprint per month beats daily improvisation.`,
        psychology: 'Reducing daily decision-making prevents creative burnout and keeps quality consistent.',
        impact: 'More consistent posting cadence without founder burnout.',
        priority: 'Medium',
      },
    ],
  };

  // ---- SEO / GEO Strategy ----
  blueprint.sections.seoGeoStrategy = {
    content: `${answers.websiteStatus === 'No website yet' ? 'Without a website today, search visibility starts from zero — this is a foundational gap.' : 'Your website is a real asset that should be actively optimized, not left static.'} As AI-powered answer engines (GEO) grow alongside classic search, being quotable and structured matters as much as ranking.`,
    recommendations: [
      {
        title: 'Publish Structured, Citable Content',
        reasoning: `Both Google and AI answer engines favor clearly structured pages that directly answer questions ${audience} is asking.`,
        psychology: 'Being the clear, structured answer builds unconscious authority before a buyer even lands on your website.',
        impact: 'Increased organic and AI-referred traffic over 3-6 months.',
        priority: answers.websiteStatus === 'No website yet' ? 'Critical' : 'High',
      },
    ],
  };

  // ---- 6-Month Action Plan (timeline) ----
  blueprint.sections.actionPlan = {
    content: `The next six months should move in three deliberate phases: foundation, validation, and scale.`,
    timeline: [
      { window: 'Weeks 1-2', title: 'Lock the Brand Sheet', detail: 'Voice, values, palette, and one-line positioning documented once, referenced everywhere.', priority: 'Critical' },
      { window: 'Weeks 3-4', title: `Launch on ${primaryChannel}`, detail: 'Publish a consistent cadence and track early engagement signals.', priority: 'Critical' },
      { window: 'Month 2', title: 'Collect & Publish Proof', detail: 'Turn early customers into testimonials, reviews, or case studies.', priority: 'High' },
      { window: 'Month 3', title: answers.paidAdsWillingness === 'Prefer to avoid it' ? 'Launch Referral Program' : 'Run a Controlled Paid Pilot', detail: 'Test acquisition with a capped budget and clear success metric.', priority: 'High' },
      { window: 'Months 4-5', title: 'Optimize the Conversion Path', detail: 'Fix drop-off points between discovery and purchase using early data.', priority: 'Medium' },
      { window: 'Month 6', title: 'Review & Reset Roadmap', detail: 'Audit what worked, kill what did not, and set the next 6-month plan.', priority: 'Medium' },
    ],
  };

  // ---- 1-Year Growth Roadmap ----
  blueprint.sections.growthRoadmap = {
    content: `Zooming out to a full year, the roadmap compounds: foundation in Q1, channel proof in Q2, scale in Q3, and defensibility in Q4.`,
    quarters: [
      { label: 'Q1', theme: 'Foundation', goals: ['Document brand system', `Establish ${primaryChannel} presence`, 'Ship first proof assets'] },
      { label: 'Q2', theme: 'Validation', goals: ['Prove one repeatable acquisition channel', 'Build email/community list', 'Refine positioning from real feedback'] },
      { label: 'Q3', theme: 'Scale', goals: ['Increase budget on the channel that works', 'Expand content production', 'Introduce referral or loyalty loop'] },
      { label: 'Q4', theme: 'Defensibility', goals: ['Deepen category authority (SEO/GEO)', 'Layer in retention marketing', 'Plan next year around proven data'] },
    ],
  };

  // ---- Priority Matrix (impact vs effort, spans multiple sections) ----
  blueprint.sections.priorityMatrix = {
    content: 'Everything above, ranked by impact versus effort so you know exactly where to start.',
    items: [
      { title: 'Document Brand Sheet', impact: 'High', effort: 'Low' },
      { title: `Launch on ${primaryChannel}`, impact: 'High', effort: 'Low' },
      { title: 'Collect Testimonials', impact: 'High', effort: 'Low' },
      { title: 'Paid Acquisition Pilot', impact: 'High', effort: 'High' },
      { title: 'Full Website Rebuild', impact: 'High', effort: 'High' },
      { title: 'SEO/GEO Content Engine', impact: 'High', effort: 'High' },
      { title: 'Social Posting Consistency', impact: 'Low', effort: 'Low' },
      { title: 'Rebranding Visual Identity from Scratch', impact: 'Low', effort: 'High' },
    ],
  };

  // ---- Dashboard Action Tasks ----
  blueprint.tasks = [
    { id: 1, title: `Write ${bName}'s One-Line Positioning Statement`, category: 'Brand', impact: '⭐⭐⭐⭐⭐', time: '1 Hour', status: 'pending' },
    { id: 2, title: `Optimize ${primaryChannel} Profile`, category: 'Marketing', impact: '⭐⭐⭐⭐', time: '1 Hour', status: 'pending' },
    { id: 3, title: 'Conduct Competitor Gap Analysis', category: 'Research', impact: '⭐⭐⭐', time: '3 Hours', status: 'pending' },
    { id: 4, title: 'Collect 3 Customer Testimonials', category: 'Content', impact: '⭐⭐⭐⭐', time: '2 Hours', status: 'pending' },
    { id: 5, title: 'Draft the 6-Month Action Timeline into Tasks', category: 'Planning', impact: '⭐⭐⭐', time: '1 Hour', status: 'pending' },
  ];

  return blueprint;
};

// ---------------------------------------------------------------------------
// DISCOVERY ENGINE — adaptive questionnaire UI with autosave + resume
// ---------------------------------------------------------------------------
const DiscoveryEngine = ({ onComplete, onSaveProgress, initialAnswers = {}, initialStep = 0 }) => {
  const [step, setStep] = useState(initialStep || 0);
  const [answers, setAnswers] = useState(initialAnswers || {});
  const [savedPulse, setSavedPulse] = useState(false);
  const saveTimer = useRef(null);

  const handleInput = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const fullSequence = useMemo(() => buildQuestionSequence(answers), [
    answers.businessType, answers.businessModel, answers.vision, answers.mainOffering,
    answers.targetAudience, answers.differentiator, answers.craftStory,
  ]);

  // Clamp step if the sequence shrank (e.g. branch changed)
  useEffect(() => {
    if (step >= fullSequence.length) setStep(Math.max(0, fullSequence.length - 1));
  }, [fullSequence.length]);

  // Auto-save progress on every change (debounced)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSaveProgress && onSaveProgress(answers, step);
      setSavedPulse(true);
      setTimeout(() => setSavedPulse(false), 1200);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [answers, step]);

  const currentQ = fullSequence[step];
  if (!currentQ) return null;
  const progress = ((step + 1) / fullSequence.length) * 100;
  const canProceed = !currentQ.mandatory || !!(answers[currentQ.key] && String(answers[currentQ.key]).trim().length > 0);

  const handleNext = () => {
    if (step < fullSequence.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <header className="p-6 border-b-2 border-[#1C1C1C] flex justify-between items-center bg-white sticky top-0 z-20">
        <div className="font-editorial font-black text-2xl tracking-tighter">KHOJI.</div>
        <div className="flex items-center space-x-4">
          <span className={`text-xs font-bold uppercase tracking-widest text-[#2E7D32] flex items-center bg-[#2E7D32]/10 px-3 py-1 border-2 border-[#2E7D32] transition-transform ${savedPulse ? 'scale-105' : ''}`}>
            <CheckCircle className="w-4 h-4 mr-2" /> {savedPulse ? 'Saved' : 'Auto-saving Context'}
          </span>
          {onSaveProgress && (
            <Button variant="ghost" className="text-xs px-3 py-2" onClick={() => onSaveProgress(answers, step, true)}>
              Continue Later
            </Button>
          )}
        </div>
      </header>

      <div className="w-full h-1.5 bg-gray-200 sticky top-[73px] z-20">
        <div className="h-full bg-[#E65C00] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Left: Progress Board */}
        <div className="w-1/3 hidden md:block p-12 border-r-2 border-[#1C1C1C] overflow-y-auto max-h-[calc(100vh-90px)]">
          <h3 className="font-bold uppercase tracking-widest text-sm text-[#1C1C1C] mb-2 border-b-2 border-[#1C1C1C] pb-2">Discovery Roadmap</h3>
          <p className="text-xs text-gray-500 mb-6">{fullSequence.length} questions tailored to a {answers.businessType || 'your'} business.</p>
          <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[11px] before:w-0.5 before:bg-gray-300">
            {fullSequence.map((q, idx) => (
              <div key={q.id} className="relative flex items-center group">
                <div className={`w-6 h-6 rounded-full border-2 z-10 flex items-center justify-center shrink-0 bg-white
                  ${step > idx ? 'border-[#2E7D32] bg-[#2E7D32]' : step === idx ? 'border-[#E65C00] bg-[#E65C00]' : 'border-gray-300'}`}>
                  {step > idx && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <span className={`ml-4 font-bold text-sm ${step === idx ? 'text-[#1C1C1C]' : 'text-gray-400'}`}>
                  {q.title}
                </span>
                {!q.mandatory && <Badge tone="subtle" className="ml-2">Optional</Badge>}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Question */}
        <div className="flex-1 p-6 md:p-16 flex flex-col justify-center relative">

          <PaperCard tape className="max-w-2xl w-full mx-auto animate-fade-slide-up" key={currentQ.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#E65C00] font-bold uppercase tracking-widest text-xs block">
                {currentQ.isAiFollowup ? 'Khoji Follow-up' : `Chapter ${step + 1} of ${fullSequence.length}`}
              </span>
              {!currentQ.mandatory && <Badge tone="subtle">Optional</Badge>}
            </div>
            <h2 className="text-3xl font-editorial font-black mb-8 leading-tight">{currentQ.question}</h2>

            {currentQ.options && (
              <div className="grid grid-cols-1 gap-4 mb-8">
                {currentQ.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleInput(currentQ.key, opt)}
                    className={`p-4 border-2 text-left font-bold transition-all flex items-center justify-between
                      ${answers[currentQ.key] === opt ? 'border-[#E65C00] bg-[#E65C00]/10 shadow-editorial' : 'border-[#1C1C1C] hover:bg-gray-50 hover:shadow-editorial-hover'}`}
                  >
                    {opt}
                    {answers[currentQ.key] === opt && <CheckCircle className="w-5 h-5 text-[#E65C00]" />}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'text' && (
              <input
                type="text"
                className="w-full p-4 border-2 border-[#1C1C1C] font-bold text-lg focus:outline-none focus:ring-0 focus:border-[#E65C00] shadow-[4px_4px_0px_0px_rgba(28,28,28,0.1)] mb-8 transition-colors"
                placeholder={currentQ.placeholder}
                value={answers[currentQ.key] || ''}
                onChange={(e) => handleInput(currentQ.key, e.target.value)}
              />
            )}

            {currentQ.type === 'textarea' && (
              <textarea
                className="w-full p-4 border-2 border-[#1C1C1C] font-medium min-h-[150px] focus:outline-none focus:ring-0 focus:border-[#E65C00] shadow-[4px_4px_0px_0px_rgba(28,28,28,0.1)] mb-8 resize-none"
                placeholder={currentQ.placeholder}
                value={answers[currentQ.key] || ''}
                onChange={(e) => handleInput(currentQ.key, e.target.value)}
              />
            )}

            <ExplainWhy summary="Why are we asking this?" explanation={currentQ.why} />
          </PaperCard>

          <div className="max-w-2xl w-full mx-auto mt-8 flex justify-between items-center">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className={`text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#1C1C1C] flex items-center ${step === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Previous
            </button>
            <div className="flex items-center gap-4">
              {!currentQ.mandatory && !answers[currentQ.key] && (
                <button onClick={handleNext} className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[#1C1C1C]">Skip</button>
              )}
              <Button
                onClick={handleNext}
                icon={step === fullSequence.length - 1 ? Zap : ArrowRight}
                disabled={!canProceed}
              >
                {step === fullSequence.length - 1 ? 'Analyze Business' : 'Continue'}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// WAR ROOM — the "AI is thinking" synthesis screen
// ---------------------------------------------------------------------------
const WarRoom = ({ onComplete, answers }) => {
  const [stage, setStage] = useState(0);
  const brandName = answers.brandName || 'your business';

  const stages = [
    { title: 'Building the Knowledge Graph', desc: `Structuring context for ${brandName}.` },
    { title: 'Competitor Discovery', desc: `Analyzing indirect and direct threats in the ${answers.industry || 'general'} space.` },
    { title: 'Customer Psychology Analysis', desc: `Evaluating behavioral drivers for ${answers.businessModel || 'your'} customers.` },
    { title: 'Positioning Synthesis', desc: 'Aligning product strengths with market gaps.' },
    { title: 'Drafting Personas & SWOT', desc: 'Translating raw answers into structured research.' },
    { title: 'Assembling Business Blueprint', desc: 'Translating strategy into execution roadmap.' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(s => {
        if (s >= stages.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 1200);
          return s;
        }
        return s + 1;
      });
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1E293B] text-[#FDFBF7] flex items-center justify-center p-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-3xl w-full relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-[#F2A900] transform rotate-3 shadow-editorial">
            <Zap className="w-8 h-8 text-[#1C1C1C]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-editorial font-black tracking-tight leading-tight">
            Consulting the Oracle.<br />Building your Strategy.
          </h1>
          <p className="text-xl text-gray-400 font-medium">Khoji is synthesizing market data with your founder vision.</p>
        </div>

        <div className="bg-[#0F172A] border-2 border-gray-600 p-8 shadow-2xl relative">
          <div className="masking-tape w-32 h-8 -top-4 left-1/2 transform -translate-x-1/2 rotate-1" />
          <div className="space-y-6">
            {stages.map((s, idx) => (
              <div key={idx} className={`flex items-start transition-all duration-700 ${idx > stage ? 'opacity-20' : 'opacity-100'}`}>
                <div className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mr-4
                  ${idx < stage ? 'bg-[#2E7D32] border-[#2E7D32]' : idx === stage ? 'border-[#F2A900] animate-pulse' : 'border-gray-600'}`}>
                  {idx < stage && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${idx === stage ? 'text-[#F2A900]' : 'text-white'}`}>{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// TEAM COLLABORATION — invite via link or code, role-based members panel
// ---------------------------------------------------------------------------
const TeamPanel = ({ project, onUpdateProject, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Editor');

  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#join=${project.inviteCode}`
    : `https://khoji.app/join/${project.inviteCode}`;

  const copy = (text, setFlag) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setFlag(true);
    setTimeout(() => setFlag(false), 1500);
  };

  const regenerateCode = () => {
    const map = loadInviteMap();
    delete map[project.inviteCode];
    const newCode = generateInviteCode();
    map[newCode] = project.id;
    persistInviteMap(map);
    onUpdateProject({ ...project, inviteCode: newCode });
  };

  const addMember = () => {
    if (!newEmail.trim()) return;
    const member = { id: uid('member'), name: newEmail.split('@')[0], email: newEmail.trim(), role: newRole };
    onUpdateProject({ ...project, members: [...(project.members || []), member] });
    setNewEmail('');
  };

  const changeRole = (memberId, role) => {
    onUpdateProject({
      ...project,
      members: project.members.map(m => m.id === memberId ? { ...m, role } : m),
    });
  };

  const removeMember = (memberId) => {
    onUpdateProject({ ...project, members: project.members.filter(m => m.id !== memberId) });
  };

  return (
    <Modal title="Team Collaboration" icon={Users} onClose={onClose} wide>
      <div className="space-y-8">
        <div>
          <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-3">Invite Teammates & Co-founders</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-[#1C1C1C] p-4 bg-white">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center mb-2"><LinkIcon className="w-3 h-3 mr-1" /> Invite Link</span>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="flex-1 text-xs font-mono-editorial bg-gray-50 border-2 border-gray-200 p-2 truncate" />
                <button onClick={() => copy(inviteLink, setCopiedLink)} className="p-2 border-2 border-[#1C1C1C] hover:bg-gray-50 shrink-0">
                  {copiedLink ? <Check className="w-4 h-4 text-[#2E7D32]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="border-2 border-[#1C1C1C] p-4 bg-white">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center mb-2"><Key className="w-3 h-3 mr-1" /> Invite Code</span>
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono-editorial font-black text-xl tracking-widest">{project.inviteCode}</span>
                <button onClick={() => copy(project.inviteCode, setCopiedCode)} className="p-2 border-2 border-[#1C1C1C] hover:bg-gray-50">
                  {copiedCode ? <Check className="w-4 h-4 text-[#2E7D32]" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={regenerateCode} className="text-[10px] font-bold uppercase text-gray-400 hover:text-[#E65C00] shrink-0">Regenerate</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-3">Add Someone Directly</h4>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-1 p-3 border-2 border-[#1C1C1C] font-medium focus:outline-none focus:border-[#E65C00]"
            />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="p-3 border-2 border-[#1C1C1C] font-bold bg-white">
              {Object.keys(ROLE_META).filter(r => r !== 'Owner').map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button icon={UserPlus} onClick={addMember}>Add</Button>
          </div>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-3">Current Members</h4>
          <div className="space-y-2">
            {(project.members || []).map(m => {
              const meta = ROLE_META[m.role] || ROLE_META.Viewer;
              return (
                <div key={m.id} className="flex items-center justify-between border-2 border-[#1C1C1C] p-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E293B] text-white flex items-center justify-center font-bold text-sm shrink-0">{(m.name || m.email || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-sm">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.role === 'Owner' ? (
                      <Badge tone="orange" className="flex items-center gap-1"><Crown className="w-3 h-3" /> Owner</Badge>
                    ) : (
                      <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value)} className="text-xs font-bold border-2 border-[#1C1C1C] p-1.5 bg-white">
                        {Object.keys(ROLE_META).filter(r => r !== 'Owner').map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                    {m.role !== 'Owner' && (
                      <button onClick={() => removeMember(m.id)} className="text-gray-400 hover:text-[#D32F2F]"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 p-4">
          <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-3">Role Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(ROLE_META).map(([role, meta]) => (
              <div key={role} className="flex items-start gap-2">
                <meta.icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: meta.color }} />
                <div>
                  <span className="font-bold text-sm block">{role}</span>
                  <span className="text-xs text-gray-500">{meta.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// BLUEPRINT VIEWER — premium consulting report with rich visual sections
// ---------------------------------------------------------------------------
const BLUEPRINT_NAV = [
  { id: 'executiveSummary', title: 'Executive Summary', icon: Bookmark },
  { id: 'brandAnalysis', title: 'Brand Analysis', icon: Sparkles },
  { id: 'productAnalysis', title: 'Product Analysis', icon: Layers },
  { id: 'marketResearch', title: 'Market Research', icon: Compass },
  { id: 'customerAnalysis', title: 'Customer Personas', icon: Users },
  { id: 'competitorAnalysis', title: 'Competitor Analysis', icon: Search },
  { id: 'positioning', title: 'Positioning', icon: Target },
  { id: 'marketingChannels', title: 'Marketing Channels', icon: MonitorSmartphone },
  { id: 'salesChannels', title: 'Sales Channels', icon: Store },
  { id: 'visualIdentity', title: 'Brand Identity', icon: PenTool },
  { id: 'contentStrategy', title: 'Content Strategy', icon: Camera },
  { id: 'seoGeoStrategy', title: 'SEO / GEO Strategy', icon: Globe },
  { id: 'actionPlan', title: '6-Month Action Plan', icon: Map },
  { id: 'growthRoadmap', title: '1-Year Growth Roadmap', icon: GitBranch },
  { id: 'priorityMatrix', title: 'Priority Matrix', icon: PieChart },
];

const BlueprintViewer = ({ blueprint, onNavigateDashboard, project, onUpdateProject }) => {
  const [activeSection, setActiveSection] = useState('executiveSummary');
  const [showTeam, setShowTeam] = useState(false);

  const renderSection = () => {
    const data = blueprint.sections[activeSection];
    if (!data) return null;
    const navMeta = BLUEPRINT_NAV.find(s => s.id === activeSection);

    return (
      <div className="animate-fade-slide-up" key={activeSection}>
        <div className="flex items-center gap-3 mb-8 pb-4 border-b-4 border-[#1C1C1C]">
          {navMeta && <navMeta.icon className="w-8 h-8 text-[#E65C00] shrink-0" />}
          <h2 className="text-4xl font-editorial font-black">{navMeta?.title}</h2>
        </div>

        {data.content && <p className="text-xl font-editorial leading-relaxed text-gray-800 mb-8">{data.content}</p>}

        {data.highlights && (
          <ul className="space-y-3 mb-10">
            {data.highlights.map((h, i) => (
              <li key={i} className="flex items-start bg-white border-2 border-[#1C1C1C] p-4 shadow-editorial-sm">
                <Flag className="w-4 h-4 text-[#E65C00] mr-3 mt-1 shrink-0" />
                <span className="font-medium">{h}</span>
              </li>
            ))}
          </ul>
        )}

        {data.beforeAfter && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Strategic Transformation</h3>
            <BeforeAfter before={data.beforeAfter.before} after={data.beforeAfter.after} />
          </div>
        )}

        {data.swot && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">SWOT Matrix</h3>
            <SwotMatrix swot={data.swot} />
          </div>
        )}

        {data.personas && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Customer Persona Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.personas.map((p, i) => <PersonaCard key={i} persona={p} />)}
            </div>
          </div>
        )}

        {data.competitors && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Competitor Comparison</h3>
            <CompetitorTable competitors={data.competitors} brandName={blueprint.brandName} />
          </div>
        )}

        {data.matrix && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Brand Positioning Matrix</h3>
            <PositioningMatrix axes={data.matrix.axes} points={data.matrix.points} brandName={blueprint.brandName} />
          </div>
        )}

        {data.palette && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Recommended Palette</h3>
            <PaletteSwatches palette={data.palette} />
            {data.typography && (
              <div className="mt-6 border-2 border-[#1C1C1C] p-5 bg-white">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Typography System</span>
                <p className="font-editorial text-2xl font-bold">{data.typography}</p>
              </div>
            )}
            {data.archetype && (
              <div className="mt-4 border-2 border-[#1C1C1C] p-5 bg-[#F2A900]/10 flex items-center">
                <Palette className="w-5 h-5 text-[#E65C00] mr-3 shrink-0" />
                <span className="font-bold">Brand Archetype: <span className="font-editorial text-lg">{data.archetype}</span></span>
              </div>
            )}
          </div>
        )}

        {data.pillars && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Content Pillars</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.pillars.map((p, i) => (
                <div key={i} className="border-2 border-[#1C1C1C] p-5 bg-white shadow-editorial-sm">
                  <h4 className="font-editorial font-bold text-lg mb-1">{p.name}</h4>
                  <p className="text-sm text-gray-600">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.timeline && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-6">6-Month Timeline</h3>
            <HorizontalTimeline items={data.timeline} />
          </div>
        )}

        {data.quarters && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">1-Year Roadmap</h3>
            <RoadmapQuarters quarters={data.quarters} />
          </div>
        )}

        {data.items && (
          <div className="mb-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Impact vs Effort</h3>
            <PriorityMatrix items={data.items} />
          </div>
        )}

        {data.recommendations && (
          <div className="space-y-8 mt-12">
            <h3 className="font-bold uppercase tracking-widest text-sm text-gray-500 mb-4">Actionable Recommendations</h3>
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="bg-white border-2 border-[#1C1C1C] p-6 shadow-editorial relative">
                <div className="absolute top-0 right-0 bg-[#1C1C1C] text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">
                  Priority: {rec.priority}
                </div>
                <h4 className="text-2xl font-editorial font-bold mb-4 pr-24">{rec.title}</h4>
                <ExplainWhy
                  summary="Explain this recommendation"
                  explanation={rec.reasoning}
                  psychology={rec.psychology}
                  impact={rec.impact}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {showTeam && project && <TeamPanel project={project} onUpdateProject={onUpdateProject} onClose={() => setShowTeam(false)} />}

      {/* Sidebar Navigation */}
      <aside className="w-80 bg-white border-r-2 border-[#1C1C1C] flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-8 border-b-2 border-[#1C1C1C] bg-[#F2A900]/10">
          <div className="font-editorial font-black text-3xl mb-1">{blueprint.brandName}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Business Blueprint v{blueprint.version}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {BLUEPRINT_NAV.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center px-4 py-2.5 font-bold text-left text-sm transition-all border-2
                ${activeSection === s.id ? 'bg-[#1C1C1C] text-white border-[#1C1C1C] shadow-editorial-sm translate-x-1' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200'}`}
            >
              <s.icon className="w-4 h-4 mr-3 shrink-0" />
              {s.title}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t-2 border-[#1C1C1C] bg-gray-50 space-y-3">
          {project && <Button variant="secondary" onClick={() => setShowTeam(true)} className="w-full" icon={Users}>Team ({(project.members || []).length})</Button>}
          <Button onClick={onNavigateDashboard} className="w-full" icon={ArrowRight}>Action Center</Button>
        </div>
      </aside>

      {/* Main Content Area (Magazine Layout) */}
      <main className="flex-1 p-12 lg:p-24 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 mb-16 pb-8 border-b-2 border-gray-200">
            {Object.entries(blueprint.healthScores).map(([key, score]) => (
              <div key={key} className="flex flex-col bg-white border-2 border-[#1C1C1C] p-4 flex-1 min-w-[120px] shadow-[4px_4px_0px_0px_rgba(28,28,28,0.1)]">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{key}</span>
                <span className="font-editorial font-black text-2xl text-[#1C1C1C]">{score}</span>
                <div className="w-full bg-gray-200 h-1 mt-2">
                  <div className="bg-[#E65C00] h-full" style={{ width: `${score}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          {renderSection()}
        </div>
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PROJECT DASHBOARD — Action Center for a single project
// ---------------------------------------------------------------------------
const ProjectDashboard = ({ project, onUpdateProject, onNavigateBlueprint, onNavigateProjects }) => {
  const blueprint = project.blueprint;
  const [showTeam, setShowTeam] = useState(false);
  const tasks = blueprint.tasks || [];
  const completedCount = tasks.filter(t => t.status === 'done').length;

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t);
    onUpdateProject({ ...project, blueprint: { ...blueprint, tasks: updatedTasks } });
  };

  const progressPct = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#1C1C1C]">
      {showTeam && <TeamPanel project={project} onUpdateProject={onUpdateProject} onClose={() => setShowTeam(false)} />}

      <header className="bg-white border-b-2 border-[#1C1C1C] px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onNavigateProjects} className="text-gray-400 hover:text-[#1C1C1C] mr-2" title="All Projects"><Home className="w-5 h-5" /></button>
          <div className="w-12 h-12 bg-[#1E293B] text-white flex items-center justify-center font-editorial font-black text-2xl shadow-[4px_4px_0px_0px_#E65C00] border-2 border-[#1C1C1C]">
            {blueprint.brandName.charAt(0)}
          </div>
          <div>
            <h1 className="font-editorial font-bold text-2xl leading-none">{blueprint.brandName}</h1>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Strategy Headquarters</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" className="py-2 px-4 text-sm" icon={Users} onClick={() => setShowTeam(true)}>Team ({(project.members || []).length})</Button>
          <Button variant="secondary" className="py-2 px-4 text-sm" icon={BookOpen} onClick={onNavigateBlueprint}>Read Blueprint</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Action Center */}
        <div className="lg:col-span-8 space-y-12">

          <section>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#E65C00] p-2 text-white shadow-editorial"><Target className="w-6 h-6" /></div>
              <h2 className="text-4xl font-editorial font-black">Today's Focus</h2>
            </div>
            <p className="text-lg text-gray-600 mb-4 border-l-4 border-[#1C1C1C] pl-4 py-1">
              Khoji has prioritized these actions based on your business stage ({blueprint.industry}).
            </p>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 bg-gray-200 h-2 border border-[#1C1C1C]"><div className="bg-[#2E7D32] h-full transition-all duration-500" style={{ width: `${progressPct}%` }} /></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500 shrink-0">{completedCount}/{tasks.length} done</span>
            </div>

            <div className="space-y-6">
              {tasks.map(task => (
                <PaperCard tape key={task.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group ${task.status === 'done' ? 'opacity-60' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-[#1C1C1C] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">{task.category}</span>
                      <span className="text-xs font-bold text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {task.time}</span>
                    </div>
                    <h3 className={`text-2xl font-editorial font-bold group-hover:text-[#E65C00] transition-colors ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</h3>
                  </div>
                  <Button icon={CheckSquare} variant={task.status === 'done' ? 'primary' : 'secondary'} onClick={() => toggleTask(task.id)}>
                    {task.status === 'done' ? 'Completed' : 'Start Task'}
                  </Button>
                </PaperCard>
              ))}
            </div>
          </section>

          <section className="bg-[#1E293B] text-white p-12 shadow-editorial relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10"><BarChart3 className="w-64 h-64" /></div>
            <h3 className="text-3xl font-editorial font-black mb-6 relative z-10">Growth Timeline</h3>
            <div className="space-y-8 relative z-10">
              <div>
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-2">
                  <span>30 Days (Foundations)</span>
                  <span className="text-[#F2A900]">In Progress</span>
                </div>
                <div className="w-full bg-gray-700 h-3 border-2 border-[#1C1C1C]"><div className="bg-[#F2A900] h-full" style={{ width: `${Math.max(10, progressPct)}%` }}></div></div>
              </div>
              <div className="opacity-50">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-2">
                  <span>90 Days (Scaling)</span>
                  <span>Locked</span>
                </div>
                <div className="w-full bg-gray-700 h-3 border-2 border-[#1C1C1C]"><div className="bg-[#E65C00] h-full w-0"></div></div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Insights & Activity */}
        <div className="lg:col-span-4 space-y-8">

          <div className="bg-[#F2A900]/10 border-2 border-[#1C1C1C] p-6 relative">
            <div className="masking-tape w-24 h-6 -top-3 right-4 transform rotate-6" />
            <h3 className="flex items-center font-editorial font-black text-xl mb-4 pb-2 border-b-2 border-[#1C1C1C]">
              <Lightbulb className="w-5 h-5 mr-2 text-[#E65C00]" /> Strategy Note
            </h3>
            <p className="text-sm font-medium leading-relaxed mb-6">
              "{blueprint.sections.executiveSummary?.highlights?.[0] || `Focus on entirely on the foundational Brand Identity tasks before scaling paid acquisition.`}"
            </p>
            <Button variant="tertiary" className="p-0 text-sm" onClick={onNavigateBlueprint}>Review Brand Strategy</Button>
          </div>

          <PaperCard>
            <h3 className="font-editorial font-black text-xl mb-6 pb-2 border-b-2 border-[#1C1C1C]">Activity Timeline</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:bg-gray-200">
              <div className="relative flex items-start">
                <div className="w-5 h-5 rounded-full bg-[#2E7D32] border-2 border-[#1C1C1C] z-10 mt-0.5 shrink-0"></div>
                <div className="ml-4">
                  <p className="text-sm font-bold">Blueprint Generated</p>
                  <p className="text-xs text-gray-500 font-mono-editorial mt-1">{project.updatedAt ? new Date(project.updatedAt).toLocaleString() : 'Just now'}</p>
                </div>
              </div>
              <div className="relative flex items-start opacity-60">
                <div className="w-5 h-5 rounded-full bg-white border-2 border-[#1C1C1C] z-10 mt-0.5 shrink-0"></div>
                <div className="ml-4">
                  <p className="text-sm font-bold">Discovery Engine Completed</p>
                  <p className="text-xs text-gray-500 font-mono-editorial mt-1">{project.createdAt ? new Date(project.createdAt).toLocaleString() : 'Recently'}</p>
                </div>
              </div>
            </div>
          </PaperCard>

          <PaperCard>
            <h3 className="font-editorial font-black text-xl mb-4 pb-2 border-b-2 border-[#1C1C1C] flex items-center"><Users className="w-5 h-5 mr-2" /> Team</h3>
            <div className="flex -space-x-3 mb-4">
              {(project.members || []).slice(0, 6).map(m => (
                <div key={m.id} title={m.name} className="w-10 h-10 rounded-full bg-[#1E293B] text-white flex items-center justify-center font-bold text-sm border-2 border-white">
                  {(m.name || m.email || '?').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <Button variant="secondary" className="w-full text-sm" icon={UserPlus} onClick={() => setShowTeam(true)}>Invite Collaborators</Button>
          </PaperCard>

        </div>
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PROJECTS HUB — the project-based workspace: create, list, resume projects
// ---------------------------------------------------------------------------
const ProjectsHub = ({ projects, onCreate, onOpen, onDelete, onShowJoin }) => {
  const statusMeta = {
    discovery: { label: 'In Discovery', tone: 'yellow' },
    warroom: { label: 'Synthesizing', tone: 'orange' },
    blueprint: { label: 'Blueprint Ready', tone: 'green' },
    dashboard: { label: 'Active', tone: 'green' },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans">
      <header className="bg-white border-b-2 border-[#1C1C1C] px-8 py-5 flex justify-between items-center sticky top-0 z-20">
        <div className="font-editorial font-black text-2xl tracking-tighter">KHOJI.</div>
        <Button variant="tertiary" className="text-sm" onClick={onShowJoin}>Have an invite code?</Button>
      </header>

      <main className="max-w-6xl mx-auto p-8 md:p-16">
        <div className="mb-12">
          <h1 className="text-5xl font-editorial font-black mb-3">Your Projects</h1>
          <p className="text-lg text-gray-600">Every brand you're building, in one strategy workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PaperCard onClick={onCreate} className="flex flex-col items-center justify-center text-center border-dashed py-16 hover:bg-gray-50">
            <FolderPlus className="w-10 h-10 text-[#E65C00] mb-4" />
            <span className="font-editorial font-black text-xl">New Project</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Start a fresh Discovery Engine</span>
          </PaperCard>

          {projects.slice().reverse().map(p => {
            const meta = statusMeta[p.status] || statusMeta.discovery;
            const tasks = p.blueprint?.tasks || [];
            const done = tasks.filter(t => t.status === 'done').length;
            return (
              <PaperCard key={p.id} onClick={() => onOpen(p)} className="flex flex-col relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#1E293B] text-white flex items-center justify-center font-editorial font-black text-xl border-2 border-[#1C1C1C]">
                    {(p.name || 'K').charAt(0)}
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
                <h3 className="font-editorial font-black text-2xl mb-1">{p.name || 'Untitled Project'}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Updated {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}</p>
                {tasks.length > 0 && (
                  <div className="mt-auto">
                    <div className="w-full bg-gray-200 h-1.5 border border-[#1C1C1C] mb-1">
                      <div className="bg-[#2E7D32] h-full" style={{ width: `${Math.round((done / tasks.length) * 100)}%` }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{done}/{tasks.length} tasks complete</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-400 flex items-center"><Users className="w-3 h-3 mr-1" /> {(p.members || []).length} member{(p.members || []).length === 1 ? '' : 's'}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="text-xs font-bold text-gray-300 hover:text-[#D32F2F] uppercase tracking-widest">Delete</button>
                </div>
              </PaperCard>
            );
          })}
        </div>
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------
// JOIN PROJECT — accept an invite code and join a shared workspace
// ---------------------------------------------------------------------------
const JoinProject = ({ onJoin, onCancel, prefillCode = '' }) => {
  const [code, setCode] = useState(prefillCode);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const map = loadInviteMap();
    const projectId = map[code.trim().toUpperCase()];
    if (!projectId) {
      setError("We couldn't find a project with that code. Double check it and try again.");
      return;
    }
    if (!name.trim()) {
      setError('Tell us your name so your teammates recognize you.');
      return;
    }
    onJoin(projectId, name.trim());
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <PaperCard tape className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#1E293B] p-2 text-white shadow-editorial"><Key className="w-6 h-6" /></div>
          <h2 className="text-3xl font-editorial font-black">Join a Project</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">Enter the invite code your teammate shared with you to join their shared Khoji workspace.</p>

        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-1">Your Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="w-full p-3 border-2 border-[#1C1C1C] font-bold mb-4 focus:outline-none focus:border-[#E65C00]" />

        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-1">Invite Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" className="w-full p-3 border-2 border-[#1C1C1C] font-mono-editorial font-black text-2xl tracking-widest mb-2 focus:outline-none focus:border-[#E65C00]" />
        {error && <p className="text-xs text-[#D32F2F] font-bold mb-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={handleJoin} className="flex-1" icon={ArrowRight}>Join Project</Button>
        </div>
      </PaperCard>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ROOT APP — routing, project CRUD, and persistence orchestration
// ---------------------------------------------------------------------------
export default function KhojiApp() {
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  // Load persisted projects on mount
  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
  }, []);

  // Persist projects whenever they change
  useEffect(() => {
    if (projects.length >= 0) persistProjects(projects);
  }, [projects]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentRoute]);

  const updateProject = (updated) => {
    const withTimestamp = { ...updated, updatedAt: Date.now() };
    setProjects(prev => prev.map(p => (p.id === withTimestamp.id ? withTimestamp : p)));
  };

  const createProject = () => {
    const inviteCode = generateInviteCode();
    const newProject = {
      id: uid('proj'),
      name: 'Untitled Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'discovery',
      answers: {},
      currentStep: 0,
      blueprint: null,
      inviteCode,
      members: [{ id: uid('member'), name: 'You', email: 'you@yourbrand.com', role: 'Owner' }],
    };
    const map = loadInviteMap();
    map[inviteCode] = newProject.id;
    persistInviteMap(map);

    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setCurrentRoute('discovery');
  };

  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) setActiveProjectId(null);
  };

  const openProject = (project) => {
    setActiveProjectId(project.id);
    setCurrentRoute(project.status || 'discovery');
  };

  const handleSaveDiscoveryProgress = (answers, step, goToHub = false) => {
    if (!activeProject) return;
    updateProject({
      ...activeProject,
      name: answers.brandName || activeProject.name,
      answers,
      currentStep: step,
      status: 'discovery',
    });
    if (goToHub) setCurrentRoute('projects');
  };

  const handleDiscoveryComplete = (answers) => {
    updateProject({
      ...activeProject,
      name: answers.brandName || activeProject.name,
      answers,
      status: 'warroom',
    });
    setCurrentRoute('warroom');
  };

  const handleWarRoomComplete = () => {
    const newBlueprint = generateDynamicBlueprint(activeProject.answers);
    updateProject({
      ...activeProject,
      name: newBlueprint.brandName,
      blueprint: newBlueprint,
      status: 'blueprint',
    });
    setCurrentRoute('blueprint');
  };

  const handleJoinProject = (projectId, memberName) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const newMember = { id: uid('member'), name: memberName, email: `${memberName.toLowerCase().replace(/\s+/g, '.')}@teammate.com`, role: 'Viewer' };
    const updated = { ...proj, members: [...(proj.members || []), newMember] };
    updateProject(updated);
    setActiveProjectId(proj.id);
    setCurrentRoute(proj.status || 'dashboard');
  };

  return (
    <div className="antialiased min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {currentRoute === 'landing' && (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#FDFBF7] p-8">
          <div className="max-w-3xl text-center space-y-8 relative">
            <div className="masking-tape w-48 h-8 -top-6 left-1/2 transform -translate-x-1/2 rotate-2" />
            <div className="inline-block p-4 bg-[#1C1C1C] text-white shadow-[6px_6px_0px_0px_#E65C00] transform -rotate-1 mb-8">
              <h1 className="font-editorial text-7xl font-black tracking-tighter uppercase">KHOJI.</h1>
            </div>
            <h2 className="text-4xl md:text-5xl font-editorial font-bold text-[#1C1C1C] leading-tight">
              Where your search ends.
            </h2>
            <p className="text-xl text-gray-600 font-medium max-w-xl mx-auto border-l-4 border-[#E65C00] pl-6 text-left">
              Khoji is an AI Business Intelligence & Strategy Operating System. We transform your business context into a bespoke, actionable roadmap.
            </p>
            <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
              <Button onClick={createProject} icon={ArrowRight} className="text-lg px-8 py-4">Begin Discovery Engine</Button>
              {projects.length > 0 && (
                <Button variant="secondary" onClick={() => setCurrentRoute('projects')} icon={Briefcase} className="text-lg px-8 py-4">
                  View My Projects ({projects.length})
                </Button>
              )}
            </div>
            <button onClick={() => setCurrentRoute('join')} className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[#1C1C1C] underline underline-offset-4">
              Have an invite code? Join a teammate's project
            </button>
          </div>
        </div>
      )}

      {currentRoute === 'projects' && (
        <ProjectsHub
          projects={projects}
          onCreate={createProject}
          onOpen={openProject}
          onDelete={deleteProject}
          onShowJoin={() => setCurrentRoute('join')}
        />
      )}

      {currentRoute === 'join' && (
        <JoinProject
          onJoin={handleJoinProject}
          onCancel={() => setCurrentRoute(projects.length ? 'projects' : 'landing')}
        />
      )}

      {currentRoute === 'discovery' && activeProject && (
        <DiscoveryEngine
          onComplete={handleDiscoveryComplete}
          onSaveProgress={handleSaveDiscoveryProgress}
          initialAnswers={activeProject.answers}
          initialStep={activeProject.currentStep}
        />
      )}

      {currentRoute === 'warroom' && activeProject && (
        <WarRoom answers={activeProject.answers || {}} onComplete={handleWarRoomComplete} />
      )}

      {currentRoute === 'blueprint' && activeProject?.blueprint && (
        <BlueprintViewer
          blueprint={activeProject.blueprint}
          project={activeProject}
          onUpdateProject={updateProject}
          onNavigateDashboard={() => setCurrentRoute('dashboard')}
        />
      )}

      {currentRoute === 'dashboard' && activeProject?.blueprint && (
        <ProjectDashboard
          project={activeProject}
          onUpdateProject={updateProject}
          onNavigateBlueprint={() => setCurrentRoute('blueprint')}
          onNavigateProjects={() => setCurrentRoute('projects')}
        />
      )}
    </div>
  );
}
