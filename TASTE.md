---
version: alpha
name: Sander Taste
description: |
  Sander 的個人設計品味。放在工作目錄根部的 TASTE.md 會被 Gate 3 當 defaults 載入。
  通用工藝規則已搬到 skills/design-lock/references/craft-rules.md，這裡只留品味。
  上架版不包含這份檔案，買家拿到的是 skills/design-chain/assets/TASTE.template.md。
  結構遵循 DESIGN.md 規範 (skills/design-lock/design-md-spec.md)。
  `colors` / `typography` 是跨專案 fallback；session 的 DESIGN.md 有指定就以它為主。
  `## Typography picks

字體一律是「選過的」，不是模型預設。craft rule `CR-TYPE-002` 已經禁掉 Inter、Roboto、Poppins、Montserrat、DM Sans 那一串當預設；這裡是我的起點清單，專案要換就換，但要在 DESIGN.md 寫明。

- Display（編輯感、有骨架）：Instrument Serif、Fraunces、Gambetta、Clash Display、Hubot Sans。
- Body（安靜、字距寬鬆）：Switzer、General Sans、Hanken Grotesk、IBM Plex Sans。
- 數字和量測：Geist Mono 或 IBM Plex Mono，只給 code、數據、單位，不當「科技感」的戲服。
- 一頁最多兩個家族、三個字重，字重取兩端（300 配 700、400 配 800）。

## Gradient

漸層只有一種我會用：**Williams F1 2026 塗裝那種深藍**。深到近黑的 navy 做暗邊，往光面一路推到亮一階的 royal blue，像 gloss 車漆上一條寬的高光，不是發光、不是霓虹。色相鎖在藍（255 到 265 度），絕不往紫偏，絕不碰 magenta。craft rule `CR-COLOR-005` 的三停點、單色相、亮度驅動規則照常適用。

```yaml
gradient:
  name: williams-blue
  hue: 258-262        # OKLCH hue, locked; drift past 15 degrees = fail
  stops:
    - { name: navy-ink, hex: "#07102C", oklch: "oklch(18% 0.06 267)" }   # dark edge, near-black
    - { name: royal,    hex: "#0834A7", oklch: "oklch(39% 0.19 264)" }   # the body of the sweep
    - { name: electric, hex: "#1D59CA", oklch: "oklch(50% 0.19 262)" }   # the gloss highlight band
  direction: 160deg    # diagonal, dark at top-left or an edge, light sweeping through; never a vertical fade
  highlight: one broad soft band of electric at 25-45% of the run, then back toward royal; no radial glow
  ink-on-top: "#F4F6FB" at every point (contrast >= 4.5:1 checked at the electric stop)
  keyline: optional one hairline of "#3D7BE6" (oklch(60% 0.17 261)) at an edge, as the livery's white keyline; never a second gradient
  allowed-on: hero field, a section band (one per page), the primary CTA, a large stat tile
  never-on: text, chips or pills, inputs, behind running body copy, cards inside a card
  dark-mode: same stops; the page surface itself is navy-ink, the sweep lives on one band only
```

用法口訣：一頁一條 sweep，深邊在外、光在中間、字永遠是近白。看起來要像夜裡車庫燈下的車漆，不像 SaaS 首頁的 mesh。

## Do's and Don'ts` 一律附加到 session 的 binding rules（即使 session DESIGN.md 沒提，也生效）。
colors:
  # 中性底：淺色與深色各一個預設。永不使用純 #000 / #fff。
  surface: "#FAFAF7"          # near-white 底（淺色預設）
  surface-dark: "#1A1C1E"     # charcoal 底（深色預設）
  on-surface: "#1A1C1E"       # 淺底上的文字＝炭黑，強對比
  on-surface-dark: "#F4F4F2"  # 深底上的文字＝近白
  # dominant（主色）與 accent（點綴）每個專案從 ## Colors 的 editorial ink 家族挑，不在這裡寫死。
---

> **partial DESIGN.md。** 每次 Gate 3 載入並把下列規則當 hard constraint。
> 核心一句話：**簡約至上、每頁 ≤3 色、一個焦點、強對比、去裝飾。** 現代編輯感，不是花花綠綠的 SaaS 樣板。

## Overview

我做的東西以 **minimalist 為主軸**：敢留白、相信層級、去掉一切裝飾。介面是工具與內容的載體，不是調色盤。

參照的美學是**現代編輯 / 版畫印刷**那種收斂的力道：一個中性底、一個主色油墨、頂多一個點綴，用**留白、字級落差、與單一焦點**製造張力,而不是靠很多顏色、很多卡片、很多 chip 去填滿。

