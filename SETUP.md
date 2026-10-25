# sanstudio v3 使用教學

一句需求進去，出來的是研究報告、視覺契約、三個方向、hi-fi mockup，major lane 再加一份工程師能開工的設計包。每一關都停下來等你說話。這份教學從安裝講到日常使用，最後一段給維護者。

整個安裝不到 5 分鐘，不需要 Node，不需要 bridge。

---

## 一、安裝

### 1. 放進 skills 目錄

把 `skills/` 底下六個資料夾複製到你的 agent 的 `skills/` 目錄。Claude Code 是專案的 `.claude/skills/` 或全域的 `~/.claude/skills/`。

```bash
git clone https://github.com/sander217/sanstudio.git ~/sanstudio
mkdir -p ~/.claude/skills
cp -R ~/sanstudio/skills/* ~/.claude/skills/
```

裝完應該長這樣：

```text
~/.claude/skills/
├── design-chain/
├── research-synthesis/
├── context-lock/
├── direction-lock/
├── design-lock/
└── production-lock/
```

上層資料夾一定要叫 `skills`，因為各關之間用 `skills/<name>/...` 互相引用。每個資料夾裡的 `references/` 和 `assets/` 要保持完整，只複製 SKILL.md 會跑不起來。

從 Agensi 買的 bundle 解開後是 `sanstudio/skills/<六個資料夾>`，把 `skills/` 整個放到 `.claude/` 底下就好。

### 2. 放一份 TASTE.md

在你要做設計的專案根目錄：

```bash
cp ~/.claude/skills/design-chain/assets/TASTE.template.md ./TASTE.md
```

打開 `TASTE.md`，填你的品牌：surface 顏色、主色、字體、三到五條 Do 和 Don't、你討厭的東西。不填也能跑，鏈路會用模板預設值，並提醒你一次。

這份是你的。session 的 `DESIGN.md` 可以覆蓋它的 token，但 `craft-rules.md` 的工藝規則蓋過兩者。

### 3. 確認載入

開 Claude Code，打一句：

```text
幫我設計一個記帳 app 的交易列表
```

看到這段就是裝好了：

```text
DESIGN CHAIN READY
  taste: TASTE.md (user)
  output: ./sanstudio-output/sessions/20261024-1402-transaction-list/
  lane: standard (new screen, approach open)
```

---

## 二、怎麼下需求

像跟設計師 brief 一樣寫，有什麼就附什麼：截圖、ticket、競品網址、一段背景、用戶抱怨的原文。證據越多，G0 研究越實，後面三關越不會瞎猜。

```text
lane: standard
記帳 app 的交易列表太雜，用戶說找不到上週的咖啡。截圖附上。
tab bar 不要動，iOS 優先。
```

### 開頭控制字

寫在需求最前面，一行一個，都是選配。

| 控制字 | 作用 |
|---|---|
| `lane: fast` / `standard` / `major` | 指定深度，不寫就讓鏈路判斷 |
| `research: provided` | 你已經做過研究，把發現貼上，G0 改跑 Evaluate 不從零開始 |
| `taste: none` | 這次不載入 TASTE.md，工藝規則照常 |
| `output: <路徑>` | 這個 session 的輸出根目錄 |

沒有 `research: skip`。研究是每條 lane 的第一關。

### 三條 lane

| lane | 什麼時候 | 跑哪幾關 |
|---|---|---|
| fast | 改一個既有畫面的局部，或對上次的 mockup 說 ITERATE | G0 輕量、G1、G3 單一方向 |
| standard | 新畫面、新流程、做法還開放的 redesign | G0、G1、G2、G3 |
| major | 新產品、多畫面系統、工程師要照著做的 | G0、G1、G2、G3、G4 |

鏈路只會往上升，不會偷偷降級。G0 或 G1 發現範圍比你說的大，它會印一行 `LANE UPGRADE fast -> standard` 加原因，然後繼續。

---

## 三、每一關會發生什麼

### G0 研究

`research-synthesis` 先判斷模式：你丟的是一堆原始材料就 Synthesize，問題還開放就 Explore，你已經有解法就 Evaluate。它把「太雜」拆成事實、詮釋、假設，去找證據，老實列出不知道的。結尾是 `---RESEARCH-LOCK---`，裡面有編號的發現 C1、C2 和 gaps。完整報告寫在 `research/report.md`。

### G1 視覺契約

`context-lock` 讀 research lock，推論做給誰、哪種 surface、從截圖抽 hex 和字體，最多問你兩個問題。key insight 必須引用一條 C 編號的發現。產出 session `DESIGN.md` 和 `---CONTEXT-LOCK---`。

### G2 三個方向

`direction-lock` 看兩三個競品，給三個方向的 wireframe。三個必須在資訊架構、互動或構圖上不同，只換顏色不算。每個方向寫它回答哪條發現、解什麼、代價是什麼，最後推薦一個。

### G3 hi-fi

`design-lock` 載入 `DESIGN.md`、`craft-rules.md`、你的 `TASTE.md`、reference library，做出 hi-fi HTML：手機框、真金額、真商家名、SVG icon、真圖。生完先跑 Hi-Fi Fill Checklist 和 lint：對比度、灰色 placeholder、chip 有沒有圓點、card 有沒有框線。不過就自己修再出。有 Figma MCP 就推進 Figma。

### G4 設計包，只在 major

`production-lock` 補完整的 state matrix、響應式矩陣、component spec、文案定稿、無障礙規格、dev handoff，最後一份誠實的 readiness scorecard。它不會說「可以直接上線」。

---

## 四、每一關怎麼回話

每關結束鏈路會印：

```text
G2 done. Reply APPROVE, ITERATE <note>, BACK G<n>, or STOP.
```

