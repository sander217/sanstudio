"use strict";
function hexToRgb(hex) {
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
function parseFills(fills) {
    if (!fills || !Array.isArray(fills))
        return [];
    return fills.map(f => {
        var _a;
        if (f.type === 'SOLID' && f.color) {
            const rgb = hexToRgb(f.color);
            return { type: 'SOLID', color: rgb, opacity: (_a = f.opacity) !== null && _a !== void 0 ? _a : 1 };
        }
        return { type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } };
    });
}
function parseStrokes(strokes) {
    if (!strokes || !Array.isArray(strokes))
        return [];
    return strokes.map(s => {
        var _a;
        if (s.type === 'SOLID' && s.color) {
            return { type: 'SOLID', color: hexToRgb(s.color), opacity: (_a = s.opacity) !== null && _a !== void 0 ? _a : 1 };
        }
        return { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } };
    });
}
const fontCache = new Set();
async function loadFont(family, style) {
    const key = `${family}::${style}`;
    if (fontCache.has(key))
        return true;
    try {
        await figma.loadFontAsync({ family, style });
        fontCache.add(key);
        return true;
    }
    catch (_a) {
        if (family !== 'Inter') {
            try {
                await figma.loadFontAsync({ family: 'Inter', style });
                fontCache.add(`Inter::${style}`);
                return true;
            }
            catch (_b) { }
        }
        try {
            await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
            fontCache.add('Inter::Regular');
            return true;
        }
        catch (_c) {
            return false;
        }
    }
}
function weightToStyle(weight) {
    const map = {
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
async function createNode(node) {
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
function createFrame(name, props, isImage) {
    var _a;
    const frame = figma.createFrame();
    frame.name = name;
    if (props.width && props.width !== 'FILL' && props.width !== 'HUG') {
        frame.resize(props.width, props.height || 100);
    }
    else if (props.height) {
        frame.resize(100, props.height);
    }
    if (props.layoutMode) {
        frame.layoutMode = props.layoutMode === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL';
        if (props.paddingTop !== undefined)
            frame.paddingTop = props.paddingTop;
        if (props.paddingBottom !== undefined)
            frame.paddingBottom = props.paddingBottom;
        if (props.paddingLeft !== undefined)
            frame.paddingLeft = props.paddingLeft;
        if (props.paddingRight !== undefined)
            frame.paddingRight = props.paddingRight;
        if (props.itemSpacing !== undefined)
            frame.itemSpacing = props.itemSpacing;
        const primaryMap = {
            'MIN': 'MIN', 'CENTER': 'CENTER', 'MAX': 'MAX', 'SPACE_BETWEEN': 'SPACE_BETWEEN'
        };
        if (props.primaryAxisAlignItems && primaryMap[props.primaryAxisAlignItems]) {
            frame.primaryAxisAlignItems = primaryMap[props.primaryAxisAlignItems];
        }
        const counterMap = {
            'MIN': 'MIN', 'CENTER': 'CENTER', 'MAX': 'MAX'
        };
        if (props.counterAxisAlignItems && counterMap[props.counterAxisAlignItems]) {
            frame.counterAxisAlignItems = counterMap[props.counterAxisAlignItems];
        }
    }
    if (props.fills) {
        frame.fills = parseFills(props.fills);
    }
    if (props.strokes) {
        frame.strokes = parseStrokes(props.strokes);
        if (props.strokeWeight)
            frame.strokeWeight = props.strokeWeight;
        if (props.strokeAlign && props.strokeAlign !== 'BOTTOM') {
            frame.strokeAlign = props.strokeAlign;
        }
    }
    if (props.cornerRadius !== undefined) {
        frame.cornerRadius = props.cornerRadius;
    }
    frame.clipsContent = (_a = props.clipsContent) !== null && _a !== void 0 ? _a : true;
    if (isImage) {
        frame.name = `[IMG] ${name}`;
        frame.fills = [{ type: 'SOLID', color: { r: 0.92, g: 0.92, b: 0.95 }, opacity: 1 }];
    }
    return frame;
}
async function createText(name, props) {
    const text = figma.createText();
    text.name = name;
    const family = props.fontFamily || 'Inter';
    const weight = props.fontWeight || 400;
    const style = weightToStyle(weight);
    await loadFont(family, style);
    try {
        text.fontName = { family, style };
    }
    catch (_a) {
        text.fontName = { family: 'Inter', style: 'Regular' };
    }
    if (props.characters) {
        text.characters = props.characters;
    }
    if (props.fontSize)
        text.fontSize = props.fontSize;
    if (props.lineHeight) {
        if (typeof props.lineHeight === 'object' && props.lineHeight.value) {
            text.lineHeight = { value: props.lineHeight.value, unit: 'PIXELS' };
        }
        else if (typeof props.lineHeight === 'number') {
            text.lineHeight = { value: props.lineHeight, unit: 'PIXELS' };
        }
    }
    if (props.textAlignHorizontal) {
        const alignMap = {
            'LEFT': 'LEFT', 'CENTER': 'CENTER', 'RIGHT': 'RIGHT', 'JUSTIFIED': 'JUSTIFIED'
        };
        if (alignMap[props.textAlignHorizontal]) {
            text.textAlignHorizontal = alignMap[props.textAlignHorizontal];
        }
    }
    if (props.fills) {
        text.fills = parseFills(props.fills);
    }
    if (props.letterSpacing) {
        text.letterSpacing = { value: props.letterSpacing, unit: 'PIXELS' };
    }
    return text;
}
function createRectangle(name, props) {
    const rect = figma.createRectangle();
    rect.name = name;
    if (props.width && props.height) {
        rect.resize(props.width, props.height);
    }
    if (props.fills)
        rect.fills = parseFills(props.fills);
    if (props.strokes) {
        rect.strokes = parseStrokes(props.strokes);
        if (props.strokeWeight)
            rect.strokeWeight = props.strokeWeight;
    }
    if (props.cornerRadius !== undefined)
        rect.cornerRadius = props.cornerRadius;
    return rect;
}
function createEllipse(name, props) {
    const ellipse = figma.createEllipse();
    ellipse.name = name;
    const w = props.width || 40;
    const h = props.height || w;
    ellipse.resize(w, h);
    if (props.fills)
        ellipse.fills = parseFills(props.fills);
    if (props.strokes) {
        ellipse.strokes = parseStrokes(props.strokes);
        if (props.strokeWeight)
            ellipse.strokeWeight = props.strokeWeight;
    }
    return ellipse;
}
function applyChildSizing(child, props) {
    const parent = child.parent;
    if (!parent || !('layoutMode' in parent) || parent.layoutMode === 'NONE')
        return;
    const hSizing = props.layoutSizingHorizontal;
    const vSizing = props.layoutSizingVertical;
    if (hSizing === 'FILL' && 'layoutSizingHorizontal' in child) {
        child.layoutSizingHorizontal = 'FILL';
    }
    else if (hSizing === 'HUG' && 'layoutSizingHorizontal' in child) {
        child.layoutSizingHorizontal = 'HUG';
    }
    if (vSizing === 'FILL' && 'layoutSizingVertical' in child) {
        child.layoutSizingVertical = 'FILL';
    }
    else if (vSizing === 'HUG' && 'layoutSizingVertical' in child) {
        child.layoutSizingVertical = 'HUG';
    }
}
async function buildTree(nodes, parentFrame) {
    const nodeMap = new Map();
    for (const node of nodes) {
        const figmaNode = await createNode(node);
        if (figmaNode) {
            nodeMap.set(node.id, figmaNode);
        }
    }
    for (const node of nodes) {
        const figmaNode = nodeMap.get(node.id);
        if (!figmaNode)
            continue;
        if (node.parentId === null) {
            parentFrame.appendChild(figmaNode);
        }
        else {
            const parentNode = nodeMap.get(node.parentId);
            if (parentNode && 'appendChild' in parentNode) {
                parentNode.appendChild(figmaNode);
            }
            else {
                console.warn(`Parent "${node.parentId}" not found for node "${node.id}", appending to root`);
                parentFrame.appendChild(figmaNode);
            }
        }
        applyChildSizing(figmaNode, node.props);
    }
    return nodeMap;
}
async function buildScreen(screen, xOffset) {
    const screenFrame = figma.createFrame();
    screenFrame.name = screen.state
        ? `${screen.name} / ${screen.state}`
        : screen.name;
    screenFrame.resize(screen.canvas.width, screen.canvas.height);
    screenFrame.x = xOffset;
    screenFrame.y = 0;
    screenFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    screenFrame.clipsContent = true;
    if (screen.nodes && screen.nodes.length > 0) {
        await buildTree(screen.nodes, screenFrame);
    }
    return screenFrame;
}
async function createScreenLabel(screenName, state, x, width) {
    const label = figma.createText();
    await loadFont('Inter', 'Medium');
    try {
        label.fontName = { family: 'Inter', style: 'Medium' };
    }
    catch (_a) {
        label.fontName = { family: 'Inter', style: 'Regular' };
    }
    label.characters = state ? `${screenName} / ${state}` : screenName;
    label.fontSize = 14;
    label.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    label.x = x;
    label.y = -28;
    return label;
}
function validateSchema(data) {
    const errors = [];
    if (!data.schema_version)
        errors.push('Missing schema_version');
    if (!data.screens || !Array.isArray(data.screens))
        errors.push('Missing or invalid screens array');
    if (data.screens) {
        data.screens.forEach((screen, i) => {
            if (!screen.name)
                errors.push(`Screen ${i}: missing name`);
            if (!screen.canvas)
                errors.push(`Screen ${i}: missing canvas dimensions`);
            if (!screen.nodes || !Array.isArray(screen.nodes)) {
                errors.push(`Screen ${i}: missing or invalid nodes array`);
            }
            else {
                const ids = new Set();
                screen.nodes.forEach((node, j) => {
                    if (!node.id)
                        errors.push(`Screen ${i}, node ${j}: missing id`);
                    if (!node.type)
                        errors.push(`Screen ${i}, node ${j}: missing type`);
                    if (ids.has(node.id))
                        errors.push(`Screen ${i}, node ${j}: duplicate id "${node.id}"`);
                    ids.add(node.id);
                    if (node.parentId !== null && !screen.nodes.some((n) => n.id === node.parentId)) {
                        errors.push(`Screen ${i}, node "${node.id}": parentId "${node.parentId}" not found`);
                    }
                });
            }
        });
    }
    return { valid: errors.length === 0, errors };
}
async function importFlow(data) {
    var _a;
    const validation = validateSchema(data);
    if (!validation.valid) {
        figma.ui.postMessage({
            type: 'validation-error',
            errors: validation.errors
        });
        return;
    }
    figma.ui.postMessage({ type: 'status', message: 'Starting import...' });
    await loadFont('Inter', 'Regular');
    await loadFont('Inter', 'Medium');
    await loadFont('Inter', 'Semi Bold');
    await loadFont('Inter', 'Bold');
    if ((_a = data.design_system) === null || _a === void 0 ? void 0 : _a.typography) {
        for (const [role, spec] of Object.entries(data.design_system.typography)) {
            await loadFont(spec.family, weightToStyle(spec.weight));
        }
    }
    const fontFamilies = new Set();
    for (const screen of data.screens) {
        for (const node of screen.nodes) {
            if (node.props.fontFamily)
                fontFamilies.add(node.props.fontFamily);
        }
    }
    for (const family of fontFamilies) {
        await loadFont(family, 'Regular');
        await loadFont(family, 'Medium');
        await loadFont(family, 'Semi Bold');
        await loadFont(family, 'Bold');
    }
    const SCREEN_GAP = 80;
    let xOffset = 0;
    const screenFrames = [];
    for (let i = 0; i < data.screens.length; i++) {
        const screen = data.screens[i];
        figma.ui.postMessage({
            type: 'status',
            message: `Building screen ${i + 1}/${data.screens.length}: ${screen.name}${screen.state ? ` (${screen.state})` : ''}`
        });
        const label = await createScreenLabel(screen.name, screen.state, xOffset, screen.canvas.width);
        figma.currentPage.appendChild(label);
        const screenFrame = await buildScreen(screen, xOffset);
        figma.currentPage.appendChild(screenFrame);
        screenFrames.push(screenFrame);
        xOffset += screen.canvas.width + SCREEN_GAP;
    }
    if (screenFrames.length > 0) {
        figma.viewport.scrollAndZoomIntoView(screenFrames);
    }
    const totalNodes = data.screens.reduce((sum, s) => sum + s.nodes.length, 0);
    figma.ui.postMessage({
        type: 'complete',
        message: `Imported "${data.flow_name}": ${data.screens.length} screen(s), ${totalNodes} node(s)`
    });
}
figma.showUI(__html__, { width: 480, height: 560 });
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import' || msg.type === 'build-flow') {
        try {
            const data = JSON.parse(msg.json);
            await importFlow(data);
        }
        catch (err) {
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
