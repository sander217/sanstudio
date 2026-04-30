// StyleControls — sliders + color pickers shown beneath the note textarea
// when a region is selected. Every interaction is debounced into a single
// `set_style_value` / `set_color_value` action so the iframe companion
// records ONE diff per (selector, property) pair, even after many slider
// drags.
//
// Reading current values: we seed the controls from getComputedStyle on the
// iframe element via the postMessage RPC's broadcast pending. The companion
// captures originals on selection — what we render reflects "after the
// last edit" because pending.diffs is the source of truth for the current
// applied value.

import { useEffect, useMemo, useState } from 'react';

import type {
  ColorChangeDiff,
  ColorRole,
  EditDiff,
  PendingSelection,
  RefineRpc,
  StyleChangeDiff,
  StyleNumericProperty,
} from './refineProtocol';

interface Props {
  pending: PendingSelection;
  rpc: RefineRpc | null;
  /** Forces re-mount when the user discards / saves and a new selection lands. */
  resetSignal: number;
}

const NUMERIC_DEFAULTS: Record<StyleNumericProperty, { min: number; max: number; step: number; fallback: number }> = {
  fontSize: { min: 8, max: 120, step: 1, fallback: 16 },
  fontWeight: { min: 100, max: 900, step: 100, fallback: 400 },
  borderRadius: { min: 0, max: 80, step: 1, fallback: 0 },
  borderWidth: { min: 0, max: 16, step: 1, fallback: 0 },
  padding: { min: 0, max: 80, step: 1, fallback: 0 },
};

function parsePxOrNumber(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return fallback;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : fallback;
}

