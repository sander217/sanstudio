(function() {
  "use strict";
  function truncate(s, n) {
    if (s.length <= n) return s;
    return s.slice(0, Math.max(0, n - 1)) + "…";
  }
  const MEANINGFUL_TAGS = /* @__PURE__ */ new Set([
    "section",
    "article",
    "aside",
    "nav",
    "header",
    "footer",
    "main",
    "form",
    "iframe",
    "table",
    "dialog",
    "figure",
    "picture",
    "fieldset",
    "ul",
    "ol",
    "dl",
    "menu"
  ]);
  const LEAF_TAGS = /* @__PURE__ */ new Set([
    "button",
    "a",
    "img",
    "input",
    "textarea",
    "select",
    "iframe",
    "video",
    "audio",
    "canvas"
  ]);
  const MEANINGFUL_CLASS_REGEX = /\b(card|hero|cta|panel|container|block|section|modal|dialog|pricing|feature|sidebar|navbar|banner|grid|list|toolbar|drawer|popover|tooltip|tab|row|col|stack|cluster|wrapper|layout|group|item|actions|media|testimonial|footer|header|field-group|btn-group|controls|figure)\b/i;
  const MAX_WALK = 8;
  const SIZE_FALLBACK_MIN_WIDTH = 260;
  const SIZE_FALLBACK_MIN_HEIGHT = 140;
  function pickMeaningfulTarget(start) {
    if (!start) return null;
    if (isRootContainer(start)) return null;
    const startTag = start.tagName.toLowerCase();
    if (LEAF_TAGS.has(startTag)) return start;
    let current = start;
    for (let i = 0; i < MAX_WALK && current && current !== document.body && current !== document.documentElement; i++) {
      const tag = current.tagName.toLowerCase();
      if (MEANINGFUL_TAGS.has(tag) && isSelectableCandidate(current)) return current;
      if (current.getAttribute("role") && isSelectableCandidate(current)) return current;
      if (current.getAttribute("aria-label") && isSelectableCandidate(current)) return current;
      if (current.getAttribute("data-testid") && isSelectableCandidate(current)) return current;
      const cls = readClassName(current);
      if (cls && MEANINGFUL_CLASS_REGEX.test(cls) && isSelectableCandidate(current)) return current;
      const rect = current.getBoundingClientRect();
      if (rect.width >= SIZE_FALLBACK_MIN_WIDTH && rect.height >= SIZE_FALLBACK_MIN_HEIGHT && hasVisibleChildren(current) && isSelectableCandidate(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return isSelectableCandidate(start) ? start : null;
  }
  function readClassName(el) {
    const cls = el.className;
    if (typeof cls === "string") return cls;
    if (cls && typeof cls.baseVal === "string") {
      return cls.baseVal;
    }
    return null;
  }
  function hasVisibleChildren(el) {
    let seen = 0;
    for (const c of Array.from(el.children)) {
      const r = c.getBoundingClientRect();
      if (r.width > 20 && r.height > 20) seen += 1;
      if (seen >= 2) return true;
    }
    return false;
  }
  function isRootContainer(el) {
    return el === document.body || el === document.documentElement;
  }
  function isSelectableCandidate(el) {
    if (isRootContainer(el)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (viewportWidth > 0 && rect.width >= viewportWidth * 0.97) return false;
    if (viewportHeight > 0 && rect.height >= viewportHeight * 0.92) return false;
    return true;
  }
  function generateSelector(el) {
    if (el.id && isUnique(`#${CSS.escape(el.id)}`)) {
      return `#${CSS.escape(el.id)}`;
    }
    const dataTestId = el.getAttribute("data-testid");
    if (dataTestId) {
      const sel = `[data-testid="${cssEscapeAttr(dataTestId)}"]`;
      if (isUnique(sel)) return sel;
    }
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body && node !== document.documentElement && parts.length < 6) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const same = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (same.length > 1) {
          const idx = same.indexOf(node) + 1;
          part += `:nth-of-type(${idx})`;
        }
      }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ") || el.tagName.toLowerCase();
  }
  function isUnique(selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  }
  function cssEscapeAttr(value) {
    return value.replace(/"/g, '\\"');
  }
  function labelTarget(el) {
    var _a, _b, _c, _d;
    const aria = el.getAttribute("aria-label");
    if (aria) return truncate(aria.trim(), 60);
    const dataLabel = el.getAttribute("data-label") || el.getAttribute("data-testid");
    if (dataLabel) return truncate(dataLabel.trim(), 60);
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    if (role) return `${role} (${tag})`;
    if (tag === "button") {
      const text = textContent(el, 40);
      return text ? `Button: ${text}` : "Button";
    }
    if (tag === "a") {
      const text = textContent(el, 40);
      return text ? `Link: ${text}` : "Link";
    }
    if (tag === "iframe") {
      const title = el.getAttribute("title");
      return title ? `Iframe: ${truncate(title, 40)}` : "Iframe block";
    }
    if (tag === "img") {
      const alt = el.getAttribute("alt");
      return alt ? `Image: ${truncate(alt, 40)}` : "Image";
    }
    if (tag === "header") return "Header";
    if (tag === "footer") return "Footer";
    if (tag === "nav") return "Nav";
    if (tag === "aside") return "Sidebar";
    if (tag === "main") return "Main content";
    if (tag === "form") return "Form block";
    if (tag === "fieldset") return "Form fieldset";
    if (tag === "ul" || tag === "ol" || tag === "menu") return "List block";
    if (tag === "dl") return "Description list";
    if (tag === "table") return "Table block";
    if (tag === "figure" || tag === "picture") {
      const caption = (_b = (_a = el.querySelector("figcaption")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim().slice(0, 40);
      return caption ? `Figure: ${caption}` : "Figure";
    }
    if (tag === "section" || tag === "article") {
      const heading2 = el.querySelector("h1, h2, h3");
      const text = (_c = heading2 == null ? void 0 : heading2.textContent) == null ? void 0 : _c.trim().slice(0, 40);
      return text ? `${titleCase(tag)}: ${text}` : titleCase(tag);
    }
    const meaningful = matchMeaningfulClass(el);
    if (meaningful) {
      const inner = firstInnerIdentifier(el);
      return inner ? `${titleCase(meaningful)}: ${inner}` : `${titleCase(meaningful)} block`;
    }
    const heading = el.querySelector("h1, h2, h3");
    const headingText = (_d = heading == null ? void 0 : heading.textContent) == null ? void 0 : _d.trim().slice(0, 40);
    if (headingText) return `${tag} with heading "${headingText}"`;
    const t = textContent(el, 40);
    if (t) return `${tag}: ${t}`;
    return `${tag} element`;
  }
  function matchMeaningfulClass(el) {
    const cls = readClassName(el);
    if (!cls) return null;
    const m = cls.match(
      /\b(card|hero|cta|panel|container|block|section|modal|dialog|pricing|feature|sidebar|navbar|banner|toolbar)\b/i
    );
    return m ? m[1].toLowerCase() : null;
  }
  function titleCase(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function textContent(el, max) {
    return (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, max);
  }
  function firstInnerIdentifier(el) {
    var _a, _b;
    const heading = el.querySelector("h1, h2, h3, h4, h5, h6");
    const headingText = (_a = heading == null ? void 0 : heading.textContent) == null ? void 0 : _a.trim().replace(/\s+/g, " ").slice(0, 40);
    if (headingText) return headingText;
    const labelled = el.querySelector("[aria-label], [data-label], [data-testid]");
    const labelAttr = (labelled == null ? void 0 : labelled.getAttribute("aria-label")) || (labelled == null ? void 0 : labelled.getAttribute("data-label")) || (labelled == null ? void 0 : labelled.getAttribute("data-testid"));
    if (labelAttr) return labelAttr.slice(0, 40);
    const firstBtn = el.querySelector("button, a");
    const btnText = (_b = firstBtn == null ? void 0 : firstBtn.textContent) == null ? void 0 : _b.trim().replace(/\s+/g, " ").slice(0, 30);
    if (btnText) return btnText;
    const direct = (el.textContent || "").trim().replace(/\s+/g, " ");
    if (direct.length > 0 && direct.length < 60) return direct.slice(0, 40);
    return null;
  }
  function getBoundingBox(el) {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height)
    };
  }
  function buildSelectedTarget(el) {
    const outer = el.outerHTML || "";
    return {
      selector: generateSelector(el),
      label: labelTarget(el),
      boundingBox: getBoundingBox(el),
      snippet: truncate(outer.replace(/\s+/g, " "), 400),
      tag: el.tagName.toLowerCase(),
      hasImage: findImageTarget(el) !== null,
      breadcrumb: buildBreadcrumb(el)
    };
  }
  function buildBreadcrumb(el) {
    const chain = [];
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      chain.unshift(node);
      node = node.parentElement;
    }
    const path = chain.filter((n, idx) => idx === chain.length - 1 || isBreadcrumbCandidate(n)).slice(-5).map((n, idx, arr) => idx === arr.length - 1 ? labelTarget(n) : shortLabel(n));
    return ["Page", ...path];
  }
  function isBreadcrumbCandidate(el) {
    const tag = el.tagName.toLowerCase();
    if (MEANINGFUL_TAGS.has(tag)) return true;
    if (el.getAttribute("role")) return true;
    const cls = readClassName(el);
    if (cls && MEANINGFUL_CLASS_REGEX.test(cls)) return true;
    return false;
  }
  function shortLabel(el) {
    var _a;
    const tag = el.tagName.toLowerCase();
    if (tag === "section" || tag === "article") {
      const heading = el.querySelector("h1, h2, h3");
      const text = (_a = heading == null ? void 0 : heading.textContent) == null ? void 0 : _a.trim().slice(0, 24);
      return text ? text : titleCase(tag);
    }
    if (tag === "header") return "Header";
    if (tag === "footer") return "Footer";
    if (tag === "nav") return "Nav";
    if (tag === "aside") return "Sidebar";
    if (tag === "main") return "Main";
    if (tag === "form") return "Form";
    if (tag === "figure" || tag === "picture") return "Figure";
    if (tag === "ul" || tag === "ol" || tag === "menu") return "List";
    const meaningful = matchMeaningfulClass(el);
    if (meaningful) return titleCase(meaningful);
    return tag;
  }
  function findImageTarget(root) {
    if (root.tagName.toLowerCase() === "img") return root;
    const direct = root.querySelector("img");
    if (direct instanceof HTMLImageElement) return direct;
    return null;
  }
  const OVERLAY_IDS = {
    hover: "ifl-hover-box",
    selection: "ifl-selection-box",
    banner: "ifl-banner",
    styles: "ifl-overlay-styles",
    inlineEditable: "ifl-inline-editable",
    inlineEditing: "ifl-inline-editing",
    dropLine: "ifl-drop-line",
    dropContainer: "ifl-drop-container",
    moveDragging: "ifl-move-dragging"
  };
  function createOverlay() {
    ensureStyles();
    const hover = spawn("div", OVERLAY_IDS.hover);
    hover.style.display = "none";
    const hoverLabel = document.createElement("span");
    hoverLabel.className = "ifl-label ifl-label-hover";
    hover.appendChild(hoverLabel);
    const selection = spawn("div", OVERLAY_IDS.selection);
    selection.style.display = "none";
    const selectionLabel = document.createElement("span");
    selectionLabel.className = "ifl-label";
    selection.appendChild(selectionLabel);
    const banner = spawn("div", OVERLAY_IDS.banner);
    banner.style.display = "none";
    banner.textContent = "Refine Mode — click regions to select or retarget · ESC to exit";
    const dropLine = spawn("div", OVERLAY_IDS.dropLine);
    dropLine.style.display = "none";
    const dropLineLabel = document.createElement("span");
    dropLineLabel.className = "ifl-label ifl-label-drop";
    dropLine.appendChild(dropLineLabel);
    const dropContainer = spawn("div", OVERLAY_IDS.dropContainer);
    dropContainer.style.display = "none";
    document.documentElement.append(hover, selection, banner, dropContainer, dropLine);
    return {
      showHover(rect, label) {
        positionBox(hover, rect);
        if (label) {
          hoverLabel.textContent = label;
          hoverLabel.style.display = "inline-block";
        } else {
          hoverLabel.style.display = "none";
        }
        hover.style.display = "block";
      },
      hideHover() {
        hover.style.display = "none";
      },
      showSelection(rect, label, state) {
        positionBox(selection, rect);
        const prefix = state === "editing" ? "✏️ Editing · " : state === "edited" ? "✳︎ Edited · " : "🔒 Locked · ";
        selectionLabel.textContent = `${prefix}${label}`;
        selection.dataset.state = state;
        selection.style.display = "block";
      },
      hideSelection() {
        selection.style.display = "none";
      },
      showBanner(text) {
        if (text) banner.textContent = text;
        banner.style.display = "block";
      },
      hideBanner() {
        banner.style.display = "none";
      },
      showDropIndicator(rect, label) {
        dropLine.dataset.orientation = rect.orientation;
        dropLine.style.top = `${rect.top}px`;
        dropLine.style.left = `${rect.left}px`;
        dropLine.style.width = `${rect.width}px`;
        dropLine.style.height = `${rect.height}px`;
        if (label) {
          dropLineLabel.textContent = label;
          dropLineLabel.style.display = "inline-block";
        } else {
          dropLineLabel.style.display = "none";
        }
        dropLine.style.display = "block";
      },
      hideDropIndicator() {
        dropLine.style.display = "none";
      },
      showDropContainer(rect) {
        dropContainer.style.top = `${rect.top}px`;
        dropContainer.style.left = `${rect.left}px`;
        dropContainer.style.width = `${rect.width}px`;
        dropContainer.style.height = `${rect.height}px`;
        dropContainer.style.display = "block";
      },
      hideDropContainer() {
        dropContainer.style.display = "none";
      },
      teardown() {
        hover.remove();
        selection.remove();
        banner.remove();
        dropLine.remove();
        dropContainer.remove();
        const style = document.getElementById(OVERLAY_IDS.styles);
        style == null ? void 0 : style.remove();
      }
    };
  }
  function spawn(tag, id) {
    const el = document.createElement(tag);
    el.id = id;
    return el;
  }
  function positionBox(el, rect) {
    el.style.top = `${rect.top}px`;
    el.style.left = `${rect.left}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
  }
  function ensureStyles() {
    if (document.getElementById(OVERLAY_IDS.styles)) return;
    const style = document.createElement("style");
    style.id = OVERLAY_IDS.styles;
    style.textContent = `
    #${OVERLAY_IDS.hover}, #${OVERLAY_IDS.selection} {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      box-sizing: border-box;
      border-radius: 6px;
      transition: top 80ms ease-out, left 80ms ease-out, width 80ms ease-out, height 80ms ease-out;
    }
    #${OVERLAY_IDS.hover} {
      border: 2px solid rgba(88, 101, 242, 0.9);
      background: rgba(88, 101, 242, 0.12);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.4);
    }
    #${OVERLAY_IDS.selection} {
      border: 2px solid rgba(34, 197, 94, 0.95);
      background: rgba(34, 197, 94, 0.10);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.5);
    }
    #${OVERLAY_IDS.selection}[data-state="editing"] {
      border-color: rgba(147, 51, 234, 0.95);
      background: rgba(147, 51, 234, 0.10);
    }
    #${OVERLAY_IDS.selection}[data-state="edited"] {
      border-color: rgba(234, 88, 12, 0.95);
      background: rgba(234, 88, 12, 0.10);
    }
    #${OVERLAY_IDS.selection}[data-state="editing"] .ifl-label {
      background: rgba(88, 28, 135, 0.95);
    }
    #${OVERLAY_IDS.selection}[data-state="edited"] .ifl-label {
      background: rgba(124, 45, 18, 0.95);
    }
    .ifl-label-hover {
      background: rgba(88, 101, 242, 0.95) !important;
    }
    #${OVERLAY_IDS.selection} .ifl-label,
    #${OVERLAY_IDS.hover} .ifl-label {
      position: absolute;
      top: -26px;
      left: 0;
      background: rgba(15, 23, 42, 0.92);
      color: #fff;
      font: 500 12px/1.2 system-ui, -apple-system, 'Segoe UI', sans-serif;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #${OVERLAY_IDS.banner} {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      background: rgba(15, 23, 42, 0.96);
      color: #fff;
      padding: 10px 18px;
      border-radius: 999px;
      font: 500 13px/1 system-ui, -apple-system, 'Segoe UI', sans-serif;
      letter-spacing: 0.2px;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.22);
    }
    .${OVERLAY_IDS.inlineEditable} {
      outline: 2px dashed rgba(88, 101, 242, 0.8);
      outline-offset: 2px;
      cursor: text !important;
      background: rgba(88, 101, 242, 0.08);
    }
    .${OVERLAY_IDS.inlineEditing} {
      outline-style: solid;
      background: rgba(88, 101, 242, 0.14);
    }
    html.ifl-picking-active, html.ifl-picking-active * { cursor: crosshair !important; }
    html.ifl-refine-mode .${OVERLAY_IDS.inlineEditable},
    html.ifl-refine-mode .${OVERLAY_IDS.inlineEditable} * {
      cursor: text !important;
    }
    .ifl-reveal-pin,
    .ifl-reveal-pin * {
      pointer-events: auto !important;
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    html.ifl-move-mode, html.ifl-move-mode * { cursor: grab !important; }
    html.ifl-move-dragging, html.ifl-move-dragging * { cursor: grabbing !important; }
    html.ifl-move-mode .${OVERLAY_IDS.moveDragging},
    html.ifl-move-dragging .${OVERLAY_IDS.moveDragging} {
      opacity: 0.55;
      outline: 2px dashed rgba(236, 72, 153, 0.9);
      outline-offset: 2px;
    }
    #${OVERLAY_IDS.dropContainer} {
      position: fixed;
      pointer-events: none;
      z-index: 2147483645;
      box-sizing: border-box;
      border: 2px dashed rgba(236, 72, 153, 0.75);
      background: rgba(236, 72, 153, 0.06);
      border-radius: 6px;
      transition: top 40ms linear, left 40ms linear, width 40ms linear, height 40ms linear;
    }
    #${OVERLAY_IDS.dropLine} {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      box-sizing: border-box;
      background: rgba(236, 72, 153, 0.95);
      box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.25);
      border-radius: 2px;
    }
    #${OVERLAY_IDS.dropLine}[data-orientation="horizontal"] { min-height: 3px; }
    #${OVERLAY_IDS.dropLine}[data-orientation="vertical"] { min-width: 3px; }
    #${OVERLAY_IDS.dropLine} .ifl-label-drop {
      position: absolute;
      top: -26px;
      left: 0;
      background: rgba(157, 23, 77, 0.95);
      color: #fff;
      font: 500 12px/1.2 system-ui, -apple-system, 'Segoe UI', sans-serif;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      max-width: 320px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
    document.head.appendChild(style);
  }
  const PROTOCOL_NAMESPACE = "ifl/iframe";
  let refineEnabled = false;
  let overlay = null;
  let currentHover = null;
  let selected = null;
  let activePending = null;
  let inlineTextActive = false;
  let originalTextBeforeEdit = null;
  let originalStyles = null;
  function nowIso() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
  function diffId() {
    return `diff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function postToHost(message) {
    window.parent.postMessage(message, "*");
  }
  function ensureOverlay() {
    if (!overlay) overlay = createOverlay();
    return overlay;
  }
  function teardownOverlay() {
    overlay == null ? void 0 : overlay.teardown();
    overlay = null;
  }
  function broadcastRefineMode(enabled) {
    postToHost({ ns: PROTOCOL_NAMESPACE, type: "REFINE_MODE_CHANGED", enabled });
  }
  function captureOriginalStyles(el) {
    const cs = window.getComputedStyle(el);
    return {
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      borderRadius: cs.borderRadius,
      borderWidth: cs.borderWidth,
      padding: cs.padding,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderColor: cs.borderColor
    };
  }
  function selectRegion(picked) {
    selected = picked;
    inlineTextActive = false;
    originalStyles = captureOriginalStyles(picked);
    const target = buildSelectedTarget(picked);
    const pending = {
      tabId: -1,
      pageUrl: location.href,
      pageTitle: document.title,
      target,
      diffs: [],
      capturedAt: nowIso()
    };
    activePending = pending;
    ensureOverlay().showSelection(picked.getBoundingClientRect(), target.label, "locked");
    ensureOverlay().hideHover();
    postToHost({ ns: PROTOCOL_NAMESPACE, type: "TARGET_SELECTED", pending });
  }
  let viewportRaf = 0;
  function refreshSelectionOverlay() {
    if (!selected || !overlay) return;
    if (!document.contains(selected)) {
      overlay.hideSelection();
      return;
    }
    const rect = selected.getBoundingClientRect();
    const state = inlineTextActive ? "editing" : "locked";
    overlay.showSelection(rect, (activePending == null ? void 0 : activePending.target.label) ?? "", state);
  }
  function onViewportChange() {
    if (viewportRaf) return;
    viewportRaf = window.requestAnimationFrame(() => {
      viewportRaf = 0;
      if (refineEnabled && overlay && currentHover && document.contains(currentHover)) {
        overlay.showHover(currentHover.getBoundingClientRect());
      }
      refreshSelectionOverlay();
    });
  }
  function onMouseMove(ev) {
    if (!refineEnabled) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    if (el && el instanceof Element && (el.id === OVERLAY_IDS.hover || el.id === OVERLAY_IDS.selection || el.id === OVERLAY_IDS.banner)) {
      return;
    }
    const picked = pickMeaningfulTarget(el ?? null);
    if (!picked || picked === currentHover) return;
    currentHover = picked;
    ensureOverlay().showHover(picked.getBoundingClientRect());
  }
  function onClick(ev) {
    if (!refineEnabled) return;
    if (inlineTextActive) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    if (!el || !(el instanceof Element)) return;
    const picked = pickMeaningfulTarget(el);
    if (!picked) return;
    ev.preventDefault();
    ev.stopPropagation();
    selectRegion(picked);
  }
  function onKey(ev) {
    if (!refineEnabled) return;
    if (ev.key === "Escape") {
      setRefineMode(false);
      broadcastRefineMode(false);
    }
  }
  function attachViewportListenersOnce() {
    document.addEventListener("scroll", onViewportChange, { capture: true, passive: true });
    window.addEventListener("resize", onViewportChange, { passive: true });
  }
  let viewportListenersAttached = false;
  function setRefineMode(enabled) {
    if (!viewportListenersAttached) {
      attachViewportListenersOnce();
      viewportListenersAttached = true;
    }
    if (refineEnabled === enabled) return;
    refineEnabled = enabled;
    if (enabled) {
      ensureOverlay().showBanner("Refine Mode — click any region · ESC to exit");
      document.documentElement.classList.add("ifl-picking-active");
      document.addEventListener("mousemove", onMouseMove, true);
      document.addEventListener("click", onClick, true);
      document.addEventListener("keydown", onKey, true);
    } else {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey, true);
      document.documentElement.classList.remove("ifl-picking-active");
      overlay == null ? void 0 : overlay.hideBanner();
      overlay == null ? void 0 : overlay.hideHover();
      currentHover = null;
      if (!selected) teardownOverlay();
    }
  }
  function recordTextChange(before, after) {
    if (!selected || !activePending) {
      throw new Error("No active selection for text change");
    }
    return {
      id: diffId(),
      type: "text_change",
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      before,
      after
    };
  }
  function startInlineTextEdit() {
    if (!selected || !(selected instanceof HTMLElement)) {
      throw new Error("No selection to edit");
    }
    if (inlineTextActive) return;
    inlineTextActive = true;
    originalTextBeforeEdit = selected.innerText;
    selected.classList.add(OVERLAY_IDS.inlineEditable, OVERLAY_IDS.inlineEditing);
    selected.setAttribute("contenteditable", "true");
    selected.focus();
    ensureOverlay().showSelection(
      selected.getBoundingClientRect(),
      (activePending == null ? void 0 : activePending.target.label) ?? "editing",
      "editing"
    );
  }
  function stopInlineTextEdit() {
    if (!selected || !(selected instanceof HTMLElement) || !inlineTextActive) return null;
    inlineTextActive = false;
    selected.classList.remove(OVERLAY_IDS.inlineEditable, OVERLAY_IDS.inlineEditing);
    selected.removeAttribute("contenteditable");
    const after = selected.innerText;
    const before = originalTextBeforeEdit ?? "";
    originalTextBeforeEdit = null;
    ensureOverlay().showSelection(
      selected.getBoundingClientRect(),
      (activePending == null ? void 0 : activePending.target.label) ?? "edited",
      after === before ? "locked" : "edited"
    );
    if (after === before) return null;
    return recordTextChange(before, after);
  }
  function hideSelected() {
    if (!selected || !activePending || !(selected instanceof HTMLElement)) {
      throw new Error("No selection to hide");
    }
    const originalDisplay = selected.style.display;
    const preview = (selected.innerText || selected.outerHTML).slice(0, 80);
    selected.style.display = "none";
    return {
      id: diffId(),
      type: "hide",
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      preview,
      originalDisplay
    };
  }
  function removeSelected() {
    if (!selected || !activePending || !(selected instanceof HTMLElement)) {
      throw new Error("No selection to remove");
    }
    const originalDisplay = selected.style.display;
    const preview = (selected.innerText || selected.outerHTML).slice(0, 80);
    selected.style.display = "none";
    return {
      id: diffId(),
      type: "remove",
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      preview,
      originalDisplay
    };
  }
  function setStyleValue(property, value) {
    if (!selected || !activePending || !(selected instanceof HTMLElement) || !originalStyles) return null;
    const formatted = property === "fontWeight" ? String(value) : `${value}px`;
    if (property === "fontWeight") {
      selected.style.fontWeight = formatted;
    } else if (property === "borderRadius") {
      selected.style.borderRadius = formatted;
    } else if (property === "fontSize") {
      selected.style.fontSize = formatted;
    } else if (property === "borderWidth") {
      selected.style.borderWidth = formatted;
      if (!selected.style.borderStyle && getComputedStyle(selected).borderStyle === "none") {
        selected.style.borderStyle = "solid";
      }
    } else if (property === "padding") {
      selected.style.padding = formatted;
    }
    const before = originalStyles[property];
    const existing = activePending.diffs.find(
      (d) => d.type === "style_change" && d.property === property
    );
    if (existing) {
      existing.after = formatted;
      return existing;
    }
    return {
      id: diffId(),
      type: "style_change",
      property,
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      before,
      after: formatted
    };
  }
  function setColorValue(role, value) {
    if (!selected || !activePending || !(selected instanceof HTMLElement) || !originalStyles) return null;
    if (role === "color") {
      selected.style.color = value;
    } else if (role === "backgroundColor") {
      selected.style.backgroundColor = value;
    } else if (role === "borderColor") {
      selected.style.borderColor = value;
      if (!selected.style.borderStyle && getComputedStyle(selected).borderStyle === "none") {
        selected.style.borderStyle = "solid";
      }
      if (!selected.style.borderWidth && getComputedStyle(selected).borderWidth === "0px") {
        selected.style.borderWidth = "1px";
      }
    }
    const before = originalStyles[role];
    const existing = activePending.diffs.find(
      (d) => d.type === "color_change" && d.role === role
    );
    if (existing) {
      existing.after = value;
      return existing;
    }
    return {
      id: diffId(),
      type: "color_change",
      role,
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      before,
      after: value
    };
  }
  const TEXT_TAGS = /* @__PURE__ */ new Set([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "a",
    "em",
    "strong",
    "small",
    "label",
    "li",
    "blockquote"
  ]);
  function findInnerTextTarget(root) {
    var _a;
    const candidates = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      if (TEXT_TAGS.has(node.tagName.toLowerCase())) {
        const text = (_a = node.innerText) == null ? void 0 : _a.trim();
        if (text && text.length > 0) candidates.push(node);
      }
      node = walker.nextNode();
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => depthOf(b) - depthOf(a));
    return candidates[0];
  }
  function depthOf(el) {
    let d = 0;
    let n = el;
    while (n) {
      d++;
      n = n.parentElement;
    }
    return d;
  }
  function attachImageReference(referenceUrl) {
    if (!selected || !activePending) return null;
    const img = selected.tagName.toLowerCase() === "img" ? selected : selected.querySelector("img");
    const originalSrc = img == null ? void 0 : img.src;
    if (img && referenceUrl) {
      img.src = referenceUrl;
    }
    const existing = activePending.diffs.find(
      (d) => d.type === "image_replace_intent"
    );
    if (existing) {
      existing.referenceUrl = referenceUrl;
      existing.appliedToDom = !!img;
      return existing;
    }
    return {
      id: diffId(),
      type: "image_replace_intent",
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      originalSrc,
      referenceKind: "url",
      referenceUrl,
      appliedToDom: !!img
    };
  }
  function markImageRegenerate(prompt) {
    if (!selected || !activePending) return null;
    const img = selected.tagName.toLowerCase() === "img" ? selected : selected.querySelector("img");
    const originalSrc = img == null ? void 0 : img.src;
    const existing = activePending.diffs.find(
      (d) => d.type === "image_regenerate_intent"
    );
    if (existing) {
      existing.prompt = prompt;
      return existing;
    }
    return {
      id: diffId(),
      type: "image_regenerate_intent",
      selector: activePending.target.selector,
      target: activePending.target.label,
      createdAt: nowIso(),
      originalSrc,
      prompt
    };
  }
  function applyDirectEdit(action) {
    try {
      if (action.type === "start_inline_text_edit") {
        startInlineTextEdit();
        return { ok: true, pending: activePending };
      }
      if (action.type === "pick_inner_text") {
        if (!selected) return { ok: false, error: "no current selection" };
        const inner = findInnerTextTarget(selected);
        if (!inner) {
          return { ok: false, error: "no inner text element to drill into" };
        }
        selectRegion(inner);
        return { ok: true, pending: activePending };
      }
      if (action.type === "attach_image_reference") {
        if (action.referenceKind !== "url" || !action.referenceUrl) {
          return { ok: false, error: "only url-kind image references supported in v1" };
        }
        const diff = attachImageReference(action.referenceUrl);
        if (diff && activePending) {
          const idx = activePending.diffs.findIndex((d) => d.id === diff.id);
          if (idx === -1) activePending.diffs = [...activePending.diffs, diff];
        }
        return { ok: true, pending: activePending };
      }
      if (action.type === "mark_image_regenerate") {
        const diff = markImageRegenerate(action.prompt);
        if (diff && activePending) {
          const idx = activePending.diffs.findIndex((d) => d.id === diff.id);
          if (idx === -1) activePending.diffs = [...activePending.diffs, diff];
        }
        return { ok: true, pending: activePending };
      }
      if (action.type === "stop_inline_text_edit") {
        const diff = stopInlineTextEdit();
        if (diff && activePending) activePending.diffs = [...activePending.diffs, diff];
        return { ok: true, pending: activePending };
      }
      if (action.type === "hide_selected") {
        const diff = hideSelected();
        if (activePending) activePending.diffs = [...activePending.diffs, diff];
        return { ok: true, pending: activePending };
      }
      if (action.type === "remove_selected") {
        const diff = removeSelected();
        if (activePending) activePending.diffs = [...activePending.diffs, diff];
        return { ok: true, pending: activePending };
      }
      if (action.type === "set_style_value") {
        const diff = setStyleValue(action.property, action.value);
        if (diff && activePending) {
          const idx = activePending.diffs.findIndex((d) => d.id === diff.id);
          if (idx === -1) activePending.diffs = [...activePending.diffs, diff];
        }
        return { ok: true, pending: activePending };
      }
      if (action.type === "set_color_value") {
        const diff = setColorValue(action.role, action.value);
        if (diff && activePending) {
          const idx = activePending.diffs.findIndex((d) => d.id === diff.id);
          if (idx === -1) activePending.diffs = [...activePending.diffs, diff];
        }
        return { ok: true, pending: activePending };
      }
      if (action.type === "reset_pending_selection") {
        if (action.revert && activePending) revertDiffs(activePending.diffs);
        selected = null;
        activePending = null;
        originalStyles = null;
        overlay == null ? void 0 : overlay.hideSelection();
        return { ok: true, pending: null };
      }
      return {
        ok: false,
        error: `Unsupported action in iframe companion (v1): ${action.type}`
      };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "edit failed" };
    }
  }
  function revertDiffs(diffs) {
    for (let i = diffs.length - 1; i >= 0; i--) {
      const diff = diffs[i];
      try {
        const node = document.querySelector(diff.selector);
        if (!node) continue;
        if (diff.type === "text_change") {
          if (node instanceof HTMLElement) node.innerText = diff.before;
        } else if (diff.type === "hide" || diff.type === "remove") {
          if (node instanceof HTMLElement) node.style.display = diff.originalDisplay ?? "";
        } else if (diff.type === "style_change") {
          if (!(node instanceof HTMLElement)) continue;
          if (diff.property === "fontSize") node.style.fontSize = diff.before;
          else if (diff.property === "fontWeight") node.style.fontWeight = diff.before;
          else if (diff.property === "borderRadius") node.style.borderRadius = diff.before;
          else if (diff.property === "borderWidth") node.style.borderWidth = diff.before;
          else if (diff.property === "padding") node.style.padding = diff.before;
        } else if (diff.type === "color_change") {
          if (!(node instanceof HTMLElement)) continue;
          if (diff.role === "color") node.style.color = diff.before;
          else if (diff.role === "backgroundColor") node.style.backgroundColor = diff.before;
          else if (diff.role === "borderColor") node.style.borderColor = diff.before;
        }
      } catch (err) {
        console.warn("[ifl-companion] revert failed for diff", diff, err);
      }
    }
    return { ok: true };
  }
  function handleRequest(req) {
    if (req.type === "SET_REFINE_MODE") {
      setRefineMode(req.enabled);
      broadcastRefineMode(req.enabled);
      return { ns: PROTOCOL_NAMESPACE, id: req.id, ok: true, result: { enabled: refineEnabled } };
    }
    if (req.type === "GET_REFINE_MODE") {
      return { ns: PROTOCOL_NAMESPACE, id: req.id, ok: true, result: { enabled: refineEnabled } };
    }
    if (req.type === "APPLY_DIRECT_EDIT") {
      const result = applyDirectEdit(req.action);
      return { ns: PROTOCOL_NAMESPACE, id: req.id, ok: result.ok, result, error: result.error };
    }
    if (req.type === "REVERT_DIFFS") {
      const result = revertDiffs(req.diffs);
      return { ns: PROTOCOL_NAMESPACE, id: req.id, ok: result.ok, error: result.error };
    }
    return {
      ns: PROTOCOL_NAMESPACE,
      id: req.id,
      ok: false,
      error: "unknown request type"
    };
  }
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.ns !== PROTOCOL_NAMESPACE) return;
    if (!("id" in data)) return;
    const response = handleRequest(data);
    window.parent.postMessage(response, "*");
  });
})();
//# sourceMappingURL=companion.iife.js.map
