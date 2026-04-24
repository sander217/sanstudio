# Mobile App Design Patterns

Gate 3 reads this file when `product_surface = mobile-app`.
Load condition: Step 0 detects app surface → read this file alongside SKILL.md.

---

## 1. Platform Anatomy

### iOS (Human Interface Guidelines)

```
┌──────────────────────────────┐
│  Status Bar          59pt *  │  * Dynamic Island: 59pt / Notch: 47pt / Legacy: 20pt
├──────────────────────────────┤
│  Navigation Bar      44pt    │  Back chevron (left) + Title (center) + Action (right)
├──────────────────────────────┤
│                              │
│                              │
│  Content Area                │  Scrollable. Inset by safe areas left/right.
│  (full height minus          │
│   nav + tab + safe areas)    │
│                              │
│                              │
├──────────────────────────────┤
│  Tab Bar             49pt    │  3-5 tabs. Icon (24pt) + Label (10pt)
├──────────────────────────────┤
│  Home Indicator      34pt    │  Never place interactive elements here
└──────────────────────────────┘

Default device: iPhone 15 — 393 x 852pt
Safe areas: top 59pt, bottom 34pt, left/right 0pt (portrait)
```

### Android (Material 3)

```
┌──────────────────────────────┐
│  Status Bar          24dp    │  System icons, clock
├──────────────────────────────┤
│  Top App Bar         64dp    │  Nav icon (left) + Title (left-aligned) + Actions (right)
│  (or 152dp medium /          │  Large: collapsible on scroll
│   192dp large)               │
├──────────────────────────────┤
│                              │
│                              │
│  Content Area                │  Edge-to-edge. Content draws behind system bars.
│                              │
│                              │
│                              │
├──────────────────────────────┤
│  Bottom Navigation   80dp    │  3-5 destinations. Icon (24dp) + Label (12sp)
│                              │  Active: pill indicator behind icon
├──────────────────────────────┤
│  Gesture Nav Zone    48dp    │  System gesture area — no interactive elements
└──────────────────────────────┘

Default device: Android compact — 360 x 800dp
Safe areas: top 24dp, bottom 48dp (gesture nav) or 48dp (3-button nav)
```

---

## 2. Navigation Patterns

### Tab Bar (iOS) / Bottom Navigation (Android)

**When:** 3-5 top-level destinations (the most common pattern).

| Property | iOS | Android |
|---|---|---|
| Height | 49pt + safe area (34pt) = 83pt total | 80dp |
| Icon size | 24pt (SF Symbols) | 24dp (Material Symbols) |
| Label | 10pt, below icon | 12sp, below icon |
| Active state | Tint color on icon + label | Pill indicator behind icon |
| Badge | Red circle (number or dot) | Small badge on icon |

**Rules:**
- Each tab maintains its own navigation stack
- Switching tabs preserves scroll position and state
- Tab bar visible on all screens within a tab (hide only for immersive content: video, camera)
- Max 5 tabs. If you need 6+, use a drawer or consolidate

### Navigation Stack (Push/Pop)

| Property | iOS | Android |
|---|---|---|
| Forward | Slide from right | Slide up / forward fade |
| Back | Slide to right (+ edge swipe) | Slide down / reverse fade |
| Back button | `‹` chevron + previous title | `←` arrow, no label |
| Title position | Center (default) or large left-aligned | Left-aligned always |

**Large Title (iOS):** Starts at 34pt left-aligned, collapses to 17pt centered on scroll.
Use for top-level tab screens only, never for detail screens.

### Modal Presentations

| Type | iOS | Android | When to use |
|---|---|---|---|
| Full-screen modal | Cover from bottom | Full-screen | Creation flows (new post, new message) |
| Sheet (half) | `.medium` detent | Bottom sheet peek | Quick actions, filters, sharing |
| Sheet (full) | `.large` detent | Bottom sheet full | Extended input, multi-step within context |
| Alert | Centered dialog | Centered dialog | Confirmations, destructive actions |

**Dismiss rules:**
- All sheets: swipe-down to dismiss + explicit close button (top-right)
- Full-screen modals: "Cancel" (top-left) + "Done/Save" (top-right)
- Never rely on swipe-down alone — always provide a visible close affordance

### Drawer Navigation

**When:** 6+ destinations, or deep hierarchy (enterprise apps).

