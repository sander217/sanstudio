// Design Agent Studio — Figma Plugin Parser
// Schema version: 0.2.0
// Parses structured JSON from Gate 3 and creates Figma nodes

// ============================================================
// TYPES
// ============================================================

interface DASFlow {
  schema_version: string;
  source: string;
  flow_name: string;
  flow_structure?: string;
  viewport?: string;
  export_scope?: string;
  partial_note?: string;
  design_system?: DASDesignSystem;
  screens: DASScreen[];
  transitions?: DASTransition[];
}

interface DASDesignSystem {
  name: string;
  colors?: {
    primary?: string;
    secondary?: string;
    neutrals?: string[];
    semantic?: { success?: string; warning?: string; error?: string; info?: string };
  };
  typography?: Record<string, { family: string; weight: number; size: number; lineHeight?: number }>;
  spacing_base?: number;
  radius?: Record<string, number>;
  shadows?: Record<string, string>;
}

interface DASScreen {
  name: string;
  description?: string;
  state?: string;
  theme?: string;
  canvas: { width: number; height: number };
  nodes: DASNode[];
  metadata?: Record<string, any>;
}

interface DASNode {
  id: string;
  type: 'FRAME' | 'TEXT' | 'RECTANGLE' | 'ELLIPSE' | 'IMAGE';
  parentId: string | null;
  name: string;
  component_role?: string;
  props: Record<string, any>;
}

interface DASTransition {
  from_screen: string;
  to_screen: string;
  trigger: string;
  animation?: string;
  duration_ms?: number;
  data_carried?: string;
}

// ============================================================
// COLOR UTILITIES
// ============================================================

function hexToRgb(hex: string): RGB {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255,
  };
}

function parseFills(fills: any[]): Paint[] {
  if (!fills || !Array.isArray(fills)) return [];
  return fills.map(f => {
    if (f.type === 'SOLID' && f.color) {
      const rgb = hexToRgb(f.color);
      return { type: 'SOLID' as const, color: rgb, opacity: f.opacity ?? 1 };
    }
    return { type: 'SOLID' as const, color: { r: 0.9, g: 0.9, b: 0.9 } };
  });
}

function parseStrokes(strokes: any[]): Paint[] {
  if (!strokes || !Array.isArray(strokes)) return [];
  return strokes.map(s => {
    if (s.type === 'SOLID' && s.color) {
      return { type: 'SOLID' as const, color: hexToRgb(s.color), opacity: s.opacity ?? 1 };
    }
    return { type: 'SOLID' as const, color: { r: 0.8, g: 0.8, b: 0.8 } };
  });
}

// ============================================================
// FONT LOADING
// ============================================================

const fontCache = new Set<string>();

async function loadFont(family: string, style: string): Promise<boolean> {
  const key = `${family}::${style}`;
  if (fontCache.has(key)) return true;
  try {
    await figma.loadFontAsync({ family, style });
    fontCache.add(key);
    return true;
  } catch {
    // Fallback: try Inter, then default
    if (family !== 'Inter') {
      try {
        await figma.loadFontAsync({ family: 'Inter', style });
        fontCache.add(`Inter::${style}`);
        return true;
      } catch { /* fall through */ }
    }
    // Last resort: Inter Regular
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      fontCache.add('Inter::Regular');
      return true;
    } catch {
      return false;
    }
  }
}

function weightToStyle(weight: number): string {
  const map: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  };
  return map[weight] || 'Regular';
}

// ============================================================
// NODE CREATION
// ============================================================

async function createNode(node: DASNode): Promise<SceneNode | null> {
  const { type, name, props } = node;

  switch (type) {
    case 'FRAME':
    case 'IMAGE':
      return createFrame(name, props, type === 'IMAGE');

    case 'TEXT':
      return await createText(name, props);

    case 'RECTANGLE':
      return createRectangle(name, props);

    case 'ELLIPSE':
      return createEllipse(name, props);

    default:
      console.warn(`Unknown node type: ${type}`);
      return null;
  }
}

