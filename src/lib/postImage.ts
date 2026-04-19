// =============================================
// LinkedIn Post Image Generator (Canvas-based)
// Produces professional text-card images designed to
// stop the LinkedIn scroll. Inspired by the visual
// language of top tech creators (minimal, high-contrast,
// typographic, subtle visual patterns).
// =============================================

export type ImageStyle =
  // Hook-style (premium gradient with avatar at bottom)
  | 'hook-indigo'
  | 'hook-sunset'
  | 'hook-emerald'
  | 'hook-ocean'
  | 'hook-rose'
  | 'hook-midnight'
  | 'hook-crimson'
  // Minimal light
  | 'minimal-light'
  | 'minimal-paper'
  | 'minimal-mint'
  // Terminal / code
  | 'code-dark'
  | 'code-light'
  | 'code-matrix'
  // Split-sidebar
  | 'split-accent'
  | 'split-emerald'
  | 'split-amber'
  | 'split-crimson'
  // Stat cards
  | 'stat-bold'
  | 'stat-amber'
  | 'stat-purple'
  | 'stat-crimson'
  // New layouts
  | 'quote-serif'
  | 'neon-cyber'
  | 'blueprint'
  | 'magazine-cover'
  | 'gradient-mesh';

interface ImageOptions {
  hookText: string;
  subtext?: string;           // secondary line under the hook (e.g. first sentence of post)
  category?: string;          // top tag (e.g. "INSIGHT", "CASE STUDY", "TIP")
  authorName?: string;
  authorTitle?: string;
  style: ImageStyle;
  width?: number;
  height?: number;
}

interface Theme {
  bg: [string, string];       // gradient colors
  text: string;
  subtle: string;
  accent: string;
  accent2: string;
  categoryBg: string;
  categoryText: string;
  isDark: boolean;
  pattern: 'dots' | 'grid' | 'lines' | 'none';
  font: string;
  monoFont: string;
}

