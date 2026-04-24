---
version: alpha
name: Sander Personal Manifesto
description: |
  Sander 的個人設計信條，每次 Gate 3 hi-fi 前載入。結構遵循 DESIGN.md 規範
  (skills/design-lock/design-md-spec.md)。其中 `colors`、`typography` 區段可選
  ——填了就成為跨專案的預設 fallback；空著由每個 session 的 DESIGN.md 主導。
# colors:                  # 可選：放這裡 = 跨專案預設
#   primary: "#YOUR_HEX"
# typography:              # 可選：跨專案預設字體
#   body-md:
#     fontFamily: Inter
#     fontSize: 16px
#     fontWeight: 400
---

> 這是 **partial DESIGN.md**。必填段：Overview、Do's and Don'ts。其他 section 有想法就寫。Gate 3 每次載入並把規則當 hard constraint。

## Overview

_寫 200–400 字。你對 hi-fi mobile app 的整體哲學。例：「我做的東西要有重量、要敢留白、要相信使用者看得懂層級。介面是工具，不是裝飾。」這段是給 Gate 3 在沒有明確規則時的決策依據。_

## Colors

_可選。如果你有跨專案的色彩偏好（例如永遠避免哪種色相、永遠保留哪種對比範圍），寫在這裡。_

- 例：避免純黑 `#000000`，dark mode 一律用 `#0B0F1A` 或更深的 cool slate
- 例：禁止使用紫色作為 primary
- 例：error 色一律 `#FF6B6B`，不用紅色 primary

## Typography

_可選。跨專案的字體偏好。_

- 例：Inter 為預設字體家族
- 例：Body 字級下限 15px，行高 ≥ 1.45
- 例：絕不混用 serif + sans-serif

## Layout

_可選。空間語言偏好。_

- 例：Mobile screen-padding 預設 20px
- 例：禁止網頁式 80–120px section gap 出現在 app 裡

## Elevation & Depth

_可選。陰影 / 色調 / 邊框的選擇傾向。_

- 例：Dark mode 禁止陰影，elevation 一律用 surface tonal layer
- 例：Light mode 陰影限縮 `0 1px 3px rgba(0,0,0,0.08)`，禁止彩色陰影

## Shapes

_可選。圓角語言。_

- 例：CTA 一律 `rounded.full`，卡片 `rounded.lg`(20px)
- 例：禁止在同一視覺區塊混用 `rounded.full` 與 `rounded.sm`

## Components

_可選。如果你有跨專案的元件鐵則，寫成 component tokens（會被 session DESIGN.md 繼承）。_

```yaml
# 範例（取消註解）
# button-primary:
#   typography: "{typography.label-md}"
#   rounded: "{rounded.full}"
#   height: 52px
```

## Do's and Don'ts

**這段是必填核心。** 寫具體、寫處方式、能直接當 lint rule。

### Do

- _Do 真實內容：所有金額、名字、數字必須是真資料。`$0.00` / "User Name" 出現在 hi-fi = 失敗_
- _Do 至少一個 data viz：只要 app 有數字，就要有 chart / sparkline / progress / ring_
- _Do 字級 ≥3 階：display / headline / body / label，至少 3 個層級的對比_
- _Do brand accent 出現 ≥3 處：CTA + header + icon + active state，主色不能只用一次_
- _（你自己加）_

### Don't

- _Don't 灰色 placeholder：任何畫面有 `#E5E5E5` / `#D1D1D1` 空方塊 = 失敗。用真內容或不放_
- _Don't emoji 當 icon：🦷 📅 ✅ 在 UI 裡 = 即時 reject。用 Iconify SVG_
- _Don't 全字一個級別：所有 17pt 沒階層 = wireframe_
- _Don't web pattern in app：hero section、80–120px section gap、50/50 split 在 phone frame 裡 = wrong surface_
- _（你自己加）_

### 產業特定

#### Finance / Accounting
- Balance 必須是畫面最大元素（≥48pt）
- 正負金額必須顏色編碼（綠 +/紅 -）
- 數字欄位必須 tabular figures (`fontFeature: "tnum" 1`)
- _（你自己加）_

#### E-commerce
- 商品照必須 full-bleed 或大卡片，不是縮圖
- 價格階層至少 2 層字級（原價 / 特價）
- _（你自己加）_

#### Wellness / Productivity
- _（你自己加）_

#### Social / Content
- _（你自己加）_

---

## 我討厭的東西（free-form 補充，不限格式）

_隨手記下。看到什麼設計讓你皺眉就寫進來。Gate 3 載入時會掃過。_

- _例：Bootstrap 式白底黑字表格_
- _例：所有 card 都加陰影的 elevation overload_
- _例：把 emoji 當 icon 還排在按鈕裡_
- _（你自己加）_