function createFrame(name: string, props: Record<string, any>, isImage: boolean): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;

  // Dimensions (set before auto layout so sizing modes work)
  if (props.width && props.width !== 'FILL' && props.width !== 'HUG') {
    frame.resize(props.width, props.height || 100);
  } else if (props.height) {
    frame.resize(100, props.height);
  }

  // Auto Layout
  if (props.layoutMode) {
    frame.layoutMode = props.layoutMode === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL';

    if (props.paddingTop !== undefined) frame.paddingTop = props.paddingTop;
    if (props.paddingBottom !== undefined) frame.paddingBottom = props.paddingBottom;
    if (props.paddingLeft !== undefined) frame.paddingLeft = props.paddingLeft;
    if (props.paddingRight !== undefined) frame.paddingRight = props.paddingRight;
    if (props.itemSpacing !== undefined) frame.itemSpacing = props.itemSpacing;

    // Primary axis alignment
    const primaryMap: Record<string, 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'> = {
      'MIN': 'MIN', 'CENTER': 'CENTER', 'MAX': 'MAX', 'SPACE_BETWEEN': 'SPACE_BETWEEN'
    };
    if (props.primaryAxisAlignItems && primaryMap[props.primaryAxisAlignItems]) {
      frame.primaryAxisAlignItems = primaryMap[props.primaryAxisAlignItems];
    }

    // Counter axis alignment
    const counterMap: Record<string, 'MIN' | 'CENTER' | 'MAX'> = {
      'MIN': 'MIN', 'CENTER': 'CENTER', 'MAX': 'MAX'
    };
    if (props.counterAxisAlignItems && counterMap[props.counterAxisAlignItems]) {
      frame.counterAxisAlignItems = counterMap[props.counterAxisAlignItems];
    }
  }

  // Sizing modes (must be set AFTER layoutMode on the parent, applied when appended)
  // These are stored and applied in applyChildSizing()

  // Fills
  if (props.fills) {
    frame.fills = parseFills(props.fills);
  }

  // Strokes
  if (props.strokes) {
    frame.strokes = parseStrokes(props.strokes);
    if (props.strokeWeight) frame.strokeWeight = props.strokeWeight;
    // strokeAlign: Figma only supports INSIDE, OUTSIDE, CENTER on the node level
    // BOTTOM is a common schema value but Figma doesn't support per-side strokes natively
    if (props.strokeAlign && props.strokeAlign !== 'BOTTOM') {
      frame.strokeAlign = props.strokeAlign as 'INSIDE' | 'OUTSIDE' | 'CENTER';
    }
  }

  // Corner radius
  if (props.cornerRadius !== undefined) {
    frame.cornerRadius = props.cornerRadius;
  }

  // Clip content (frames clip by default in Figma)
  frame.clipsContent = props.clipsContent ?? true;

  // Image fill placeholder
  if (isImage) {
    frame.name = `[IMG] ${name}`;
    // Set a light gray fill as placeholder — real image would need figma.createImage()
    frame.fills = [{ type: 'SOLID', color: { r: 0.92, g: 0.92, b: 0.95 }, opacity: 1 }];
  }

  return frame;
}

async function createText(name: string, props: Record<string, any>): Promise<TextNode> {
  const text = figma.createText();
  text.name = name;

  // Load font
  const family = props.fontFamily || 'Inter';
  const weight = props.fontWeight || 400;
  const style = weightToStyle(weight);
  await loadFont(family, style);

  // Set font
  try {
    text.fontName = { family, style };
  } catch {
    text.fontName = { family: 'Inter', style: 'Regular' };
  }

  // Content
  if (props.characters) {
    text.characters = props.characters;
  }

  // Size
  if (props.fontSize) text.fontSize = props.fontSize;

  // Line height
  if (props.lineHeight) {
    if (typeof props.lineHeight === 'object' && props.lineHeight.value) {
      text.lineHeight = { value: props.lineHeight.value, unit: 'PIXELS' };
    } else if (typeof props.lineHeight === 'number') {
      text.lineHeight = { value: props.lineHeight, unit: 'PIXELS' };
    }
  }

  // Text alignment
  if (props.textAlignHorizontal) {
    const alignMap: Record<string, 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'> = {
      'LEFT': 'LEFT', 'CENTER': 'CENTER', 'RIGHT': 'RIGHT', 'JUSTIFIED': 'JUSTIFIED'
    };
    if (alignMap[props.textAlignHorizontal]) {
      text.textAlignHorizontal = alignMap[props.textAlignHorizontal];
    }
  }

  // Fills (text color)
  if (props.fills) {
    text.fills = parseFills(props.fills);
  }

  // Letter spacing
  if (props.letterSpacing) {
    text.letterSpacing = { value: props.letterSpacing, unit: 'PIXELS' };
  }

  return text;
}

function createRectangle(name: string, props: Record<string, any>): RectangleNode {
  const rect = figma.createRectangle();
  rect.name = name;

  if (props.width && props.height) {
    rect.resize(props.width, props.height);
  }

  if (props.fills) rect.fills = parseFills(props.fills);
  if (props.strokes) {
    rect.strokes = parseStrokes(props.strokes);
    if (props.strokeWeight) rect.strokeWeight = props.strokeWeight;
  }
  if (props.cornerRadius !== undefined) rect.cornerRadius = props.cornerRadius;

  return rect;
}