在沒有明確 session 規則時，Gate 3 的預設決策是：**先減再加**。每個畫面問三件事：這一屏的**唯一焦點**是什麼？能不能**再拿掉一個**元素？顏色**是不是超過三種**？任一答錯就收斂。

## Colors

**鐵則：每個畫面最多 3 種顏色 = 1 個中性底 + 1 個主色(dominant) + 最多 1 個點綴(accent)。** 常態是 2 色(底+主色)就夠。不花花綠綠、不彩虹、不霓虹。

- **中性底(挑一個)：** near-white `#FAFAF7` / cool-gray `#F2F2EF` / warm-paper `#F5F1E8`；深色版 charcoal `#1A1C1E` / carbon `#242321`。**永不用純 `#000000` 或 `#FFFFFF`**：純值殺掉深度。
- **主色油墨(挑一個，現代編輯家族)：**
  Cobalt `#2148B8` · Royal Blue `#2058D4` · Botanical Green `#008A4B` · Mint `#5EB783` · Terracotta `#C65F38` · Signal Red `#C83232` · Aubergine `#63365F` · Charcoal `#30343A`。
- **點綴(可選，最多 1 個，覆蓋面積 < 15%，且要有明確角色：例如只用在數據正負、選中態，不當裝飾)。** 需要配對時從已知組合挑，不亂配：
  Cobalt+Terracotta · Charcoal+Signal Red · Mint+Charcoal · Botanical Green+Oxblood `#8F3434` · Ultramarine `#263E99`+Safety Orange `#E55D2B`。
