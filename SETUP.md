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

### 2. 放一份 PRODUCT.md（建議）

```bash
mkdir -p .sanstudio
cp ~/.claude/skills/design-chain/assets/PRODUCT.template.md ./.sanstudio/PRODUCT.md
```

只寫確定的產品事實：使用者、產品目的、定位、使用情境、手上有哪些真資料。不寫顏色字體。有了它，每次 session 不會再問一次「這是給誰用的」，也不會捏造你說過不存在的東西。沒寫的話，G1 確認完會問你一次要不要幫你存。

### 3. 放一份 TASTE.md

在你要做設計的專案根目錄：

```bash
cp ~/.claude/skills/design-chain/assets/TASTE.template.md ./TASTE.md
```

打開 `TASTE.md`，填你的品牌：surface 顏色、主色、字體、三到五條 Do 和 Don't、你討厭的東西。不填也能跑，鏈路會用模板預設值，並提醒你一次。

這份是你的。session 的 `DESIGN.md` 可以覆蓋它的 token，但 `craft-rules.md` 的工藝規則蓋過兩者。

### 4. 確認載入

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

### G1 也會決定兩件事

- **Visitor mode**：這個畫面的人要完成什麼。Persuade（被說服然後行動，landing、pricing）、Operate（完成工作，app、dashboard、設定）、Read（讀懂，文件、報告）、Experience（沉浸在作品裡，作品集、展示）。模式決定字體怎麼選、顏色敢不敢放、第一屏要做什麼。Operate 畫面用 Inter 這類工作字體是對的答案，Persuade 才需要有個性的字。
- **Invention scope**：能發明多少。`extend` 在既有畫面裡加東西，不跑方向；`surface` 在既有品牌裡做新頁面，只變結構；`world` 新品牌或改版，世界觀和結構都能變。原則是「精修保留，改版替換」，不會半套地把要換掉的舊樣子再打磨一次。

### G2 怎麼避免千篇一律

先寫出「這個類別永遠會做的那一頁」和「它反射性的反面」，兩個都不能當方向。再從使用者熟悉的世界列五到七個候選（他們每天看的出版物、器具、場所、介面），按共鳴排序，挑三個時從前段、中段、尾段各拿一個，不讓最直覺的答案佔滿三格。三個方向下面附一行安靜的「類別標準做法」，那是給你的退路，鏈路不會推薦它。選定後寫六段 direction contract（IDEA、LOOK、JOURNEY、FIRST SCREEN、SIGNATURE MOVE、DONE WHEN），G3 照它做、review 照它驗。

### G3 hi-fi

`design-lock` 載入 `DESIGN.md`、`craft-rules.md`、你的 `TASTE.md`、reference library，做出 hi-fi HTML：手機框、真金額、真商家名、SVG icon、真圖。生完先跑 Anti-Slop Pass、Hi-Fi Fill Checklist 和 lint：對比度、灰色 placeholder、chip 有沒有圓點、card 有沒有框線。然後是 **fresh-eyes review**：用瀏覽器在實際尺寸截圖，交給一個沒參與製作的 subagent 審，給出具體性判斷、Nielsen 十項分數、兩三個人物走查、P0 到 P3 問題和 ship / fix / rebuild / recapture 的結論。P0、P1 會在你看到之前先修掉，剩下的寫進 `docs/review.md`。agent 沒有 subagent 時會標明 DEGRADED，不會假裝獨立。有 Figma MCP 就推進 Figma。

### G4 設計包，只在 major

`production-lock` 補完整的 state matrix、響應式矩陣、component spec、文案定稿、無障礙規格、dev handoff，最後一份誠實的 readiness scorecard。它不會說「可以直接上線」。

---

## 四、每一關怎麼回話

每關結束鏈路會印：

```text
G2 done. Reply APPROVE, ITERATE <note or verb>, BACK G<n>, REVIEW, or STOP.
```

只接受這幾種，中英文都行：

| 回話 | 中文 | 作用 |
|---|---|---|
| `APPROVE` | 確認 | 鎖定這關，進下一關 |
| `ITERATE 金額再大一點` | 改 金額再大一點 | 帶著備註重做這關，會給 before/after |
| `BACK G1` | 回到 G1 | 回到更早的關，後面的產出標成 stale |
| `STOP` | 停 | 存 PARTIAL block，總結現況，結束 |
| `REVIEW` | 檢查 | 現在就跑一次 fresh-eyes review，不推進關卡 |

### 精修動詞

`ITERATE` 後面接一個動詞，就跑對應的固定流程，只動你指定的地方，不會順手改別的，也不會自己加新顏色、新字體、新元件（要加會先問你）：

| 動詞 | 中文 | 什麼時候用 |
|---|---|---|
| `polish` | 打磨 | 方向對，完成度不夠。會先讀 `docs/review.md` 的 P0、P1 當待辦 |
| `bolder` | 更大膽 | 某一塊跟其他區比起來太平 |
| `quieter` | 收斂 | 太吵、太花、看了累 |
| `distill` | 精簡 | 畫面上東西太多 |
| `harden` | 補強 | 只有完美資料才好看：長名字、空狀態、錯誤、離線 |
| `clarify` | 文案 | 字看不懂 |
| `typeset` | 字體 | 層級或閱讀舒適度不對 |
| `layout` | 版面 | 分組、節奏、間距不對 |
| `colorize` | 上色 | 顏色沒在做事 |
| `motion` | 動態 | 動畫缺、亂或沒理由 |
| `adapt` | 適配 | 換尺寸、換裝置 |
| `onboard` | 首次體驗 | 第一次用、空狀態、多快拿到價值 |

```text
ITERATE bolder hero
改 精簡 設定頁: 匯出要留著
```

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
| 截圖和審查 | `review/`、`docs/review.md` | 分數、問題清單，`ITERATE polish` 的待辦 |
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

**不知道下一步做什麼？**
直接叫 design-chain 不給需求，它會看 `.sanstudio/`、上一次 session 的 review 和 PARTIAL 狀態，建議兩三個下一步，不會自己開跑。

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

## 九、已經有 design contract 的品牌

已經有 contract pack 的品牌，不用每次從提示詞開始。在產品 repo 根目錄放一個 `.sanstudio/` 資料夾，鏈路開跑就先讀它：

```text
.sanstudio/
  DESIGN.md        品牌視覺契約，直接當 session DESIGN.md 的 base
  taste.yml        Harness 的 taste profile，intent / signatureTraits / avoid 直接讀
  EXPERIENCE.md    產品意圖、IA、journeys，G0 和 G1 的輸入
  qa-policy.yml    blocking gates 併進 G3 的 QA 和 G4 的 scorecard
  memory/          accepted 的決定變成 G1 的 constraints
  contract.yml     選配，記 pack 的 commit 當 provenance
```

從 pack clone 複製進去就好，鏈路不會自己 fetch。完整對應表和 copy 指令在 `skills/design-chain/references/contracts.md`。私有 contract 不進 sanstudio repo，`.sanstudio/` 放產品 repo 並加進它的 `.gitignore`。

契約裡的值是精確的：contract 寫 Inter 就是 Inter，寫哪個 hex 就是哪個 hex。鏈路只在上面加這次需求的 override。契約和工藝鐵律撞到（例如沒有 recipe 的漸層、pill 裡的圓點），G1 會列成 contract gap 讓你決定，不會偷偷照做也不會偷偷改。

---

## 十、維護者

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