function createEllipse(name: string, props: Record<string, any>): EllipseNode {
  const ellipse = figma.createEllipse();
  ellipse.name = name;

  const w = props.width || 40;
  const h = props.height || w;
  ellipse.resize(w, h);

  if (props.fills) ellipse.fills = parseFills(props.fills);
  if (props.strokes) {
    ellipse.strokes = parseStrokes(props.strokes);
    if (props.strokeWeight) ellipse.strokeWeight = props.strokeWeight;
  }

  return ellipse;
}

// ============================================================
// SIZING — applied after child is appended to parent
// ============================================================

function applyChildSizing(child: SceneNode, props: Record<string, any>) {
  // layoutSizingHorizontal / layoutSizingVertical only work
  // when the child is inside an auto-layout parent

  const parent = child.parent;
  if (!parent || !('layoutMode' in parent) || parent.layoutMode === 'NONE') return;

  const hSizing = props.layoutSizingHorizontal;
  const vSizing = props.layoutSizingVertical;

  if (hSizing === 'FILL' && 'layoutSizingHorizontal' in child) {
    (child as any).layoutSizingHorizontal = 'FILL';
  } else if (hSizing === 'HUG' && 'layoutSizingHorizontal' in child) {
    (child as any).layoutSizingHorizontal = 'HUG';
  }
  // FIXED is the default — explicit width already set during creation

  if (vSizing === 'FILL' && 'layoutSizingVertical' in child) {
    (child as any).layoutSizingVertical = 'FILL';
  } else if (vSizing === 'HUG' && 'layoutSizingVertical' in child) {
    (child as any).layoutSizingVertical = 'HUG';
  }
}

// ============================================================
// TREE BUILDER — flat array + parentId → Figma node tree
// ============================================================

async function buildTree(
  nodes: DASNode[],
  parentFrame: FrameNode
): Promise<Map<string, SceneNode>> {
  const nodeMap = new Map<string, SceneNode>();

  // Pass 1: create all nodes
  for (const node of nodes) {
    const figmaNode = await createNode(node);
    if (figmaNode) {
      nodeMap.set(node.id, figmaNode);
    }
  }

  // Pass 2: build hierarchy (order matters — Figma renders in append order)
  for (const node of nodes) {
    const figmaNode = nodeMap.get(node.id);
    if (!figmaNode) continue;

    if (node.parentId === null) {
      // Root node — append to the screen frame
      parentFrame.appendChild(figmaNode);
    } else {
      const parentNode = nodeMap.get(node.parentId);
      if (parentNode && 'appendChild' in parentNode) {
        (parentNode as FrameNode).appendChild(figmaNode);
      } else {
        // Parent not found — append to screen frame as fallback
        console.warn(`Parent "${node.parentId}" not found for node "${node.id}", appending to root`);
        parentFrame.appendChild(figmaNode);
      }
    }

    // Apply sizing AFTER appending to parent (requires auto-layout context)
    applyChildSizing(figmaNode, node.props);
  }

  return nodeMap;
}

// ============================================================
// SCREEN BUILDER
// ============================================================

async function buildScreen(
  screen: DASScreen,
  xOffset: number
): Promise<FrameNode> {
  // Create a top-level frame for the screen
  const screenFrame = figma.createFrame();
  screenFrame.name = screen.state
    ? `${screen.name} / ${screen.state}`
    : screen.name;

  screenFrame.resize(screen.canvas.width, screen.canvas.height);
  screenFrame.x = xOffset;
  screenFrame.y = 0;
  screenFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  screenFrame.clipsContent = true;

  // Build the node tree inside this screen frame
  // The first root node (parentId: null) becomes the content layer
  if (screen.nodes && screen.nodes.length > 0) {
    await buildTree(screen.nodes, screenFrame);
  }

  return screenFrame;
}

// ============================================================
// LABEL GENERATOR — screen name label above each frame
// ============================================================

async function createScreenLabel(
  screenName: string,
  state: string | undefined,
  x: number,
  width: number
): Promise<TextNode> {
  const label = figma.createText();
  await loadFont('Inter', 'Medium');

  try {
    label.fontName = { family: 'Inter', style: 'Medium' };
  } catch {
    label.fontName = { family: 'Inter', style: 'Regular' };
  }

  label.characters = state ? `${screenName} / ${state}` : screenName;
  label.fontSize = 14;
  label.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
  label.x = x;
  label.y = -28;

  return label;
}