- Android: standard pattern (hamburger icon, slides from left)
- iOS: less common. Prefer tab bar. If used, slide from left with overlay.
- Drawer items: icon (24dp) + label + optional badge
- Highlight active item

---

## 3. Core App Components → HTML Mapping

### Tab Bar (CSS)

```css
.app-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 49px;
  padding-bottom: env(safe-area-inset-bottom, 34px);
  background: rgba(249, 249, 249, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.tab-item img { width: 24px; height: 24px; }
.tab-item span { font-size: 10px; font-weight: 500; }
.tab-item.active img { filter: none; }  /* tint via Iconify color param */
.tab-item:not(.active) img { filter: grayscale(1) opacity(0.4); }
.tab-item:not(.active) span { color: #8e8e93; }
```

### Navigation Bar (CSS)

```css
.app-nav-bar {
  position: sticky;
  top: 0;
  height: 44px;
  padding-top: env(safe-area-inset-top, 59px);
  background: rgba(249, 249, 249, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 90;
}

.nav-back {
  position: absolute;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--tint-color, #007AFF);
  font-size: 17px;
  min-width: 44px;
  min-height: 44px;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  text-align: center;
}

.nav-action {
  position: absolute;
  right: 8px;
  color: var(--tint-color, #007AFF);
  font-size: 17px;
  font-weight: 400;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Large Title (iOS, CSS)

```css
.large-title-area {
  padding: 0 16px 8px;
  background: var(--bg-primary, #fff);
}

.large-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.37px;
  line-height: 1.2;
}
```

### List / Table View (iOS-style grouped)

```css
.list-group {
  margin: 20px 16px;
  background: var(--bg-secondary, #fff);
  border-radius: 10px;
  overflow: hidden;
}

.list-group-header {
  font-size: 13px;
  font-weight: 400;
  color: #6c6c70;
  text-transform: uppercase;
  letter-spacing: -0.08px;
  padding: 8px 16px 6px;
}

.list-row {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 11px 16px;
  background: var(--bg-secondary, #fff);
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  gap: 12px;
}

.list-row:last-child { border-bottom: none; }

.list-row:active {
  background: rgba(0, 0, 0, 0.05);
  transition: background 0.1s;
}

.list-row-icon {
  width: 29px;
  height: 29px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-row-content { flex: 1; }
.list-row-title { font-size: 17px; }
.list-row-subtitle { font-size: 13px; color: #8e8e93; }
.list-row-chevron { color: #c7c7cc; font-size: 14px; }
```

### Bottom Sheet

```css
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary, #fff);
  border-radius: 12px 12px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 34px);
  z-index: 201;
  max-height: 85vh;
  overflow-y: auto;
}

.bottom-sheet-handle {
  width: 36px;
  height: 5px;
  background: #c7c7cc;
  border-radius: 3px;
  margin: 8px auto;
}

.bottom-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.12);
}
```

### Floating Action Button (Android only)

```css
.fab {
  position: fixed;
  right: 16px;
  bottom: 96px; /* above bottom nav */
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14);
  z-index: 50;
}

.fab:active {
  transform: scale(0.92);
  transition: transform 0.1s;
}
```

### Search Bar

```css
/* iOS style — in content area, not nav bar */
.search-bar {
  margin: 0 16px 8px;
  height: 36px;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
}

