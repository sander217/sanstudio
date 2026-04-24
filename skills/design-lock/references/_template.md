---
source: Mobbin | Dribbble | App Store | 自拍
app: （app 名稱）
screen: （畫面名，e.g. Home / Send / Transaction Detail）
industry: finance | accounting | ecommerce | social | wellness | productivity | content
style_tags: [dark, neon, bold, minimal, pastel, playful, illustrated, data-dense]
components: [transaction-row, big-balance-card, category-pill-colored]
# Partial DESIGN.md tokens extracted from this screenshot — Gate 3 may merge these
# into the session DESIGN.md as starting points. Hex values must be exact.
# Format follows skills/design-lock/design-md-spec.md
extracted_tokens:
  colors:
    # primary: "#hex"
    # surface: "#hex"
    # on-surface: "#hex"
  typography:
    # display-lg:
    #   fontFamily: Inter
    #   fontSize: 48px
    #   fontWeight: 700
    #   lineHeight: 1.1
  rounded:
    # md: 14px
    # full: 9999px
  components:
    # balance-card:
    #   backgroundColor: "#hex"
    #   textColor: "#hex"
    #   rounded: 20px
    #   padding: 24px
---

## 為什麼這是 hi-fi（描述式——寫客觀觀察）

- 主色塊：（hex + 用在哪裡）
- 資料視覺化：（有沒有 chart / sparkline / progress）
- 類別 / 標籤：（顏色編碼、icon 用什麼、底色）
- Avatar / 圖像：（真人照 / 品牌 logo / 首字母底色）
- 字級對比：（最大 / 最小，幾層階層）
- 裝飾：（漸層 / 插畫 / 色塊 / 幾何元素）
- 陰影 / Elevation：（用陰影？tonal layer？邊框？）

## 我的處方（處方式——寫決定規則，最重要的一段）

用第一人稱寫。告訴模型什麼時候該抄、什麼時候絕對不要。

- 這招用在 __ 場景
- 為什麼這樣做：__
- 什麼情況絕對不要這樣：__
- 我要求：__

## 如果這張是 wireframe 會長什麼樣

- Balance 會是 "$0.00"
- 交易列會是 "Transaction name"
- 沒有 __
- 沒有 __

## 從 wireframe 到 hi-fi 我加了什麼

- __
- __
- __

## 可直接複用的 component（用 DESIGN.md 命名）

對應到 frontmatter 的 `extracted_tokens.components`：

- `<component-name>` — _一句話描述怎麼用_
- 例：`balance-card` — 主色容器 + display-lg 大字 + lg 圓角，hero of home screen
- 例：`transaction-row` — 固定 64px 高，左 avatar、中 2 行文字、右金額（色編碼）