const THEMES: Record<ImageStyle, Theme> = {
  'hook-indigo': {
    bg: ['#0b0f25', '#1e1b4b'],
    text: '#f5f7ff',
    subtle: '#a5b4fc',
    accent: '#8b5cf6',
    accent2: '#06b6d4',
    categoryBg: 'rgba(139,92,246,0.15)',
    categoryText: '#c4b5fd',
    isDark: true,
    pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'hook-sunset': {
    bg: ['#1a0b00', '#451a03'],
    text: '#fff7ed',
    subtle: '#fed7aa',
    accent: '#f97316',
    accent2: '#fbbf24',
    categoryBg: 'rgba(251,146,60,0.18)',
    categoryText: '#fed7aa',
    isDark: true,
    pattern: 'lines',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'minimal-light': {
    bg: ['#fafafa', '#f4f4f5'],
    text: '#18181b',
    subtle: '#71717a',
    accent: '#6366f1',
    accent2: '#06b6d4',
    categoryBg: 'rgba(99,102,241,0.1)',
    categoryText: '#6366f1',
    isDark: false,
    pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'code-dark': {
    bg: ['#020617', '#0f172a'],
    text: '#e2e8f0',
    subtle: '#64748b',
    accent: '#10b981',
    accent2: '#22d3ee',
    categoryBg: 'rgba(16,185,129,0.12)',
    categoryText: '#34d399',
    isDark: true,
    pattern: 'none',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  'split-accent': {
    bg: ['#0c0a1d', '#1a1635'],
    text: '#f5f3ff',
    subtle: '#c4b5fd',
    accent: '#a855f7',
    accent2: '#ec4899',
    categoryBg: 'rgba(168,85,247,0.2)',
    categoryText: '#e9d5ff',
    isDark: true,
    pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'stat-bold': {
    bg: ['#042f2e', '#064e3b'],
    text: '#ecfdf5',
    subtle: '#a7f3d0',
    accent: '#10b981',
    accent2: '#fbbf24',
    categoryBg: 'rgba(16,185,129,0.18)',
    categoryText: '#6ee7b7',
    isDark: true,
    pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },

  // ---------- Hook variants ----------
  'hook-emerald': {
    bg: ['#022c22', '#064e3b'], text: '#ecfdf5', subtle: '#6ee7b7',
    accent: '#10b981', accent2: '#34d399',
    categoryBg: 'rgba(16,185,129,0.18)', categoryText: '#6ee7b7',
    isDark: true, pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'hook-ocean': {
    bg: ['#082f49', '#0c4a6e'], text: '#ecfeff', subtle: '#7dd3fc',
    accent: '#06b6d4', accent2: '#0ea5e9',
    categoryBg: 'rgba(6,182,212,0.18)', categoryText: '#67e8f9',
    isDark: true, pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'hook-rose': {
    bg: ['#1f0a1a', '#4c0519'], text: '#fff1f2', subtle: '#fda4af',
    accent: '#e11d48', accent2: '#f472b6',
    categoryBg: 'rgba(225,29,72,0.2)', categoryText: '#fda4af',
    isDark: true, pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'hook-midnight': {
    bg: ['#030712', '#111827'], text: '#f9fafb', subtle: '#9ca3af',
    accent: '#3b82f6', accent2: '#8b5cf6',
    categoryBg: 'rgba(59,130,246,0.18)', categoryText: '#93c5fd',
    isDark: true, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'hook-crimson': {
    bg: ['#190000', '#450a0a'], text: '#fef2f2', subtle: '#fca5a5',
    accent: '#ef4444', accent2: '#f59e0b',
    categoryBg: 'rgba(239,68,68,0.2)', categoryText: '#fca5a5',
    isDark: true, pattern: 'lines',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },

  // ---------- Minimal variants ----------
  'minimal-paper': {
    bg: ['#fefce8', '#fef9c3'], text: '#1c1917', subtle: '#78716c',
    accent: '#a16207', accent2: '#ca8a04',
    categoryBg: 'rgba(161,98,7,0.12)', categoryText: '#a16207',
    isDark: false, pattern: 'dots',
    font: 'Georgia, "Times New Roman", serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'minimal-mint': {
    bg: ['#f0fdf4', '#dcfce7'], text: '#14532d', subtle: '#65a30d',
    accent: '#16a34a', accent2: '#4ade80',
    categoryBg: 'rgba(22,163,74,0.12)', categoryText: '#15803d',
    isDark: false, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },

  // ---------- Code variants ----------
  'code-light': {
    bg: ['#fafafa', '#f5f5f5'], text: '#18181b', subtle: '#71717a',
    accent: '#7c3aed', accent2: '#db2777',
    categoryBg: 'rgba(124,58,237,0.1)', categoryText: '#7c3aed',
    isDark: false, pattern: 'none',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  'code-matrix': {
    bg: ['#000000', '#001a00'], text: '#00ff41', subtle: '#008f11',
    accent: '#00ff41', accent2: '#39ff14',
    categoryBg: 'rgba(0,255,65,0.12)', categoryText: '#39ff14',
    isDark: true, pattern: 'none',
    font: 'ui-monospace, "SF Mono", Menlo, monospace',
    monoFont: 'ui-monospace, "SF Mono", Menlo, monospace',
  },

  // ---------- Split variants ----------
  'split-emerald': {
    bg: ['#022c22', '#064e3b'], text: '#ecfdf5', subtle: '#6ee7b7',
    accent: '#10b981', accent2: '#22d3ee',
    categoryBg: 'rgba(16,185,129,0.2)', categoryText: '#6ee7b7',
    isDark: true, pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'split-amber': {
    bg: ['#1c1917', '#451a03'], text: '#fff7ed', subtle: '#fed7aa',
    accent: '#f59e0b', accent2: '#fbbf24',
    categoryBg: 'rgba(245,158,11,0.2)', categoryText: '#fcd34d',
    isDark: true, pattern: 'lines',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'split-crimson': {
    bg: ['#190000', '#4c0519'], text: '#fef2f2', subtle: '#fda4af',
    accent: '#ef4444', accent2: '#f472b6',
    categoryBg: 'rgba(239,68,68,0.2)', categoryText: '#fecaca',
    isDark: true, pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },

  // ---------- Stat variants ----------
  'stat-amber': {
    bg: ['#1c1917', '#451a03'], text: '#fff7ed', subtle: '#fed7aa',
    accent: '#f59e0b', accent2: '#f97316',
    categoryBg: 'rgba(245,158,11,0.18)', categoryText: '#fcd34d',
    isDark: true, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'stat-purple': {
    bg: ['#2e1065', '#4c1d95'], text: '#faf5ff', subtle: '#d8b4fe',
    accent: '#a855f7', accent2: '#ec4899',
    categoryBg: 'rgba(168,85,247,0.2)', categoryText: '#e9d5ff',
    isDark: true, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'stat-crimson': {
    bg: ['#450a0a', '#7f1d1d'], text: '#fef2f2', subtle: '#fecaca',
    accent: '#ef4444', accent2: '#fbbf24',
    categoryBg: 'rgba(239,68,68,0.2)', categoryText: '#fecaca',
    isDark: true, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },

  // ---------- New distinctive layouts ----------
  'quote-serif': {
    bg: ['#fafaf9', '#f5f5f4'], text: '#1c1917', subtle: '#78716c',
    accent: '#1c1917', accent2: '#a16207',
    categoryBg: 'rgba(28,25,23,0.08)', categoryText: '#44403c',
    isDark: false, pattern: 'none',
    font: 'Georgia, "Times New Roman", serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'neon-cyber': {
    bg: ['#0a0014', '#1a0033'], text: '#f0abfc', subtle: '#d8b4fe',
    accent: '#e879f9', accent2: '#22d3ee',
    categoryBg: 'rgba(232,121,249,0.2)', categoryText: '#f0abfc',
    isDark: true, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  'blueprint': {
    bg: ['#0c1e3d', '#1e3a8a'], text: '#dbeafe', subtle: '#93c5fd',
    accent: '#60a5fa', accent2: '#fef3c7',
    categoryBg: 'rgba(96,165,250,0.18)', categoryText: '#bfdbfe',
    isDark: true, pattern: 'grid',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  'magazine-cover': {
    bg: ['#000000', '#1a1a1a'], text: '#ffffff', subtle: '#a3a3a3',
    accent: '#fbbf24', accent2: '#ef4444',
    categoryBg: 'rgba(251,191,36,0.2)', categoryText: '#fde68a',
    isDark: true, pattern: 'none',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
  'gradient-mesh': {
    bg: ['#0f0f1e', '#1a0f2e'], text: '#ffffff', subtle: '#c4b5fd',
    accent: '#a855f7', accent2: '#06b6d4',
    categoryBg: 'rgba(168,85,247,0.18)', categoryText: '#e9d5ff',
    isDark: true, pattern: 'dots',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, Menlo, monospace',
  },
};

export const IMAGE_STYLE_OPTIONS: {
  id: ImageStyle;
  label: string;
  description: string;
  family: string; // for filter tabs
  preview: [string, string];
}[] = [
  // Hook family
  { id: 'hook-indigo', label: 'Indigo', description: 'Premium, insights', family: 'hook', preview: ['#0b0f25', '#1e1b4b'] },
  { id: 'hook-sunset', label: 'Sunset', description: 'Warm, stories', family: 'hook', preview: ['#1a0b00', '#451a03'] },
  { id: 'hook-emerald', label: 'Emerald', description: 'Money / growth', family: 'hook', preview: ['#022c22', '#064e3b'] },
  { id: 'hook-ocean', label: 'Ocean', description: 'Tech-forward', family: 'hook', preview: ['#082f49', '#0c4a6e'] },
  { id: 'hook-rose', label: 'Rose', description: 'Bold, personal', family: 'hook', preview: ['#1f0a1a', '#4c0519'] },
  { id: 'hook-midnight', label: 'Midnight', description: 'Corporate, premium', family: 'hook', preview: ['#030712', '#111827'] },
  { id: 'hook-crimson', label: 'Crimson', description: 'High-energy', family: 'hook', preview: ['#190000', '#450a0a'] },

  // Minimal family
  { id: 'minimal-light', label: 'Minimal', description: 'Clean, B2B', family: 'minimal', preview: ['#fafafa', '#f4f4f5'] },
  { id: 'minimal-paper', label: 'Paper', description: 'Serif, editorial', family: 'minimal', preview: ['#fefce8', '#fef9c3'] },
  { id: 'minimal-mint', label: 'Mint', description: 'Fresh, green', family: 'minimal', preview: ['#f0fdf4', '#dcfce7'] },

  // Code family
  { id: 'code-dark', label: 'Terminal', description: 'Dev / IDE vibe', family: 'code', preview: ['#020617', '#0f172a'] },
  { id: 'code-light', label: 'Terminal Light', description: 'Clean code vibe', family: 'code', preview: ['#fafafa', '#f5f5f5'] },
  { id: 'code-matrix', label: 'Matrix', description: 'Hacker aesthetic', family: 'code', preview: ['#000000', '#001a00'] },

  // Split family
  { id: 'split-accent', label: 'Split Purple', description: 'Magazine feel', family: 'split', preview: ['#0c0a1d', '#1a1635'] },
  { id: 'split-emerald', label: 'Split Emerald', description: 'Growth stories', family: 'split', preview: ['#022c22', '#064e3b'] },
  { id: 'split-amber', label: 'Split Amber', description: 'Warm, case studies', family: 'split', preview: ['#1c1917', '#451a03'] },
  { id: 'split-crimson', label: 'Split Crimson', description: 'Hot takes', family: 'split', preview: ['#190000', '#4c0519'] },

  // Stat family
  { id: 'stat-bold', label: 'Stat Emerald', description: 'ROI, growth %', family: 'stat', preview: ['#042f2e', '#064e3b'] },
  { id: 'stat-amber', label: 'Stat Amber', description: 'Time savings', family: 'stat', preview: ['#1c1917', '#451a03'] },
  { id: 'stat-purple', label: 'Stat Purple', description: 'Results, impact', family: 'stat', preview: ['#2e1065', '#4c1d95'] },
  { id: 'stat-crimson', label: 'Stat Crimson', description: 'Bold metrics', family: 'stat', preview: ['#450a0a', '#7f1d1d'] },

  // Distinctive
  { id: 'quote-serif', label: 'Classic Quote', description: 'Timeless, editorial', family: 'special', preview: ['#fafaf9', '#f5f5f4'] },
  { id: 'neon-cyber', label: 'Neon Cyber', description: 'Futuristic, bold', family: 'special', preview: ['#0a0014', '#1a0033'] },
  { id: 'blueprint', label: 'Blueprint', description: 'Technical, architect', family: 'special', preview: ['#0c1e3d', '#1e3a8a'] },
  { id: 'magazine-cover', label: 'Magazine', description: 'High-contrast cover', family: 'special', preview: ['#000000', '#1a1a1a'] },
  { id: 'gradient-mesh', label: 'Mesh Gradient', description: 'Modern, design-forward', family: 'special', preview: ['#0f0f1e', '#1a0f2e'] },
];

export const IMAGE_FAMILIES = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'hook', label: 'Hook', emoji: '📌' },
  { id: 'stat', label: 'Stat', emoji: '📊' },
  { id: 'split', label: 'Split', emoji: '🎨' },
  { id: 'code', label: 'Code', emoji: '💻' },
  { id: 'minimal', label: 'Minimal', emoji: '⚪' },
  { id: 'special', label: 'Special', emoji: '🌟' },
];

// ---------- text helpers ----------

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function initials(name?: string): string {
  if (!name) return 'You';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'You';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

// Infer a category label from the hook text if none provided
function inferCategory(hook: string): string {
  const t = hook.toLowerCase();
  if (/\$|\d+%|\d+x|saved|roi|revenue/.test(t)) return 'CASE STUDY';
  if (/tip|rule|way|step|how to|way i/.test(t)) return 'TIPS';
  if (/why|stop|don't|should|won't|replace/.test(t)) return 'HOT TAKE';
  if (/built|shipped|launched/.test(t)) return 'CASE STUDY';
  if (/i |my |journey|lesson/.test(t)) return 'STORY';
  return 'INSIGHT';
}

// ---------- visual decorations ----------

function drawDotPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.08;
  const spacing = 28;
  for (let x = spacing; x < w; x += spacing) {
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGridPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.05;
  ctx.lineWidth = 1;
  const spacing = 40;
  for (let x = 0; x <= w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLinesPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.06;
  ctx.lineWidth = 1;
  for (let x = -h; x < w; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 0.25) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
  rg.addColorStop(0, color);
  rg.addColorStop(1, 'transparent');
  ctx.fillStyle = rg;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function drawAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, name: string | undefined, accent: string, text: string) {
  ctx.save();
  // Circle background
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, adjustHex(accent, -30));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  // Initials
  ctx.fillStyle = text;
  ctx.font = `600 ${size * 0.4}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), x + size / 2, y + size / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function adjustHex(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------- style renderers ----------

function renderHookStyle(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Pattern
  if (theme.pattern === 'dots') drawDotPattern(ctx, w, h, theme.subtle);
  else if (theme.pattern === 'grid') drawGridPattern(ctx, w, h, theme.subtle);
  else if (theme.pattern === 'lines') drawLinesPattern(ctx, w, h, theme.subtle);

  // Accent glows
  drawGlow(ctx, w * 0.15, h * 0.2, 320, theme.accent, 0.18);
  drawGlow(ctx, w * 0.85, h * 0.8, 280, theme.accent2, 0.14);

  const padding = 72;

  // Category tag
  const catLabel = (category || inferCategory(hookText)).toUpperCase();
  ctx.font = `700 14px ${theme.font}`;
  const catWidth = ctx.measureText(catLabel).width + 24;
  drawRoundedRect(ctx, padding, padding, catWidth, 32, 16);
  ctx.fillStyle = theme.categoryBg;
  ctx.fill();
  ctx.fillStyle = theme.categoryText;
  ctx.textBaseline = 'middle';
  ctx.fillText(catLabel, padding + 12, padding + 17);
  ctx.textBaseline = 'alphabetic';

  // Hook text — auto sized
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const maxWidth = w - padding * 2;
  let size = 56;
  if (cleanHook.length > 180) size = 40;
  else if (cleanHook.length > 120) size = 46;
  else if (cleanHook.length > 80) size = 52;
  else if (cleanHook.length < 50) size = 64;

  ctx.font = `800 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, maxWidth);
  const lineHeight = size * 1.25;
  const textBlockHeight = lines.length * lineHeight;
  let y = Math.max(padding + 100, (h - textBlockHeight) / 2 - 40);

  lines.forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  // Subtext
  if (subtext) {
    ctx.font = `400 22px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, maxWidth);
    y += 18;
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y);
      y += 32;
    });
  }

  // Bottom author bar
  const bottomY = h - 44;
  drawAvatar(ctx, padding, bottomY - 40, 52, authorName, theme.accent, theme.text);
  ctx.font = `700 19px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', padding + 68, bottomY - 20);
  if (authorTitle) {
    ctx.font = `400 14px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const tLines = wrapText(ctx, authorTitle, w - padding - 80 - 180);
    ctx.fillText(tLines[0] || '', padding + 68, bottomY);
  }

  // Watermark
  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('leadhawk', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function renderCodeStyle(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;

  // Dark bg
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Terminal title bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, 46);
  // Traffic lights
  const dots = [
    { c: '#ef4444', x: 30 },
    { c: '#f59e0b', x: 56 },
    { c: '#10b981', x: 82 },
  ];
  dots.forEach((d) => {
    ctx.fillStyle = d.c;
    ctx.beginPath();
    ctx.arc(d.x, 23, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = theme.subtle;
  ctx.font = `400 14px ${theme.monoFont}`;
  ctx.textAlign = 'center';
  ctx.fillText('~ linkedin.post.insight.ts', w / 2, 28);
  ctx.textAlign = 'left';

  // Content area
  const padding = 60;
  const contentStart = 86;

  // Comment line with category
  ctx.font = `400 16px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  const catLabel = (category || inferCategory(hookText)).toLowerCase().replace(' ', '_');
  ctx.fillText(`// @type: ${catLabel}`, padding, contentStart + 10);

  // Function-like opener
  ctx.font = `600 20px ${theme.monoFont}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText('const insight = {', padding, contentStart + 50);

  // Main hook as a "string value"
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const maxWidth = w - padding * 2 - 30;
  let size = 38;
  if (cleanHook.length > 180) size = 28;
  else if (cleanHook.length > 120) size = 32;
  else if (cleanHook.length > 80) size = 36;

  ctx.font = `700 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, maxWidth);
  let y = contentStart + 110;
  const lineHeight = size * 1.25;

  ctx.fillStyle = theme.accent2;
  ctx.font = `400 18px ${theme.monoFont}`;
  ctx.fillText('message: `', padding + 24, y - 10);
  ctx.font = `700 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  y += 14;
  lines.slice(0, 5).forEach((l) => {
    ctx.fillText(l, padding + 24, y);
    y += lineHeight;
  });

  ctx.font = `400 18px ${theme.monoFont}`;
  ctx.fillStyle = theme.accent2;
  ctx.fillText('`,', padding + 24, y + 6);

  // Closer
  ctx.font = `600 20px ${theme.monoFont}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText('};', padding, h - 110);

  // Comment for author
  ctx.font = `400 15px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.fillText(`// author: ${authorName || 'you'}`, padding, h - 70);
  if (authorTitle) {
    const titleTrim = authorTitle.length > 60 ? authorTitle.slice(0, 57) + '...' : authorTitle;
    ctx.fillText(`// ${titleTrim}`, padding, h - 46);
  }

  // Watermark
  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('> leadhawk', w - padding, h - 30);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;

  // subtext unused in this style intentionally
  void subtext;
}

function renderMinimalLight(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;

  // Off-white bg
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  drawGridPattern(ctx, w, h, '#000000');

  const padding = 80;

  // Corner accent: thick accent line with dot
  ctx.fillStyle = theme.accent;
  ctx.fillRect(padding, padding, 60, 4);
  ctx.beginPath();
  ctx.arc(padding + 72, padding + 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Category below accent
  const catLabel = (category || inferCategory(hookText)).toUpperCase();
  ctx.font = `600 14px ${theme.font}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText(catLabel, padding, padding + 42);

  // Hook
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const maxWidth = w - padding * 2;
  let size = 56;
  if (cleanHook.length > 180) size = 38;
  else if (cleanHook.length > 120) size = 44;
  else if (cleanHook.length > 80) size = 50;
  else if (cleanHook.length < 50) size = 64;

  ctx.font = `800 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, maxWidth);
  const lineHeight = size * 1.2;
  let y = padding + 100;
  lines.forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  // Subtext
  if (subtext) {
    y += 10;
    ctx.font = `400 20px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, maxWidth);
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y);
      y += 30;
    });
  }

  // Bottom bar — name + title separated by divider
  const bottomY = h - 44;
  drawAvatar(ctx, padding, bottomY - 40, 52, authorName, theme.accent, '#ffffff');
  ctx.font = `700 19px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', padding + 68, bottomY - 20);
  if (authorTitle) {
    ctx.font = `400 14px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const tLines = wrapText(ctx, authorTitle, w - padding - 80 - 180);
    ctx.fillText(tLines[0] || '', padding + 68, bottomY);
  }

  // Watermark
  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'right';
  ctx.fillText('leadhawk', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function renderSplitAccent(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Left sidebar with accent gradient
  const sidebarWidth = 180;
  const sideGrad = ctx.createLinearGradient(0, 0, sidebarWidth, h);
  sideGrad.addColorStop(0, theme.accent);
  sideGrad.addColorStop(1, theme.accent2);
  ctx.fillStyle = sideGrad;
  ctx.fillRect(0, 0, sidebarWidth, h);

  // Pattern over sidebar
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 16) {
    ctx.fillRect(0, y, sidebarWidth, 1);
  }
  ctx.restore();

  // Sidebar: vertical category text
  const catLabel = (category || inferCategory(hookText)).toUpperCase();
  ctx.save();
  ctx.translate(sidebarWidth / 2, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `800 28px ${theme.font}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(catLabel, 0, 10);
  ctx.restore();

  // Dots pattern on right side
  drawDotPattern(ctx, w, h, theme.subtle);

  // Right content area
  const padding = 60;
  const contentX = sidebarWidth + padding;
  const contentW = w - contentX - padding;

  // Hook
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  let size = 48;
  if (cleanHook.length > 180) size = 34;
  else if (cleanHook.length > 120) size = 38;
  else if (cleanHook.length > 80) size = 44;
  else if (cleanHook.length < 50) size = 56;

  ctx.font = `800 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, contentW);
  const lineHeight = size * 1.22;
  const textHeight = lines.length * lineHeight;
  let y = Math.max(padding + 40, (h - textHeight) / 2 - 30);
  lines.forEach((l) => {
    ctx.fillText(l, contentX, y);
    y += lineHeight;
  });

  // Subtext
  if (subtext) {
    y += 10;
    ctx.font = `400 20px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, contentW);
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, contentX, y);
      y += 30;
    });
  }

  // Bottom author
  const bottomY = h - 44;
  drawAvatar(ctx, contentX, bottomY - 40, 48, authorName, theme.accent, '#fff');
  ctx.font = `700 18px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', contentX + 62, bottomY - 20);
  if (authorTitle) {
    ctx.font = `400 14px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const tLines = wrapText(ctx, authorTitle, contentW - 62);
    ctx.fillText(tLines[0] || '', contentX + 62, bottomY);
  }

  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('leadhawk', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function renderStatBold(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawGridPattern(ctx, w, h, theme.accent);
  drawGlow(ctx, w * 0.8, h * 0.3, 320, theme.accent, 0.2);

  const padding = 72;

  // Try to extract a "big number" from the hook
  const statMatch = hookText.match(/(\$?[\d,]+\s?(?:%|x|hours|hrs|k|K|M|\+))/);
  const statVal = statMatch ? statMatch[0] : null;
  const textWithoutStat = statVal ? hookText.replace(statVal, '___').trim() : hookText;

  // Category
  const catLabel = (category || 'CASE STUDY').toUpperCase();
  ctx.font = `700 14px ${theme.font}`;
  const catWidth = ctx.measureText(catLabel).width + 24;
  drawRoundedRect(ctx, padding, padding, catWidth, 32, 16);
  ctx.fillStyle = theme.categoryBg;
  ctx.fill();
  ctx.fillStyle = theme.categoryText;
  ctx.textBaseline = 'middle';
  ctx.fillText(catLabel, padding + 12, padding + 17);
  ctx.textBaseline = 'alphabetic';

  // Big stat
  let statY = padding + 140;
  if (statVal) {
    ctx.font = `900 140px ${theme.font}`;
    ctx.fillStyle = theme.accent2;
    ctx.fillText(statVal, padding, statY);
    statY += 30;
  }

  // Main text
  let size = 42;
  const maxWidth = w - padding * 2;
  const cleanText = textWithoutStat.replace(/___/g, '').replace(/\s+/g, ' ').trim();
  if (cleanText.length > 120) size = 32;
  else if (cleanText.length > 80) size = 38;

  ctx.font = `700 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanText, maxWidth);
  const lineHeight = size * 1.24;
  let y = statVal ? statY + 30 : padding + 160;
  lines.slice(0, 4).forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  // Subtext
  if (subtext) {
    y += 10;
    ctx.font = `400 20px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, maxWidth);
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y);
      y += 30;
    });
  }

  // Bottom
  const bottomY = h - 44;
  drawAvatar(ctx, padding, bottomY - 40, 52, authorName, theme.accent, '#000');
  ctx.font = `700 19px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', padding + 68, bottomY - 20);
  if (authorTitle) {
    ctx.font = `400 14px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const tLines = wrapText(ctx, authorTitle, w - padding - 80 - 180);
    ctx.fillText(tLines[0] || '', padding + 68, bottomY);
  }

  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('leadhawk', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

// ---------- New distinctive layouts ----------

function renderQuoteSerif(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, authorName, authorTitle } = opts;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const padding = 100;
  // Huge opening quote mark
  ctx.font = `900 280px ${theme.font}`;
  ctx.fillStyle = theme.accent;
  ctx.globalAlpha = 0.2;
  ctx.fillText('"', padding - 20, padding + 170);
  ctx.globalAlpha = 1;

  // Main quote
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  let size = 48;
  if (cleanHook.length > 180) size = 34;
  else if (cleanHook.length > 120) size = 40;
  else if (cleanHook.length < 60) size = 58;

  ctx.font = `400 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const maxWidth = w - padding * 2;
  const lines = wrapText(ctx, cleanHook, maxWidth);
  const lineHeight = size * 1.4;
  let y = Math.max(padding + 180, (h - lines.length * lineHeight) / 2);
  lines.forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  // Em dash + attribution
  const bottomY = h - 70;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(padding, bottomY - 20, 40, 2);
  ctx.font = `italic 500 22px ${theme.font}`;
  ctx.fillStyle = theme.subtle;
  ctx.fillText(authorName || 'Your Name', padding + 56, bottomY - 14);
  if (authorTitle) {
    ctx.font = `italic 400 15px ${theme.font}`;
    const tLines = wrapText(ctx, authorTitle, maxWidth);
    ctx.fillText(tLines[0] || '', padding + 56, bottomY + 10);
  }

  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('leadhawk', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function renderNeonCyber(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName } = opts;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawGridPattern(ctx, w, h, theme.accent);

  // Neon glows
  drawGlow(ctx, w * 0.15, h * 0.2, 400, theme.accent, 0.35);
  drawGlow(ctx, w * 0.85, h * 0.8, 350, theme.accent2, 0.3);

  // Neon borders (top + bottom)
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.lineTo(w - 60, 60);
  ctx.stroke();
  ctx.strokeStyle = theme.accent2;
  ctx.shadowColor = theme.accent2;
  ctx.beginPath();
  ctx.moveTo(60, h - 60);
  ctx.lineTo(w - 60, h - 60);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const padding = 90;

  // Category in brackets
  const catLabel = `[ ${(category || inferCategory(hookText)).toUpperCase()} ]`;
  ctx.font = `700 16px ${theme.monoFont}`;
  ctx.fillStyle = theme.accent2;
  ctx.fillText(catLabel, padding, padding + 30);

  // Hook with glow
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  let size = 54;
  if (cleanHook.length > 180) size = 38;
  else if (cleanHook.length > 120) size = 44;
  else if (cleanHook.length < 60) size = 62;

  ctx.font = `900 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 15;
  const lines = wrapText(ctx, cleanHook, w - padding * 2);
  const lineHeight = size * 1.2;
  let y = Math.max(padding + 100, (h - lines.length * lineHeight) / 2);
  lines.forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });
  ctx.shadowBlur = 0;

  if (subtext) {
    ctx.font = `400 20px ${theme.monoFont}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, `> ${subtext}`, w - padding * 2);
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y + 14);
      y += 28;
    });
  }

  // Author in terminal style
  ctx.font = `500 14px ${theme.monoFont}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText(`user@${(authorName || 'you').toLowerCase().replace(/\s+/g, '_')}:~$`, padding, h - 90);

  ctx.font = `500 11px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'right';
  ctx.fillText('> leadhawk', w - padding, h - 90);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function renderBlueprint(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.bg[0]);
  bg.addColorStop(1, theme.bg[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawGridPattern(ctx, w, h, theme.accent);

  // Corner blueprint markers
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  const cornerSize = 30;
  [[40, 40], [w - 40, 40], [40, h - 40], [w - 40, h - 40]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx - cornerSize, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + (cy < h / 2 ? cornerSize : -cornerSize));
    ctx.stroke();
  });

  // Technical label top-left
  const padding = 80;
  ctx.font = `500 11px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.fillText('SPEC-01 · REV A · ' + new Date().getFullYear(), padding, padding + 4);

  // Category
  const catLabel = (category || inferCategory(hookText)).toUpperCase();
  ctx.font = `700 14px ${theme.monoFont}`;
  ctx.fillStyle = theme.accent2;
  ctx.fillText(catLabel, padding, padding + 32);

  // Hook
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  let size = 50;
  if (cleanHook.length > 180) size = 36;
  else if (cleanHook.length > 120) size = 42;
  else if (cleanHook.length < 60) size = 58;

  ctx.font = `700 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, w - padding * 2);
  const lineHeight = size * 1.22;
  let y = padding + 100;
  lines.forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  if (subtext) {
    y += 10;
    ctx.font = `400 18px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, w - padding * 2);
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y);
      y += 28;
    });
  }

  // Technical bottom strip with crosshair
  const bottomY = h - 60;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, bottomY - 20);
  ctx.lineTo(w - padding, bottomY - 20);
  ctx.stroke();

  // Crosshair
  ctx.beginPath();
  ctx.arc(padding + 12, bottomY - 20, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(padding + 6, bottomY - 20);
  ctx.lineTo(padding + 18, bottomY - 20);
  ctx.moveTo(padding + 12, bottomY - 26);
  ctx.lineTo(padding + 12, bottomY - 14);
  ctx.stroke();

  // Author
  ctx.font = `600 16px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', padding + 30, bottomY);
  if (authorTitle) {
    ctx.font = `400 12px ${theme.monoFont}`;
    ctx.fillStyle = theme.subtle;
    const tLines = wrapText(ctx, authorTitle, w - padding * 2 - 200);
    ctx.fillText(tLines[0] || '', padding + 30, bottomY + 18);
  }

  ctx.font = `500 11px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('PROJ · LEADHAWK', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function renderMagazineCover(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName } = opts;

  // Black bg
  ctx.fillStyle = theme.bg[0];
  ctx.fillRect(0, 0, w, h);

  // Top accent strip
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, w, 8);

  // Sidebar accent
  ctx.fillStyle = theme.accent2;
  ctx.fillRect(0, 8, 16, h - 8);

  const padding = 80;

  // Top masthead-style label
  ctx.font = `900 14px ${theme.font}`;
  ctx.fillStyle = theme.accent;
  ctx.fillText('LEADHAWK · FEATURED INSIGHT', padding, 56);

  // Category huge at top
  const catLabel = (category || inferCategory(hookText)).toUpperCase();
  ctx.font = `900 72px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(catLabel, padding, 150);

  // Accent underline
  ctx.fillStyle = theme.accent;
  ctx.fillRect(padding, 165, 120, 6);

  // Hook
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  let size = 44;
  if (cleanHook.length > 180) size = 32;
  else if (cleanHook.length > 120) size = 38;

  ctx.font = `700 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, w - padding * 2);
  const lineHeight = size * 1.22;
  let y = 230;
  lines.slice(0, 5).forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  if (subtext) {
    y += 20;
    ctx.font = `400 20px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, w - padding * 2);
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y);
      y += 30;
    });
  }

  // Bottom: issue-style label + author
  const bottomY = h - 50;
  ctx.font = `700 18px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', padding, bottomY);

  ctx.font = `500 13px ${theme.font}`;
  ctx.fillStyle = theme.subtle;
  ctx.textAlign = 'right';
  ctx.fillText(`ISSUE #${new Date().getFullYear()}`, w - padding, bottomY);
  ctx.textAlign = 'left';
}

function renderGradientMesh(ctx: CanvasRenderingContext2D, opts: ImageOptions & { theme: Theme; w: number; h: number }) {
  const { theme, w, h, hookText, subtext, category, authorName, authorTitle } = opts;

  // Dark base
  ctx.fillStyle = theme.bg[0];
  ctx.fillRect(0, 0, w, h);

  // Multiple radial gradients for mesh effect
  const meshPoints = [
    { x: w * 0.2, y: h * 0.3, r: 500, c: theme.accent, a: 0.45 },
    { x: w * 0.8, y: h * 0.7, r: 450, c: theme.accent2, a: 0.4 },
    { x: w * 0.5, y: h * 0.5, r: 350, c: '#ec4899', a: 0.25 },
    { x: w * 0.7, y: h * 0.2, r: 300, c: '#06b6d4', a: 0.3 },
    { x: w * 0.3, y: h * 0.8, r: 280, c: '#a855f7', a: 0.28 },
  ];
  meshPoints.forEach((p) => drawGlow(ctx, p.x, p.y, p.r, p.c, p.a));

  // Subtle dot overlay
  drawDotPattern(ctx, w, h, '#ffffff');

  const padding = 80;

  // Category pill
  const catLabel = (category || inferCategory(hookText)).toUpperCase();
  ctx.font = `700 14px ${theme.font}`;
  const catWidth = ctx.measureText(catLabel).width + 28;
  drawRoundedRect(ctx, padding, padding, catWidth, 34, 17);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(catLabel, padding + 14, padding + 18);
  ctx.textBaseline = 'alphabetic';

  // Hook
  const cleanHook = hookText.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  let size = 56;
  if (cleanHook.length > 180) size = 38;
  else if (cleanHook.length > 120) size = 44;
  else if (cleanHook.length < 60) size = 68;

  ctx.font = `800 ${size}px ${theme.font}`;
  ctx.fillStyle = theme.text;
  const lines = wrapText(ctx, cleanHook, w - padding * 2);
  const lineHeight = size * 1.2;
  let y = Math.max(padding + 120, (h - lines.length * lineHeight) / 2 - 20);
  lines.forEach((l) => {
    ctx.fillText(l, padding, y);
    y += lineHeight;
  });

  if (subtext) {
    ctx.font = `400 22px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const subLines = wrapText(ctx, subtext, w - padding * 2);
    y += 14;
    subLines.slice(0, 2).forEach((l) => {
      ctx.fillText(l, padding, y);
      y += 32;
    });
  }

  // Bottom
  const bottomY = h - 44;
  drawAvatar(ctx, padding, bottomY - 40, 52, authorName, theme.accent, '#fff');
  ctx.font = `700 19px ${theme.font}`;
  ctx.fillStyle = theme.text;
  ctx.fillText(authorName || 'Your Name', padding + 68, bottomY - 20);
  if (authorTitle) {
    ctx.font = `400 14px ${theme.font}`;
    ctx.fillStyle = theme.subtle;
    const tLines = wrapText(ctx, authorTitle, w - padding - 80 - 180);
    ctx.fillText(tLines[0] || '', padding + 68, bottomY);
  }

  ctx.font = `500 12px ${theme.monoFont}`;
  ctx.fillStyle = theme.subtle;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText('leadhawk', w - padding, bottomY);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

// ---------- main entry ----------

export function generatePostImage(options: ImageOptions): string {
  const { style, width = 1200, height = 628 } = options;
  const theme = THEMES[style];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const common = { ...options, theme, w: width, h: height };

  // Family-based rendering — color variants reuse the base renderer
  switch (style) {
    case 'code-dark':
    case 'code-light':
    case 'code-matrix':
      renderCodeStyle(ctx, common);
      break;
    case 'minimal-light':
    case 'minimal-paper':
    case 'minimal-mint':
      renderMinimalLight(ctx, common);
      break;
    case 'split-accent':
    case 'split-emerald':
    case 'split-amber':
    case 'split-crimson':
      renderSplitAccent(ctx, common);
      break;
    case 'stat-bold':
    case 'stat-amber':
    case 'stat-purple':
    case 'stat-crimson':
      renderStatBold(ctx, common);
      break;
    case 'quote-serif':
      renderQuoteSerif(ctx, common);
      break;
    case 'neon-cyber':
      renderNeonCyber(ctx, common);
      break;
    case 'blueprint':
      renderBlueprint(ctx, common);
      break;
    case 'magazine-cover':
      renderMagazineCover(ctx, common);
      break;
    case 'gradient-mesh':
      renderGradientMesh(ctx, common);
      break;
    case 'hook-indigo':
    case 'hook-sunset':
    case 'hook-emerald':
    case 'hook-ocean':
    case 'hook-rose':
    case 'hook-midnight':
    case 'hook-crimson':
    default:
      renderHookStyle(ctx, common);
      break;
  }

  return canvas.toDataURL('image/png');
}

export function downloadImage(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
