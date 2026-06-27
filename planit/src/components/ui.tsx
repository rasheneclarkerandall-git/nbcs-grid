import type { CSSProperties, ReactNode, MouseEvent } from 'react';
import { C, R, S } from '../tokens';

// ── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
}
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, fullWidth, style }: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, letterSpacing: '-0.01em', transition: 'all 0.15s',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : undefined,
    fontFamily: 'inherit',
  };
  const sizes: Record<'sm' | 'md' | 'lg', CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: 12, borderRadius: R.sm },
    md: { padding: '10px 18px', fontSize: 13, borderRadius: R.md },
    lg: { padding: '13px 24px', fontSize: 14, borderRadius: R.lg },
  };
  const variants: Record<string, CSSProperties> = {
    primary:   { background: C.primary, color: '#fff' },
    secondary: { background: C.surface, color: C.text, border: `1px solid ${C.border}`, boxShadow: S.xs },
    ghost:     { background: 'transparent', color: C.muted },
    danger:    { background: C.dangerBg, color: C.dangerText },
    accent:    { background: C.accent, color: C.primary },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  padding?: number | string;
}
export function Card({ children, style, onClick, hover, padding = 16 }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: R.lg, padding,
        boxShadow: S.sm,
        cursor: onClick ? 'pointer' : undefined,
        transition: hover || onClick ? 'all 0.15s' : undefined,
        ...style,
      }}
      onMouseEnter={hover || onClick ? e => { (e.currentTarget as HTMLDivElement).style.boxShadow = S.md; (e.currentTarget as HTMLDivElement).style.borderColor = C.borderMid; } : undefined}
      onMouseLeave={hover || onClick ? e => { (e.currentTarget as HTMLDivElement).style.boxShadow = S.sm; (e.currentTarget as HTMLDivElement).style.borderColor = C.border; } : undefined}
    >
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  const styles: Record<BadgeVariant, CSSProperties> = {
    primary: { background: `${C.primary}15`, color: C.primary },
    success: { background: C.successLight, color: C.successText },
    warning: { background: C.warningBg, color: C.warningText },
    danger:  { background: C.dangerBg, color: C.dangerText },
    neutral: { background: C.surfaceAlt, color: C.muted },
    accent:  { background: C.accentLight, color: C.accentDark },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: R.full,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.2px',
      ...styles[variant],
    }}>{children}</span>
  );
}

// ── Tag ──────────────────────────────────────────────────────────────────
export function Tag({ children, color = C.mid }: { children: ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: R.full,
      background: color + '18', color, fontSize: 10, fontWeight: 700, letterSpacing: '0.3px',
    }}>{children}</span>
  );
}

// ── StatusBadge ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  draft:        { label: 'Draft',         variant: 'neutral' },
  documents:    { label: 'Documents',     variant: 'primary' },
  review:       { label: 'In Review',     variant: 'accent' },
  payment:      { label: 'Payment',       variant: 'warning' },
  ready:        { label: 'Ready',         variant: 'success' },
  submitted:    { label: 'Submitted',     variant: 'success' },
  'under-review': { label: 'Under Review', variant: 'accent' },
  approved:     { label: 'Approved',      variant: 'success' },
  rejected:     { label: 'Rejected',      variant: 'danger' },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, variant: 'neutral' as BadgeVariant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  required?: boolean;
  style?: CSSProperties;
}
export function Input({ label, value, onChange, placeholder, type = 'text', hint, required, style }: InputProps) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 5 }}>
          {label}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 12px',
          border: `1px solid ${C.border}`, borderRadius: R.md,
          fontSize: 13, color: C.text, background: C.surface,
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primary}15`; }}
        onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
      />
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  hint?: string;
  required?: boolean;
}
export function Select({ label, value, onChange, options, hint, required }: SelectProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 5 }}>
          {label}{required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px',
          border: `1px solid ${C.border}`, borderRadius: R.md,
          fontSize: 13, color: value ? C.text : C.muted,
          background: C.surface, outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = C.primary; }}
        onBlur={e => { e.target.style.borderColor = C.border; }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({ value, max = 100, color = C.success }: { value: number; max?: number; color?: string }) {
  return (
    <div style={{ background: C.border, borderRadius: R.full, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: R.full, transition: 'width 0.3s ease' }} />
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: C.border, ...style }} />;
}

// ── Bullet ──────────────────────────────────────────────────────────────────
export function Bullet({ children, color = C.success, size = 6 }: { children: ReactNode; color?: string; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

// ── InfoRow ──────────────────────────────────────────────────────────────────
export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{value}</div>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────────
export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10, ...style }}>
      {children}
    </div>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

// ── CalloutBox ──────────────────────────────────────────────────────────────────
export function CalloutBox({ children, type = 'info' }: { children: ReactNode; type?: 'info' | 'warning' | 'danger' | 'success' }) {
  const styles: Record<string, CSSProperties> = {
    info:    { background: `${C.primary}08`, borderLeft: `3px solid ${C.primary}`, color: C.primary },
    warning: { background: C.warningBg, borderLeft: `3px solid ${C.warning}`, color: C.warningText },
    danger:  { background: C.dangerBg, borderLeft: `3px solid ${C.danger}`, color: C.dangerText },
    success: { background: C.successLight, borderLeft: `3px solid ${C.success}`, color: C.successText },
  };
  return (
    <div style={{ borderRadius: R.md, padding: '10px 14px', fontSize: 12, lineHeight: 1.6, ...styles[type] }}>
      {children}
    </div>
  );
}