// ============================================================
// VALIDATION
// ============================================================

function validateSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.schema_version) errors.push('Missing schema_version');
  if (!data.screens || !Array.isArray(data.screens)) errors.push('Missing or invalid screens array');
  if (data.screens) {
    data.screens.forEach((screen: any, i: number) => {
      if (!screen.name) errors.push(`Screen ${i}: missing name`);
      if (!screen.canvas) errors.push(`Screen ${i}: missing canvas dimensions`);
      if (!screen.nodes || !Array.isArray(screen.nodes)) {
        errors.push(`Screen ${i}: missing or invalid nodes array`);
      } else {
        const ids = new Set<string>();
        screen.nodes.forEach((node: any, j: number) => {
          if (!node.id) errors.push(`Screen ${i}, node ${j}: missing id`);
          if (!node.type) errors.push(`Screen ${i}, node ${j}: missing type`);
          if (ids.has(node.id)) errors.push(`Screen ${i}, node ${j}: duplicate id "${node.id}"`);
          ids.add(node.id);
          // Check parentId references exist (except null)
          if (node.parentId !== null && !screen.nodes.some((n: any) => n.id === node.parentId)) {
            errors.push(`Screen ${i}, node "${node.id}": parentId "${node.parentId}" not found`);
          }
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// MAIN — orchestrate the import
// ============================================================

async function importFlow(data: DASFlow) {
  // Validate
  const validation = validateSchema(data);
  if (!validation.valid) {
    figma.ui.postMessage({
      type: 'validation-error',
      errors: validation.errors
    });
    return;
  }

  figma.ui.postMessage({ type: 'status', message: 'Starting import...' });

  // Pre-load Inter as fallback font
  await loadFont('Inter', 'Regular');
  await loadFont('Inter', 'Medium');
  await loadFont('Inter', 'Semi Bold');
  await loadFont('Inter', 'Bold');

  // Pre-load fonts from design system
  if (data.design_system?.typography) {
    for (const [role, spec] of Object.entries(data.design_system.typography)) {
      await loadFont(spec.family, weightToStyle(spec.weight));
    }
  }

  // Pre-load fonts referenced in nodes
  const fontFamilies = new Set<string>();
  for (const screen of data.screens) {
    for (const node of screen.nodes) {
      if (node.props.fontFamily) fontFamilies.add(node.props.fontFamily);
    }
  }
  for (const family of fontFamilies) {
    await loadFont(family, 'Regular');
    await loadFont(family, 'Medium');
    await loadFont(family, 'Semi Bold');
    await loadFont(family, 'Bold');
  }

  // Build screens — arrange horizontally with spacing
  const SCREEN_GAP = 80;
  let xOffset = 0;
  const screenFrames: FrameNode[] = [];

  for (let i = 0; i < data.screens.length; i++) {
    const screen = data.screens[i];
    figma.ui.postMessage({
      type: 'status',
      message: `Building screen ${i + 1}/${data.screens.length}: ${screen.name}${screen.state ? ` (${screen.state})` : ''}`
    });

    // Create label above screen
    const label = await createScreenLabel(
      screen.name,
      screen.state,
      xOffset,
      screen.canvas.width
    );
    figma.currentPage.appendChild(label);

    // Create screen
    const screenFrame = await buildScreen(screen, xOffset);
    figma.currentPage.appendChild(screenFrame);
    screenFrames.push(screenFrame);

    xOffset += screen.canvas.width + SCREEN_GAP;
  }

  // Zoom to fit
  if (screenFrames.length > 0) {
    figma.viewport.scrollAndZoomIntoView(screenFrames);
  }

  // Report results
  const totalNodes = data.screens.reduce((sum, s) => sum + s.nodes.length, 0);
  figma.ui.postMessage({
    type: 'complete',
    message: `Imported "${data.flow_name}": ${data.screens.length} screen(s), ${totalNodes} node(s)`
  });
}

// ============================================================
// PLUGIN UI COMMUNICATION
// ============================================================

figma.showUI(__html__, { width: 480, height: 560 });

figma.ui.onmessage = async (msg: any) => {
  if (msg.type === 'import' || msg.type === 'build-flow') {
    try {
      const data = JSON.parse(msg.json) as DASFlow;
      await importFlow(data);
    } catch (err: any) {
      figma.ui.postMessage({
        type: 'error',
        message: `Parse error: ${err.message}`
      });
    }
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