.search-bar img { width: 16px; height: 16px; opacity: 0.4; }
.search-bar input {
  flex: 1;
  border: none;
  background: none;
  font-size: 17px;
  outline: none;
}
.search-bar input::placeholder { color: #8e8e93; }
```

### Segmented Control (iOS) / Tabs (Android)

```css
/* iOS Segmented Control */
.segmented-control {
  display: flex;
  background: rgba(118, 118, 128, 0.12);
  border-radius: 8.91px;
  padding: 2px;
  margin: 0 16px;
}

.segment {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6.93px;
  transition: all 0.2s;
}

.segment.active {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
}
```

---

## 4. Gesture Zone Map

```
┌──────────────────────────────┐
│         HARD ZONE            │  Nav bar, status info, settings gear
│      (top 1/3 of screen)     │  Rarely touched — user must shift grip
│                              │
├──────────────────────────────┤
│        STRETCH ZONE          │  Content area, list items, cards
│     (middle 1/3 of screen)   │  Secondary actions, scroll content
│                              │
├──────────────────────────────┤
│       COMFORT ZONE           │  Primary CTA, tab bar, FAB
│     (bottom 1/3 of screen)   │  Easy thumb reach — put important
│                              │  actions here
└──────────────────────────────┘
```

### Touch Target Rules

| Platform | Minimum size | Minimum spacing |
|---|---|---|
| iOS | 44 x 44pt | 8pt between targets |
| Android | 48 x 48dp | 8dp between targets |

### Gesture Conflicts and Resolutions

| User gesture | System gesture | Conflict | Resolution |
|---|---|---|---|
| Horizontal scroll (carousel) | iOS edge swipe back | User swipes right = go back or scroll? | Disable swipe-back on screens with horizontal scroll near edges. Use explicit back button. |
| Pull down on content | Pull-to-refresh | User scrolls up vs. refresh? | Pull-to-refresh triggers ONLY when scroll is at top position (scrollTop === 0). |
| Pull down on sheet | Sheet dismiss | User scrolls content vs. closes sheet? | Sheet has a drag handle at top. Scrolling content inside sheet is independent. |
| Long press on item | iOS context menu | Both trigger at same time | Choose ONE: long press for custom action OR system context menu. Not both. |
| Swipe left on row | System-level swipe | Android back gesture | Keep swipe actions away from screen edges (≥16dp inset). |

---

## 5. iOS vs Android Visual Differences

| Element | iOS (HIG) | Android (Material 3) |
|---|---|---|
| Corner radius | 10-12pt (cards), 6pt (buttons) | 12-16dp (cards), 20dp (FAB) |
| Shadows | Subtle, blur-heavy (blur 20px) | Elevation system (dp tonal + shadow) |
| Dividers | Inset left (16px margin) | Full width or none |
| Body text | SF Pro, 17pt | Roboto, 16sp |
| Large title | 34pt, bold, left-aligned | 28sp, left-aligned |
| System font | -apple-system, SF Pro | Roboto, system-ui |
| Icons | SF Symbols (stroke weight matches text) | Material Symbols (filled or outlined) |
| Selection | Tint color (default #007AFF) | Ripple effect + primary color |
| Toggle | Green (#34C759) track | Primary color fill with thumb |
| Destructive | Red text in action sheet | Red text in dialog |
| Back button | `‹` chevron + prev screen title | `←` arrow icon, no label |
| Navigation title | Centered (inline) or large left | Always left-aligned |
| Tab active | Filled icon + tint color | Pill indicator behind icon |
| Card background | White with subtle shadow | Surface container + tonal elevation |
| Grouped list bg | #F2F2F7 (systemGroupedBackground) | Surface variant |

---

## 6. Phone Frame HTML Template

Use this CSS-only phone frame to wrap all app mockups. Do NOT use a screenshot image.

```html
<div class="phone-frame">
  <div class="phone-screen">
    <!-- Status Bar -->
    <div class="status-bar">
      <span class="status-time">9:41</span>
      <div class="status-icons">
        <img src="https://api.iconify.design/lucide:signal.svg?color=%23000000" width="16" height="16" alt="" />
        <img src="https://api.iconify.design/lucide:wifi.svg?color=%23000000" width="16" height="16" alt="" />
        <img src="https://api.iconify.design/lucide:battery-full.svg?color=%23000000" width="16" height="16" alt="" />
      </div>
    </div>

    <!-- Dynamic Island (iPhone 15) -->
    <div class="dynamic-island"></div>

    <!-- App content goes here -->
    <div class="app-content">
      <!-- nav bar, content, tab bar -->
    </div>
  </div>
</div>
```

```css
.phone-frame {
  width: 393px;
  height: 852px;
  background: #000;
  border-radius: 55px;
  padding: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  position: relative;
  overflow: hidden;
  margin: 40px auto;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: var(--bg-primary, #fff);
  border-radius: 47px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Status Bar */
.status-bar {
  height: 59px;
  padding: 16px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 15px;
  font-weight: 600;
  z-index: 10;
  flex-shrink: 0;
}

.status-time { margin-top: 1px; }
.status-icons { display: flex; gap: 4px; align-items: center; }

/* Dynamic Island */
.dynamic-island {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 126px;
  height: 37px;
  background: #000;
  border-radius: 24px;
  z-index: 20;
}

/* App Content (between status bar and tab bar) */
.app-content {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Tab bar safe area */
.app-content {
  padding-bottom: 83px; /* 49px tab bar + 34px home indicator */
}
```

### Dark Mode Variant

```css
@media (prefers-color-scheme: dark) {
  .phone-screen { background: #000; }
  .status-bar { color: #fff; }
  /* iOS dark backgrounds */
  --bg-primary: #000000;
  --bg-secondary: #1C1C1E;
  --bg-tertiary: #2C2C2E;
  --bg-grouped: #000000;
  --bg-grouped-secondary: #1C1C1E;
  --separator: rgba(84, 84, 88, 0.65);
  --label-primary: #FFFFFF;
  --label-secondary: #EBEBF599;
}
```

**Important:** Never use pure `#000000` as background for Android dark mode.
Use `#121212` (Material) with tonal elevation that adds slight tint as surfaces elevate.

---

## 7. Screen Type Templates

### Feed / List Screen

```
┌─ Nav Bar ─────────────────────┐
│  [Title]            [Action]  │
├───────────────────────────────┤
│  [Search Bar]                 │
├───────────────────────────────┤
│  ┌─ List Item ──────────────┐ │
│  │ [Avatar] Title    [Meta] │ │
│  │          Subtitle    [›] │ │
│  └──────────────────────────┘ │
│  ┌─ List Item ──────────────┐ │
│  │ [Avatar] Title    [Meta] │ │
│  │          Subtitle    [›] │ │
│  └──────────────────────────┘ │
│  ... (scrollable)             │
├─ Tab Bar ─────────────────────┤
│  [🏠] [🔍] [➕] [♡] [👤]    │
└───────────────────────────────┘
```

### Detail Screen

```
┌─ Nav Bar ─────────────────────┐
│  [‹ Back]  [Title]  [Action] │
├───────────────────────────────┤
│  ┌─ Hero Image ────────────┐  │
│  │                          │  │
│  │  (full width, 240pt+)   │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  Title (22pt, bold)            │
│  Subtitle (15pt, secondary)    │
│                                │
│  [Metadata row: chips/badges]  │
│                                │
│  Body text...                  │
│  ... (scrollable)              │
│                                │
│  ┌─ Sticky Bottom CTA ──────┐ │
│  │     [Primary Button]      │ │
│  └───────────────────────────┘ │
└────────────────────────────────┘
```

### Settings Screen

```
┌─ Nav Bar ─────────────────────┐
│  [‹ Back]      Settings       │
├───────────────────────────────┤
│  SECTION HEADER                │
│  ┌─ Grouped List ───────────┐ │
│  │ [Icon] Label     [Toggle]│ │
│  │ [Icon] Label     [Value›]│ │
│  │ [Icon] Label     [Value›]│ │
│  └──────────────────────────┘ │
│                                │
│  SECTION HEADER                │
│  ┌─ Grouped List ───────────┐ │
│  │ [Icon] Label     [Value›]│ │
│  │ [Icon] Label     [Value›]│ │
│  └──────────────────────────┘ │
│  ... (scrollable)              │
├─ Tab Bar ─────────────────────┤
└────────────────────────────────┘
```

### Creation Flow (Modal)

```
┌─ Modal Nav ───────────────────┐
│  [Cancel]  New Post   [Post]  │
├───────────────────────────────┤
│                                │
│  [Text input area]             │
│                                │
│  [Media attachment preview]    │
│                                │
│  ───────────────               │
│  [📷] [🎵] [📍] [...]        │  ← toolbar
│                                │
│  (keyboard area when editing)  │
│                                │
└────────────────────────────────┘
```

---

## 8. Iconify Sets for App Icons

### iOS-style apps → `lucide` or `ph` (Phosphor)

```html
<!-- Tab bar icons (iOS) -->
<img src="https://api.iconify.design/lucide:home.svg?color=%23007AFF" width="24" height="24" />
<img src="https://api.iconify.design/lucide:search.svg?color=%238e8e93" width="24" height="24" />
<img src="https://api.iconify.design/lucide:plus-circle.svg?color=%238e8e93" width="24" height="24" />
<img src="https://api.iconify.design/lucide:heart.svg?color=%238e8e93" width="24" height="24" />
<img src="https://api.iconify.design/lucide:user.svg?color=%238e8e93" width="24" height="24" />

<!-- Nav bar actions -->
<img src="https://api.iconify.design/lucide:chevron-left.svg?color=%23007AFF" width="24" height="24" />
<img src="https://api.iconify.design/lucide:ellipsis.svg?color=%23007AFF" width="24" height="24" />
<img src="https://api.iconify.design/lucide:share.svg?color=%23007AFF" width="24" height="24" />
```

### Android-style apps → `mdi` (Material Design Icons)

```html
<!-- Bottom nav icons (Android) -->
<img src="https://api.iconify.design/mdi:home.svg?color=%236750A4" width="24" height="24" />
<img src="https://api.iconify.design/mdi:magnify.svg?color=%2349454F" width="24" height="24" />
<img src="https://api.iconify.design/mdi:plus.svg?color=%2349454F" width="24" height="24" />
<img src="https://api.iconify.design/mdi:heart-outline.svg?color=%2349454F" width="24" height="24" />
<img src="https://api.iconify.design/mdi:account-circle.svg?color=%2349454F" width="24" height="24" />

<!-- Top app bar -->
<img src="https://api.iconify.design/mdi:arrow-left.svg?color=%231D1B20" width="24" height="24" />
<img src="https://api.iconify.design/mdi:dots-vertical.svg?color=%231D1B20" width="24" height="24" />
```

---

## 9. App-Specific Image Strategy

App screens need different image treatment than web pages.

**ALWAYS use full `<img>` tag with explicit px dimensions.** Unsplash URLs WILL break if 
you omit the size in the URL or the inline style. These are the only formats that render:

### Correct Unsplash format for app images

```html
<!-- List thumbnail (60x60, square, rounded) -->
<img src="https://source.unsplash.com/120x120/?restaurant,interior"
     style="width:60px;height:60px;border-radius:10px;object-fit:cover;flex-shrink:0;" alt="..." />

<!-- List thumbnail (56x56, slightly smaller) -->
<img src="https://source.unsplash.com/112x112/?coffee,cafe"
     style="width:56px;height:56px;border-radius:8px;object-fit:cover;flex-shrink:0;" alt="..." />

<!-- Featured card hero (full width, tall) -->
<img src="https://source.unsplash.com/800x480/?restaurant,atmospheric,interior"
     style="width:100%;height:200px;object-fit:cover;border-radius:0;" alt="..." />

<!-- Detail screen hero (full width) -->
<img src="https://source.unsplash.com/800x600/?[subject],detail,professional"
     style="width:100%;height:240px;object-fit:cover;" alt="..." />

<!-- Profile avatar (circular) -->
<img src="https://source.unsplash.com/200x200/?portrait,professional,face"
     style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt="..." />

<!-- Profile avatar (larger) -->
<img src="https://source.unsplash.com/200x200/?portrait,professional"
     style="width:72px;height:72px;border-radius:50%;object-fit:cover;" alt="..." />
```

### Query keywords by domain

| App type | List thumbnail | Featured hero | Detail |
|---|---|---|---|
| Restaurant / food | `restaurant,interior,cozy` | `restaurant,atmospheric,dim` | `food,dish,plated` |
| Cafe / coffee | `coffee,cafe,interior` | `cafe,coffee,morning` | `coffee,latte,art` |
| Retail / fashion | `fashion,store,minimal` | `fashion,editorial` | `clothing,detail` |
| Fitness | `gym,workout,fitness` | `fitness,motivation` | `exercise,training` |
| Travel | `travel,destination` | `landscape,scenic` | `landmark,architecture` |
| Health / medical | `medical,professional,clean` | `healthcare,modern` | `doctor,consultation` |
| Real estate | `house,interior,modern` | `architecture,exterior` | `room,interior` |
| Local services | `professional,service,clean` | `workplace,office` | `professional,work` |

### When to use images vs icons

| Screen type | Image approach |
|---|---|
| Feed / list items | ✅ 60x60pt thumbnail (Unsplash). Always. Gray box = reject. |
| Featured card | ✅ Full-width photo behind gradient overlay |
| Detail hero | ✅ Full-width photo, 240-300pt height |
| Profile / avatar | ✅ Circular 44-72pt (Unsplash portrait) |
| Settings rows | ❌ Icons only (Iconify). No photos. |
| Onboarding | ✅ Full-width lifestyle photo OR icon-only illustration |
| Empty state | ❌ Iconify icon (64pt) + headline + subtext. No photo. |
| Tab bar | ❌ Iconify icons only. No photos. |

---

## 10. App Interaction States (CSS)

Apps use `:active` (press), not `:hover`. There is no cursor.

```css
/* Global: remove web cursor and hover */
* { cursor: default; }
a, button, [role="button"] { cursor: default; }

/* Press state for tappable elements */
.tappable:active {
  opacity: 0.7;
  transition: opacity 0.1s;
}

/* Press state for list rows (iOS) */
.list-row:active {
  background: rgba(0, 0, 0, 0.05);
}

/* Press state for buttons */
.app-button:active {
  transform: scale(0.97);
  transition: transform 0.1s;
}

/* Ripple effect (Android) */
.ripple {
  position: relative;
  overflow: hidden;
}
.ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(0,0,0,0.12) 10%, transparent 10%);
  background-size: 200% 200%;
  background-position: center;
  opacity: 0;
  transition: opacity 0.3s;
}
.ripple:active::after {
  opacity: 1;
  background-size: 100% 100%;
}
```

---

## 12. What Makes App Design "Awesome"

These are the visual quality principles that separate generic AI output from 
shipped-quality design. Apply ALL of these before generating HTML.

### Depth System (elevation layers)

Every screen must have 3 visible layers:

```
Layer 0 — Page background:  #F2F2F7 (iOS grouped) or white
Layer 1 — Cards/surfaces:   white with subtle shadow
Layer 2 — Elevated/active:  white with stronger shadow + slight scale
```

```css
/* Layer 1: Standard card */
.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* Layer 2: Featured / elevated card */
.card-featured {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

### Visual Hierarchy Rule: ONE HERO per screen

Every screen needs ONE element that is obviously the most important thing:

| Screen type | Hero element | Hero treatment |
|---|---|---|
| Discovery/feed | Featured card | 200pt+ height, photo bg, gradient overlay |
| Detail | Header image | Full-width, 240pt height, sticky on scroll |
| Settings | n/a | No hero. Grouped list = the structure IS the hierarchy. |
| Onboarding | Illustration / photo | 50-60% of screen height |
| Profile | Cover photo + avatar | Layered: cover bg + floating avatar |

**Rule:** If you cannot identify the hero element in your mockup in 2 seconds, redesign.

### Featured Card Pattern (discovery apps)

Featured cards MUST have:
1. Background photo (full bleed, NOT a thumbnail on white)
2. Gradient overlay (bottom-up, dark → transparent)
3. Text ON the photo (white, high contrast)
4. One clear CTA (pill button, bottom of card)

```css
.featured-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 200px;
  margin: 0 16px;
}

.featured-card .bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-card .gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
}

.featured-card .content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  color: white;
}

.featured-card .title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.featured-card .subtitle {
  font-size: 13px;
  opacity: 0.85;
  margin-bottom: 12px;
}

.featured-card .cta-pill {
  display: inline-block;
  background: white;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 100px;
}
```

### Section Header Pattern

Sections need visual breathing room. Never stack two dense sections:

```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 16px 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.section-see-all {
  font-size: 15px;
  color: var(--tint, #007AFF);
  font-weight: 400;
}
```

### Horizontal Scroll Chips (category filters)

Filter chips give breathing room and break the vertical monotony:

```css
.chip-scroll {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}
.chip-scroll::-webkit-scrollbar { display: none; }

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1.5px solid #E5E5EA;
  background: white;
}

.chip.active {
  background: var(--tint, #007AFF);
  color: white;
  border-color: transparent;
}
```

### List Item Rhythm (avoiding monotonous density)

The problem with dense lists is no visual variety. Use these techniques:

**Technique 1: Leading image anchors**
Every list item has a 60x60pt image — this creates rhythm and breaks text monotony.

**Technique 2: Status indicators**
Use colored badges, pills, or dots to create visual interest:
```css
.urgency-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 100px;
  background: #FF3B30;
  color: white;
}
.ends-soon { background: #FF9500; }
.available { background: #34C759; }
```

**Technique 3: Spacing variation**
- Between sections: 20-24px (the `section-header` padding handles this)
- Within section: 0 (dividers only, no gaps between rows)
- This contrast of tight rows + spacious section breaks creates rhythm

### Typography Scale (iOS, use exactly)

```css
:root {
  --text-large-title:  34px; font-weight: 700; /* top-level tab title */
  --text-title1:       28px; font-weight: 700; /* section/page title */
  --text-title2:       22px; font-weight: 700; /* card title, featured */
  --text-title3:       20px; font-weight: 600; /* section headers */
  --text-headline:     17px; font-weight: 600; /* list item title */
  --text-body:         17px; font-weight: 400; /* body text */
  --text-callout:      16px; font-weight: 400; /* secondary info */
  --text-subhead:      15px; font-weight: 400; /* subtitles, meta */
  --text-footnote:     13px; font-weight: 400; /* captions, timestamps */
  --text-caption:      12px; font-weight: 400; /* smallest text */
  --text-tab-label:    10px; font-weight: 500; /* tab bar labels */
}
```

Use AT LEAST 3 different sizes per screen. Monotony = all text at 15-17px.

---

## 13. Reference App Patterns

Study these to understand what "awesome" looks like in each category.

### Discovery + Booking (Airbnb model)

```
Header:  Location + date = personalized entry
Hero:    Full-width card carousel — photo dominant, 2-3 words max
Below:   Category chips (horizontal scroll)
List:    2-column grid, photo cards, minimal text (name + price)
CTA:     Prominent "Book" or primary action on the card itself
```

Key visual moves:
- Photos take 60-70% of screen real estate
- White space is generous (16px padding, 12px card gaps)
- Typography: large title collapses on scroll (parallax feel)
- Color: white base + 1 accent (coral, teal, etc.)

### Local Deals (Foursquare / Groupon model)

```
Header:  Location + count ("9 deals near you") — specificity = trust
Filters: Horizontal chip scroll (All, Food, Retail, Services)
Hero:    1 featured card with photo background + gradient + CTA
List:    Full-width rows: [60x60 thumbnail] + [2-line info] + [Book pill]
Badge:   Urgency ("Ends 3:00 PM" in orange, "5 slots left" in red)
```

Key visual moves:
- Featured card at 200pt height — clearly the most important item
- List items use real photos as thumbnails (not icons, not initials)
- Urgency indicators drive action (colored badges, not plain text)
- "Book" is a pill button on each row — not a full-width CTA

### Food Delivery (Grab / Uber Eats model)

```
Header:  Address + delivery time estimate
Hero:    Promotional banner (scrollable) — 160pt height
Below:   Restaurant categories (icon + label chips)
List:    Restaurant cards: photo (16:9) + name + rating + delivery time + fee
```

Key visual moves:
- Every restaurant has a banner-style photo (NOT square thumbnail)
- Rating displayed as ⭐ 4.8 (star icon + number) not text only
- Delivery time + fee shown inline — utility before aesthetics

### Social / Community (Instagram model)

```
Header:  App name/logo + notification + compose icons
Stories: Horizontal scroll of circular avatars (64pt)
Feed:    Full-width posts: [avatar + name] > [photo] > [actions] > [caption]
```

Key visual moves:
- User-generated photos take full width (square or 4:5 ratio)
- Reactions and counts below the photo (not overlaid)
- Comments are collapsed — "View all 47 comments" pattern

### Settings / Profile (iOS Settings model)

```
Header:   Profile row: [avatar 60pt] + [name] + [subtitle] + [›]
Sections: Grouped list with section headers (uppercase 13pt gray)
Rows:     [colored icon square] + [label] + [value or chevron]
Danger:   Separated section at bottom, red text, no icon
```

Key visual moves:
- Icon squares add color and visual rhythm to what would be pure text
- Section breaks (20px+ gap) prevent the "wall of settings" feeling
- Destructive actions isolated at the bottom

---

## 11. Common Mistakes Checklist

Before submitting any app mockup, verify:

- [ ] Phone frame present (CSS, not image)
- [ ] Status bar shows time + icons (not blank)
- [ ] Safe areas respected (no content behind status bar or home indicator)
- [ ] Tab bar has 3-5 items, not 6+
- [ ] All touch targets ≥ 44x44pt
- [ ] No `:hover` states — only `:active` press states
- [ ] No `cursor: pointer` anywhere
- [ ] Navigation bar has back button on non-root screens
- [ ] Content doesn't scroll behind nav bar or under tab bar
- [ ] Platform consistency: don't mix iOS chevron with Android FAB
- [ ] Icons from Iconify, not emoji
- [ ] Images from Unsplash or image_search, not gray placeholders
- [ ] Dark mode: not pure black (#000) on Android — use #121212
