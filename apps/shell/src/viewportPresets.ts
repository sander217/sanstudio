// Device presets for the ViewportPicker. Dimensions are CSS pixels (i.e.
// device-independent), matching what a `<meta viewport>` page would report —
// not raw screen pixels. Use the public spec numbers from each vendor.

export type DeviceCategory = 'phone' | 'tablet' | 'desktop';

export interface DevicePreset {
  id: string;
  label: string;
  category: DeviceCategory;
  width: number;
  height: number;
  icon: string;
}

export interface Viewport {
  mode: 'fluid' | 'fixed';
  /** Preset id when current size matches a preset, null when custom/fluid. */
  presetId: string | null;
  /** CSS pixels. null in fluid mode. */
  width: number | null;
  height: number | null;
  /** True if the user pressed the rotate button (W ↔ H swap). Cosmetic only
   * — width/height already reflect the rotated dimensions. */
  rotated: boolean;
  /** Scale the iframe down via CSS transform when it overflows the stage. */
  fit: boolean;
}

export const FLUID_VIEWPORT: Viewport = {
  mode: 'fluid',
  presetId: null,
  width: null,
  height: null,
  rotated: false,
  fit: true,
};

export const DEVICE_PRESETS: DevicePreset[] = [
  // Phones
  { id: 'iphone-se',       label: 'iPhone SE',         category: 'phone',   width: 375,  height: 667,  icon: '📱' },
  { id: 'iphone-15',       label: 'iPhone 15',         category: 'phone',   width: 393,  height: 852,  icon: '📱' },
  { id: 'iphone-15-pm',    label: 'iPhone 15 Pro Max', category: 'phone',   width: 430,  height: 932,  icon: '📱' },
  { id: 'pixel-8',         label: 'Pixel 8',           category: 'phone',   width: 412,  height: 915,  icon: '📱' },
  { id: 'galaxy-s24',      label: 'Galaxy S24',        category: 'phone',   width: 360,  height: 800,  icon: '📱' },
  // Tablets
  { id: 'ipad-mini',       label: 'iPad mini',         category: 'tablet',  width: 744,  height: 1133, icon: '📋' },
  { id: 'ipad-10',         label: 'iPad 10.9"',        category: 'tablet',  width: 820,  height: 1180, icon: '📋' },
  { id: 'ipad-pro-12',     label: 'iPad Pro 12.9"',    category: 'tablet',  width: 1024, height: 1366, icon: '📋' },
  // Desktops
  { id: 'laptop',          label: 'Laptop',            category: 'desktop', width: 1280, height: 800,  icon: '🖥' },
  { id: 'desktop',         label: 'Desktop',           category: 'desktop', width: 1440, height: 900,  icon: '🖥' },
  { id: 'fullhd',          label: 'Full HD',           category: 'desktop', width: 1920, height: 1080, icon: '🖥' },
];

export function presetById(id: string): DevicePreset | null {
  return DEVICE_PRESETS.find((p) => p.id === id) ?? null;
}

const VIEWPORT_KEY = 'shell.viewport';

export function readStoredViewport(): Viewport {
  if (typeof window === 'undefined') return FLUID_VIEWPORT;
  const raw = window.localStorage.getItem(VIEWPORT_KEY);
  if (!raw) return FLUID_VIEWPORT;
  try {
    const parsed = JSON.parse(raw) as Partial<Viewport>;
    if (parsed.mode !== 'fluid' && parsed.mode !== 'fixed') return FLUID_VIEWPORT;
    if (parsed.mode === 'fluid') return FLUID_VIEWPORT;
    const width = typeof parsed.width === 'number' && parsed.width > 0 ? parsed.width : null;
    const height = typeof parsed.height === 'number' && parsed.height > 0 ? parsed.height : null;
    if (width == null || height == null) return FLUID_VIEWPORT;
    return {
      mode: 'fixed',
      presetId: typeof parsed.presetId === 'string' ? parsed.presetId : null,
      width,
      height,
      rotated: Boolean(parsed.rotated),
      fit: parsed.fit !== false,
    };
  } catch {
    return FLUID_VIEWPORT;
  }
}

export function writeStoredViewport(v: Viewport): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VIEWPORT_KEY, JSON.stringify(v));
  } catch {
    // localStorage full / disabled — non-fatal.
  }
}