只接受這四種，中英文都行：

| 回話 | 中文 | 作用 |
|---|---|---|
| `APPROVE` | 確認 | 鎖定這關，進下一關 |
| `ITERATE 金額再大一點` | 改 金額再大一點 | 帶著備註重做這關，會給 before/after |
| `BACK G1` | 回到 G1 | 回到更早的關，後面的產出標成 stale |
| `STOP` | 停 | 存 PARTIAL block，總結現況，結束 |

沉默、問問題、只說「不錯」都不會往下走。問問題它會答完再印一次提示行。想選方向直接說「B，但分組用 A 的」，它會當 APPROVE 加備註處理。

每個決定都會記一行到 `docs/decisions.md`，含你的原話。下次 session 或同事看這份就知道為什麼設計長這樣。

---

## 五、你會拿到什麼

全部在 `./sanstudio-output/sessions/<時間>-<slug>/`，`./sanstudio-output/latest` 永遠指向最新一次。設 `SANSTUDIO_OUTPUT` 環境變數可以改根目錄。

| 產出 | 路徑 | 用途 |
|---|---|---|
| 研究報告 | `research/report.md` | 為什麼要做，證據和缺口 |
| 視覺契約 | `DESIGN.md` | 下次 session 直接帶入 |
| 方向 wireframe | `html/directions/` | 給團隊看為什麼選這個 |
| hi-fi mockup | `html/` | 瀏覽器打開看，給工程師對照 |
| Figma 匯出 | `figma/design-export.json` | 有 MCP 時已直接推進 Figma |
| 決策紀錄 | `docs/decisions.md` | 每關的 APPROVE、ITERATE、BACK |
| 設計包 | `docs/` | major lane 才有 |

mockup 是提案預覽，不是產品程式碼。鏈路永遠不寫你的產品 repo。

---

## 六、鐵律和你的品味

兩層規則疊在每個 session 上：

- `skills/design-lock/references/craft-rules.md`：跨品牌的工藝規則，每條有編號，例如 `UI-PILL-001` chip 任何狀態不放圓點、`UI-STROKE-001` card 和 chip 不用框線當邊界、`CR-COLOR-001` 每屏至多三色、`CR-CONTENT-001` 只用真內容。所有品牌都適用。要例外必須你開口說，鏈路會把規則編號記進 `docs/decisions.md`。
- `TASTE.md`：你的品牌。可以比鐵律更嚴，不能更鬆。

想加自己的規則，寫進 `TASTE.md` 的 `## Do's and Don'ts`，一行一條，寫得像 lint rule：「Don't 用陰影分隔 card，用底色差」比「我喜歡乾淨」有用。

---

## 七、工具

鏈路自己不帶腳本、不連網。它用你的 agent 本來就有的工具：web search、image search、瀏覽器、Mobbin 之類的 pattern library、Figma MCP。缺哪個就在產出裡記一行 evidence gap，繼續跑，不會卡住。

Figma：有連 Figma MCP，G3 直接推。沒有，它把 `figma/design-export.json` 寫進 session 資料夾，格式照 `skills/design-lock/figma-schema-v0.2.md`。

---

## 八、常見問題

**我只想改一個按鈕，也要跑研究？**
要，但 fast lane 的 G0 很輕：兩到五條發現加未知清單，不做 desk research。研究的目的是確認你要改的東西真的是問題所在。

**可以直接叫某一關嗎？**
可以，`/design-lock` 這類指令還在。但直接叫 G1 它會說一句「沒跑研究」再繼續，直接叫 G4 沒有 DESIGN-LOCK 會被擋。日常用 design-chain 就好。

**三個方向都不喜歡？**
`ITERATE` 加你不喜歡的原因，G2 會重出。退了六次它會建議 `BACK G1`，因為問題可能在契約不在方向。

**上次的 session 要接著改？**
在同一個專案目錄下需求，fast lane 會繼承上次的 `DESIGN.md`。或直接說 `ITERATE` 加要改什麼。

**產出有 em dash 或標題有句號？**
這是 `CR-CONTENT-004` 的失敗，回 `ITERATE 修掉破折號` 即可。

---

## 九、維護者

這段只給維護 repo 的人，買家不需要。

**本機開發**：`~/.claude/skills/` 的 symlink 指到哪個 checkout 就跑哪個版本。改完 `skills/` 直接在新 session 試。

**Sander 的品味**：repo 根目錄的 `TASTE.md` 是維護者自己的，不出貨。買家拿到的是 `skills/design-chain/assets/TASTE.template.md`。

**不出貨的東西**：`design-systems/`（73 份 Apache 2.0 和 MIT 匯入，Agensi 拒收重新包裝的免費內容）、`figma-plugin/`、`apps/`、`scripts/`、reference library 的第三方截圖。截圖的 `.md` 註記是原創，會出貨。

**打包**：

```bash
./scripts/package-agensi.sh
```

產出 `dist/`：一個 bundle 加六個單 skill 的 zip。它會掃本機路徑、localhost、維護者識別字、frontmatter 的 em dash、未解析的跨 skill 引用、腳本、截圖，任一命中就不出包。加 `--check` 只掃不打。

**Figma bridge（選配）**：沒有 Figma MCP 又想自動推進 Figma 時才需要。

```bash
cd figma-plugin && npm install --save-dev @figma/plugin-typings && npx tsc
node figma-plugin/server.js
```

Figma 桌面版：Plugins、Development、Import plugin from manifest，選 `figma-plugin/manifest.json`。Plugin 的 Auto-import tab 按 Start listening，再用 `scripts/export-design-session.sh --push` 推。skill 本身不假設 bridge 在跑。
