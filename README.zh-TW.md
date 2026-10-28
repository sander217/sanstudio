# sanstudio

給 AI agent 用的設計流程。一句需求進去，出來的是研究報告、鎖定的視覺契約、三個真的不一樣的方向、hi-fi mockup，以及你要的話，一份可以開工的 production 設計包。每一關都停下來等你決定。

在 Claude Code 和任何會載入 `SKILL.md` 資料夾的 agent 都能跑。不帶腳本，自己不連網，用的是你的 agent 本來就有的搜尋、找圖和 Figma 工具。

## 你會拿到什麼

| 關 | skill | 回答的問題 | 產出 |
|---|---|---|---|
| G0 | research-synthesis | 用戶為什麼要這個，證據撐得住什麼，還不知道什麼 | `research/report.md` |
| G1 | context-lock | 做給誰、哪種 surface、哪些顏色和字體 | `DESIGN.md` |
| G2 | direction-lock | 三種解法，每個都對應一條研究發現 | `html/directions/` |
| G3 | design-lock | 選定的解法長什麼樣，真內容，lint 通過 | `html/`、`figma/design-export.json` |
| G4 | production-lock | 工程師開工需要的一切 | `docs/` |

`design-chain` 是入口。它選 lane（fast、standard、major），依序跑關，每關結束停下來等 `APPROVE`、`ITERATE <備註>`、`BACK G<n>` 或 `STOP`。中文也可以：確認、改、回到 G2、停。

## 安裝

把 `skills/` 底下六個資料夾複製到你的 agent 的 `skills/` 目錄（Claude Code 是專案的 `.claude/skills/` 或 `~/.claude/skills/`），或直接裝 Agensi 的 bundle。各關之間用 `skills/<name>/...` 互相引用，所以上層資料夾必須叫 `skills`。每個資料夾的 `references/` 和 `assets/` 要保持完整。

然後在你的專案根目錄（都是選配，都建議）：

```bash
cp <skills>/design-chain/assets/TASTE.template.md ./TASTE.md
```

```bash
mkdir -p .sanstudio && cp <skills>/design-chain/assets/PRODUCT.template.md ./.sanstudio/PRODUCT.md
```

把 `TASTE.md` 改成你的品牌：顏色、字體、Do 和 Don't。這份是你的，每次 session 都會當 defaults 載入。`PRODUCT.md` 放確定的產品事實（使用者、目的、定位、手上的真資料），之後的 session 不會再問一次。

## 使用

像跟設計師 brief 一樣寫需求，有什麼就附什麼：截圖、ticket、競品網址、一段背景。

```text
lane: standard
記帳 app 的交易列表太雜，用戶說找不到上週的咖啡。截圖附上。tab bar 不要動。
```

鏈路先研究，再最多問你兩個問題，然後給你一份 `DESIGN.md`。回 `APPROVE`。它給三個方向。回 `APPROVE` 或「B，但分組用 A 的」。它做出 hi-fi mockup。回 `ITERATE 金額再大一點` 或 `APPROVE`。所有東西都在 `./sanstudio-output/latest/`。

開頭控制字：`lane: fast|standard|major`、`research: provided`、`taste: none`、`output: <路徑>`。

G3 的精修動詞：`ITERATE polish|bolder|quieter|distill|harden|clarify|typeset|layout|colorize|motion|adapt|onboard [目標]`，中文是打磨、更大膽、收斂、精簡、補強、文案、字體、版面、上色、動態、適配、首次體驗。只動指定的地方，要加新顏色、字體、元件會先問。`REVIEW`（檢查）隨時跑一次 fresh-eyes review。

## 怎麼避免每次都做出同一頁

- **Visitor mode**（Persuade、Operate、Read、Experience）決定野心：landing page 要有觀點，dashboard 要精準加一個招牌設計。
- **避開俗套**：G2 先寫出這個類別永遠會做的那頁和它的反射性反面，兩個都不做，再從候選池按分散度挑三個方向。
- **Direction contract**：六段短約定（核心想法、外觀、使用者路徑、第一屏、招牌設計、完成條件），G3 照著做。
- **Fresh-eyes review**：G3 做完在瀏覽器截圖，交給沒參與製作的 context 審：具體性、Nielsen 十項、人物走查、P0 到 P3、ship / fix / rebuild / recapture。

## 哪些是鐵律，哪些是你的

- `skills/design-lock/references/craft-rules.md` 是跨品牌的工藝規則，每條有編號，例如 `UI-PILL-001`（chip 裡不放圓點）、`UI-STROKE-001`（card 不加框線）。每個品牌都適用。要例外必須你開口，並記進 `docs/decisions.md`。
- `TASTE.md` 是你的品牌。session 的 `DESIGN.md` 可以覆蓋它的 token，工藝規則蓋過兩者。

## Figma

有連 Figma MCP 時，Gate 3 直接推。沒有的話，它把 `figma/design-export.json` 寫進 session 資料夾，格式照 `skills/design-lock/figma-schema-v0.2.md`。

## 維護者看的 repo 結構

```text
skills/            產品本體，gate 地圖見 CLAUDE.md
TASTE.md           維護者自己的品味，不出貨
design-systems/    73 份匯入的 DESIGN.md 參考（Apache 2.0 和 MIT），不出貨
figma-plugin/      維護者用的本機 bridge，不出貨
packaging/agensi/  marketplace 用的 pack README、NOTICE 和上架文案草稿
scripts/package-agensi.sh   打 dist/sanstudio-pack-v<版本>.zip 並跑 Agensi 檢查
```

## 授權

商業授權，見 `LICENSE`。`design-systems/` 底下的檔案維持上游授權，見 `design-systems/NOTICE.md`。
