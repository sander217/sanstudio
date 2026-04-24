# Style Manifesto — Sander 的設計信條

Gate 3 每次生成 mobile app hi-fi 前會載入此檔。這是你的設計魂。
第一人稱、處方式語氣。不是美學描述，是決定規則。

---

## 我對 hi-fi mobile app 的鐵律

_（以下是預設範例，請改成你自己的。每條要具體到能當 CSS / layout 規則用。）_

1. **絕對不用灰色 placeholder**。任何時候畫面有 `#E5E5E5` / `#D1D1D1` 的空方塊 = 失敗。用真內容或不放。
2. **每個 screen 至少一個色塊**。全白全灰的畫面不是 minimal 是沒做完。
3. **Data viz 是必備不是可選**。只要 app 有數字，就要有 chart、sparkline、或 progress。
4. **Typography 至少 3 層階層**。48 / 24 / 16 或類似 3 段差距，不能全部 17pt。
5. **Brand accent 出現 ≥3 處**。主色不只用在 CTA，也要在 header、icon、active state。
6. _（你自己加）_

---

## 我偏好的視覺語言

- 色調：_（dark-neon? soft-pastel? bold-playful?）_
- 字體家族：_（SF Pro only? 搭配 display font？）_
- 圓角：_（14pt? 24pt? 不同階層的 radius？）_
- 陰影：_（平面 flat? 立體 elevated? 有色陰影？）_
- 動畫：_（subtle? playful?）_

---

## 我討厭的東西

- _Bootstrap 式白底黑字表格_
- _灰色漸層當 placeholder_
- _emoji 當 icon_
- _所有字都 17pt 沒階層_
- _（你自己加）_

---

## 產業特定規則

### Finance / Accounting
- Balance 必須是畫面最大元素（≥48pt）
- 正負金額必須顏色編碼（綠 +/紅 -）
- _（你自己加）_

### E-commerce
- 商品照必須 full-bleed 或大卡片，不是縮圖
- 價格階層：原價 / 特價 / 省下多少，三層字級
- _（你自己加）_

### Social / Content
- _（你自己加）_

### Wellness / Productivity
- _（你自己加）_