function rgbToHex(rgb: string | undefined): string {
  if (!rgb) return '#000000';
  // Accept #rrggbb passthrough.
  if (rgb.startsWith('#')) return rgb.length === 7 ? rgb : '#000000';
  // Accept rgb(r, g, b) and rgba(r, g, b, a).
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return '#000000';
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function findStyleDiff(
  diffs: EditDiff[],
  property: StyleNumericProperty,
): StyleChangeDiff | undefined {
  return diffs.find(
    (d): d is StyleChangeDiff => d.type === 'style_change' && d.property === property,
  );
}

function findColorDiff(diffs: EditDiff[], role: ColorRole): ColorChangeDiff | undefined {
  return diffs.find((d): d is ColorChangeDiff => d.type === 'color_change' && d.role === role);
}

export function StyleControls({ pending, rpc, resetSignal }: Props) {
  // Numeric controls — we always show a number even if the user hasn't
  // adjusted yet (the slider needs a position). For "before" we read the
  // companion's diff if it exists, else we fall back to a sensible default.
  // The companion has the precise computed-style original; we don't.
  const initial = useMemo(() => {
    const computed: Record<StyleNumericProperty, number> = {
      fontSize: NUMERIC_DEFAULTS.fontSize.fallback,
      fontWeight: NUMERIC_DEFAULTS.fontWeight.fallback,
      borderRadius: NUMERIC_DEFAULTS.borderRadius.fallback,
      borderWidth: NUMERIC_DEFAULTS.borderWidth.fallback,
      padding: NUMERIC_DEFAULTS.padding.fallback,
    };
    for (const property of Object.keys(NUMERIC_DEFAULTS) as StyleNumericProperty[]) {
      const diff = findStyleDiff(pending.diffs, property);
      if (diff) {
        computed[property] = parsePxOrNumber(diff.after, NUMERIC_DEFAULTS[property].fallback);
      } else {
        // Best-effort seed from the captured `before` if any other prop's
        // diff exists for the same selector — but really, the panel only
        // knows what the companion told it. Default is fine.
        computed[property] = NUMERIC_DEFAULTS[property].fallback;
      }
    }
    return computed;
  }, [pending.target.selector, resetSignal]);

  const [values, setValues] = useState(initial);
  // Reset when the selection changes.
  useEffect(() => setValues(initial), [initial]);

  const colors = useMemo(() => {
    const c: Record<ColorRole, string> = {
      color: '#0f172a',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
    };
    for (const role of Object.keys(c) as ColorRole[]) {
      const diff = findColorDiff(pending.diffs, role);
      if (diff) c[role] = rgbToHex(diff.after);
    }
    return c;
  }, [pending.target.selector, resetSignal]);

  const [colorState, setColorState] = useState(colors);
  useEffect(() => setColorState(colors), [colors]);

  function applyNumeric(property: StyleNumericProperty, raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setValues((prev) => ({ ...prev, [property]: value }));
    void rpc?.applyDirectEdit({ type: 'set_style_value', property, value });
  }

  function applyColor(role: ColorRole, value: string) {
    setColorState((prev) => ({ ...prev, [role]: value }));
    void rpc?.applyDirectEdit({ type: 'set_color_value', role, value });
  }

  return (
    <details open style={detailsBox}>
      <summary style={summary}>Style adjustments</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        <Section title="Spacing">
          <Slider
            label="Padding"
            unit="px"
            value={values.padding}
            min={NUMERIC_DEFAULTS.padding.min}
            max={NUMERIC_DEFAULTS.padding.max}
            step={NUMERIC_DEFAULTS.padding.step}
            onChange={(v) => applyNumeric('padding', v)}
          />
        </Section>
        <Section title="Shape">
          <Slider
            label="Border radius"
            unit="px"
            value={values.borderRadius}
            min={NUMERIC_DEFAULTS.borderRadius.min}
            max={NUMERIC_DEFAULTS.borderRadius.max}
            step={NUMERIC_DEFAULTS.borderRadius.step}
            onChange={(v) => applyNumeric('borderRadius', v)}
          />
          <Slider
            label="Border width"
            unit="px"
            value={values.borderWidth}
            min={NUMERIC_DEFAULTS.borderWidth.min}
            max={NUMERIC_DEFAULTS.borderWidth.max}
            step={NUMERIC_DEFAULTS.borderWidth.step}
            onChange={(v) => applyNumeric('borderWidth', v)}
          />
        </Section>
        <Section title="Type">
          <Slider
            label="Font size"
            unit="px"
            value={values.fontSize}
            min={NUMERIC_DEFAULTS.fontSize.min}
            max={NUMERIC_DEFAULTS.fontSize.max}
            step={NUMERIC_DEFAULTS.fontSize.step}
            onChange={(v) => applyNumeric('fontSize', v)}
          />
          <WeightStepper
            value={values.fontWeight}
            onChange={(v) => applyNumeric('fontWeight', String(v))}
          />
        </Section>
        <Section title="Color">
          <ColorPicker
            label="Text"
            value={colorState.color}
            onChange={(v) => applyColor('color', v)}
          />
          <ColorPicker
            label="Background"
            value={colorState.backgroundColor}
            onChange={(v) => applyColor('backgroundColor', v)}
          />
          <ColorPicker
            label="Border"
            value={colorState.borderColor}
            onChange={(v) => applyColor('borderColor', v)}
          />
        </Section>
      </div>
    </details>
  );
}

interface SliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (raw: string) => void;
}
function Slider({ label, unit, value, min, max, step, onChange }: SliderProps) {
  return (
    <div style={row}>
      <label style={labelText}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={sliderInput}
      />
      <span style={valueText}>
        {value}
        {unit}
      </span>
    </div>
  );
}

function WeightStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  return (
    <div style={row}>
      <label style={labelText}>Font weight</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={selectInput}
      >
        {weights.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
      <span style={valueText}>{value}</span>
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}
function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div style={row}>
      <label style={labelText}>{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={colorInput}
      />
      <span style={valueText}>{value.toUpperCase()}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={section}>
      <div style={sectionTitle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

const detailsBox: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  padding: 10,
  background: '#fff',
};
const summary: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  color: '#0f172a',
  letterSpacing: 0.3,
};
const section: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: '#94a3b8',
  letterSpacing: 0.6,
  fontWeight: 600,
};
const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '90px 1fr 60px',
  alignItems: 'center',
  gap: 8,
};
const labelText: React.CSSProperties = { fontSize: 11, color: '#475569' };
const valueText: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#0f172a',
  textAlign: 'right',
};
const sliderInput: React.CSSProperties = { width: '100%', accentColor: '#2563eb' };
const selectInput: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 12,
  padding: '4px 6px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
};
const colorInput: React.CSSProperties = {
  width: '100%',
  height: 28,
  padding: 0,
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
};