- **對比是硬規(見 #6)：** 內文文字對底色 **WCAG AA ≥ 4.5:1**，大字(≥18pt / 14pt bold)**≥ 3:1**。主色若拿來當文字，也要在底色上過 4.5:1。**禁止低對比的灰字疊灰底。**
- 主色出現 ≥3 處建立識別(CTA + 一處強調 + 選中/active)，但不因此變第二主色。

## Typography

- **簡約優先、層級靠字級落差不靠顏色。** 至少 3 階(display / headline / body / label)；editorial 場景可放大到 display 是 body 的 5-12 倍，製造一個決定性的字級焦點。
- **標題句尾不加任何標點**：無句號、逗號、破折號、middle-dot。句中標點可以(陳述用句號、並列用逗號)，就是**結尾不留符號**。
- **文案不使用破折號**：全形 `—`、半形 en-dash `–`、`&mdash;`/`&ndash;` 一律不用。用逗號、句號、或改寫句子。範圍值用普通連字號(`2.5-3.5%`)。
- 字體收斂：一個主要顯示字 + 一個功能字就夠，不混三種。禁止 gradient 字、外框字、drop-shadow 字、灌水 3D 字。
- 中文標題偏重時：加行高、拆成有意的斷行、給區塊呼吸，不要一坨粗黑撞在一起。

## Layout

- **Minimalist、留白是主動的節奏不是剩下的空間。** 每屏一個明確的視覺贏家(唯一焦點)，其餘退讓。
- **不使用 bento layout，除非使用者明確要求。** 預設用不對稱 / 單欄 / 編輯式版面。只有當項目**真的等權**且**被要求**時才用等權 grid。
- 不對稱＝自信：避免所有東西置中、避免像模板一樣平均分佈。
- App 內不套網頁模式(hero section、80-120px section gap、50/50 split 進 phone frame = wrong surface)。

### 流程 / 導覽

- **從哪邊進就回哪邊。** 任何 sub-flow、modal、bottom sheet、編輯頁：完成或取消後，回到**進入時的那個畫面**，並保留原本的 scroll 位置與狀態。不跳首頁、不跳 tab 根、不跳無關頁。
- **唯一例外是規格明確要求別的去向**（例如「發布後導到作品頁」）。那就照規格做，並在 interaction spec / handoff 註明這是刻意的例外，不能默默改。
- 流程圖與 transitions 裡，每條「完成 / 取消」的箭頭都要指回入口畫面；找不到入口 = 這條流程還沒設計完。

## Elevation & Depth

- 收斂陰影。深色用 surface tonal layer(底→高一階)+ 1px hairline，不用陰影。
- 淺色陰影限 `0 1px 3px rgba(0,0,0,.08)` 以下，且**染底色色相**，禁止純黑陰影、禁止彩色光暈裝飾。
- 用留白與 hairline 分層，優先於卡片堆疊。

## Shapes

- 一頁一套圓角語言，不在同一區塊混 `full` 與 `sm`。
- 偏好克制的圓角(卡片 12-16px、CTA 視情況 pill 或同系)，radius 是系統不是隨手。

## Components

- **Chip 節制(見 Do's/Don'ts)。** 元件優先用**事實列(fact-row)、細規線標籤、字重/顏色強調、數字**表達，而不是一排彩色 chip。
- 卡片不套卡片(no box-in-box)；能用 hairline + 留白分區就不加容器。

## Do's and Don'ts

**必填核心。** 寫具體、寫處方式、能直接當 lint rule。

### Do

- Do 真實內容：所有金額、名字、數字必須是真資料。`$0.00` / "User Name" 出現在 hi-fi = 失敗。
- Do 每頁 ≤3 色(底 + 主色 + ≤1 點綴)；常態 2 色。主色從 editorial ink 家族挑。
- Do 內文對比過 WCAG AA(≥4.5:1)；大字 ≥3:1。低對比灰字 = 失敗。
- Do 字級 ≥3 階，用字級落差建層級，不用顏色建層級。
- Do 一屏一個焦點，先減再加；能拿掉的元素就拿掉。
- Do 用留白、hairline、fact-row、字重強調 **取代 chip 與卡片堆疊**。
- Do brand 主色出現 ≥3 處(CTA + 強調 + active)，但不變成第二主色。
- Do 流程出口回入口：從哪個畫面進的 sub-flow / modal / sheet，完成或取消後回到那個畫面（保留 scroll 與狀態）。要導去別處必須是規格明確要求，並註明例外。

### Don't

- **Don't 文案用破折號**：`—` `–` `&mdash;` `&ndash;` 一律不用，改逗號/句號/改寫。
- **Don't 標題句尾加標點**：結尾不留句號/逗號/破折號/middle-dot。句中可以。
- **Don't 用 bento layout（除非被明確要求）**：預設不對稱 / 單欄 / 編輯式。
- **Don't 花花綠綠**：超過 3 色、彩虹點綴、霓虹、AI 紫漸層、無角色的第二點綴色 = 失敗。漸層只有上面 `## Gradient` 宣告的 williams-blue 一種，其他一律不用。
- **Don't 純黑純白**：用 off-white / charcoal，保留深度。
- **Don't 過度使用 chip**：chip 只給「真的可枚舉的 tag / filter」，每屏至多 1 群，且不當裝飾。灰底灰字 chip、一排彩色 chip 當資訊 = 失敗；改用 fact-row / 細規線標籤 / 字重色彩強調。
- Don't 灰色 placeholder：任何畫面有 `#E5E5E5` / `#D1D1D1` 空方塊 = 失敗。用真內容或不放。
- Don't emoji 當 icon：🦷 📅 ✅ 在 UI 裡 = 即時 reject。用 Iconify SVG。
- Don't 全字一個級別：所有 17pt 沒階層 = wireframe。
- **Don't 用模型預設字體**：Inter、Roboto、Poppins、Montserrat、DM Sans、system-ui 當 display 或 body = 沒選字。選字見 `## Typography picks`。
- **Don't 標題上方放 eyebrow**：「WHY US」「01 · 功能」那種小字 tracked 大寫標籤一律不用，標題自己撐。
- Don't web pattern in app：hero section、80-120px section gap、50/50 split 在 phone frame 裡 = wrong surface。
- **Don't 流程結束後把人丟到別處**：完成或取消一個 sub-flow 後跳首頁 / tab 根 / 無關頁 = 失敗，除非被明確要求。

### 產業特定

#### Finance / Accounting
- Balance 必須是畫面最大元素（≥48pt）。
- 正負金額用顏色編碼(綠 + / 紅 −)： 這是點綴色的合法角色，不算破壞 ≤3 色(語意色不算入主色計數，但仍克制)。
- 數字欄位用 tabular figures (`fontFeature: "tnum" 1`)。

#### E-commerce
- 商品照 full-bleed 或大卡片，不是縮圖。
- 價格階層至少 2 層字級(原價 / 特價)。

#### Wellness / Productivity
- 更大留白、更低視覺密度；主色更收斂(單色 + 中性)。

#### Social / Content
- 內容(圖 / 影片)是主角，chrome 讓路；顏色交給內容，介面維持中性 + 單一主色。

---

## 我討厭的東西（free-form，Gate 3 載入時會掃）

- 花花綠綠的 SaaS 樣板：五顏六色的 chip、彩色 icon、每個 section 一個顏色。
- 一排灰底灰字的 chip 拿來塞資訊。
- 預設就 bento：把不等權的東西硬塞等權方格。
- 低對比灰字(#9CA3AF 疊白底當內文)。
- 所有 card 都加陰影的 elevation overload；box-in-box-in-box。
- 文案裡的破折號、標題尾巴的句號。
- 純黑 `#000` / 純白 `#fff` 當底或字。
- AI 紫漸層、霓虹光暈、無理由的第二點綴色。
- 做完一件事被丟回首頁，得自己再滑回原本的位置。
