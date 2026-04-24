[English](README.md) · **繁體中文**

# Design Agent Studio — 安裝教學

給團隊成員的 step-by-step 安裝指南。完成後你就可以在 Claude Code 裡用 AI 做設計思維 → 方向探索 → 高保真設計 → 自動匯出到 Figma。

整個安裝大約需要 **15-20 分鐘**（含基本訓練）。

---

## 它是什麼

Design Agent Studio 是一套 **3-gate 設計系統**，把模糊的需求變成 Figma-ready 的高保真設計：

```text
你說："我需要設計一個 onboarding flow"
    │
    ▼
Gate 1 (/context-lock)    → 理解需求、抽出視覺契約、產出 DESIGN.md
Gate 2 (/direction-lock)  → 探索 3 個方向、驗證可行性
Gate 3 (/design-lock)     → 生成 hi-fi HTML + Figma JSON → 自動匯入 Figma
```

每次跑完會產出一份 **DESIGN.md**（YAML tokens + Do's/Don'ts），這是貫穿三個 Gate 的視覺語言契約。Gate 3 會用它做 lint（WCAG 對比、token 引用是否存在）。

---

## 前置條件

開始之前，確認你有以下東西：

| 項目 | 怎麼確認 | 沒有的話 |
|------|---------|---------|
| Node.js 18+ | Terminal 打 `node -v` | 去 https://nodejs.org 安裝 LTS 版 |
| Claude Code | Terminal 打 `claude --version` | 去 https://docs.anthropic.com/en/docs/claude-code 安裝 |
| Figma 桌面版 | 打開 Figma app | 去 https://figma.com/downloads 下載 |
| Git | Terminal 打 `git --version` | macOS: `xcode-select --install` / Windows: https://git-scm.com |

---

## 階段一：安裝 Skills（5 分鐘）

Skills 是教 Claude Code 怎麼做設計工作的指令檔案。

### 步驟 1：下載 repo

打開 Terminal，進到你的專案目錄：

```bash
cd ~/your-project

git clone https://github.com/sander217/sanstudio.git .claude/skills/design-agent-studio
```

> 如果你的專案已經有 `.claude/skills/` 目錄，直接 clone 進去就好。如果沒有，這個指令會自動建立。

### 步驟 2：把 routing 加到專案的 CLAUDE.md

Claude Code 需要知道這些 skill 存在。把 routing 設定加到你專案的 `CLAUDE.md`：

```bash
cat .claude/skills/design-agent-studio/CLAUDE.md >> CLAUDE.md
```

> 如果你的專案還沒有 `CLAUDE.md`，這個指令會自動建立一個。

### 步驟 3：驗證

在 Terminal 打開 Claude Code：

```bash
claude
```

然後輸入：

```
我需要設計一個新功能
```

如果安裝成功，Claude Code 會啟動 `/context-lock`（Gate 1），開始問你關於需求的問題。如果它直接回答你而沒有進入結構化流程，檢查 `CLAUDE.md` 有沒有正確寫入。

---

## 階段二：安裝 Figma Plugin（3 分鐘）

Plugin 負責把 AI 生成的設計 JSON 變成 Figma 裡的可編輯元件。

### 步驟 1：編譯 Plugin

```bash
cd .claude/skills/design-agent-studio/figma-plugin

npm install --save-dev @figma/plugin-typings
npx tsc
```

> 如果看到 TypeScript 錯誤，確認 `tsconfig.json` 裡 `strict` 是 `false`。

### 步驟 2：在 Figma 載入 Plugin

1. 打開 **Figma 桌面版**
2. 左上角 **Figma logo** → **Plugins** → **Development** → **Import plugin from manifest...**
3. 選擇：`.claude/skills/design-agent-studio/figma-plugin/manifest.json`
4. Plugin 會出現在 **Plugins → Development → Design Agent Studio**

### 步驟 3：測試 Plugin

1. 在 Figma 開一個新檔案
2. 右鍵 → **Plugins** → **Development** → **Design Agent Studio**
3. Plugin 面板打開，看到三個 tab：**Paste JSON** / **Upload file** / **Auto-import**
4. 打開 `figma-plugin/test-sample.json`，複製 JSON
5. 貼到 **Paste JSON** tab
6. preview 顯示 "2 screens, 15+ nodes" → 點 **Import to Figma**
7. Canvas 上出現兩個 frame：**Welcome / default** 和 **Welcome / empty**

看到兩個設計 frame = Plugin 安裝成功。

---

## 階段三：設定自動匯出（2 分鐘）

讓你在 Claude Code 裡說 "export" 就自動把設計送到 Figma。

### 步驟 1：啟動 Bridge Server

開一個新的 Terminal tab（保持開著）：

```bash
cd .claude/skills/design-agent-studio
node figma-plugin/server.js
```

你會看到：

```
  Design Agent Studio — Bridge Server
  Listening on http://localhost:3333

  POST /push  — send JSON from Claude Code
  GET  /pull  — Figma Plugin fetches pending JSON
  GET  /status — health check
```

> 這個 Terminal 需要一直開著。Claude 產生的 HTML / JSON / DESIGN.md / handoff docs 會寫到 `~/sanstudio-ai-output/`，不會塞進 repo 根目錄。

### 步驟 2：Figma Plugin 開始監聽

1. 在 Figma 打開 Plugin
2. 切到 **Auto-import** tab
3. 點 **Start listening**
4. 狀態燈從灰色變黃色（"Connected — waiting for export..."）

### 步驟 3：測試自動匯出

```bash
curl -s -X POST http://localhost:3333/push \
  -H "Content-Type: application/json" \
  -d @.claude/skills/design-agent-studio/figma-plugin/test-sample.json
```

回應應該是：

```json
{"status":"ok","push_id":1,"screens":2,"nodes":15}
```

然後看 Figma — 設計自動出現了。

---

## 階段四：訓練你的設計 DNA（5 分鐘起，可隨時加碼）

**這一步是把模型從「generic hi-fi」變成「像你會做的東西」的關鍵。** 不做這步系統還是會跑，但出來的東西沒有你的味道。

### 4.1 — 必做：填 style-manifesto.md（10 條鐵則 = 30 分鐘）

打開 `.claude/skills/design-agent-studio/skills/design-lock/references/style-manifesto.md`。

這是一份 **partial DESIGN.md**，每次 Gate 3 hi-fi 都會載入它當 hard constraint。

最低限度填好 `Do's and Don'ts` 一段：

```markdown
### Do
- Do 真實內容：所有金額、名字、數字必須是真資料
- Do 至少一個 data viz：只要 app 有數字，就要有 chart / sparkline / progress
- Do 字級 ≥3 階：display / headline / body / label
- ...

### Don't
- Don't 灰色 placeholder：任何畫面有 #E5E5E5 空方塊 = 失敗
- Don't emoji 當 icon：🦷 在 UI 裡 = 即時 reject，用 Iconify SVG
- Don't web pattern in app：80–120px section gap、50/50 split = wrong surface
- ...
```

10–20 條具體規則就夠。寫處方式（什麼時候做、什麼時候不做），不要寫感想。

### 4.2 — 強烈建議：補 reference library（每張截圖 5–10 分鐘）

`.claude/skills/design-agent-studio/skills/design-lock/references/mobile-app-examples/` 下面有產業 bucket：

```
mobile-app-examples/
├── finance/
├── accounting/
├── ecommerce/
├── social/
├── wellness/
├── productivity/
└── content/
```

對每個你常做的產業，丟 3–5 張 Mobbin / Dribbble 截圖進去，每張複製 `_template.md` 並填好——**重點是「我的處方」段落**：什麼時候該抄、什麼時候絕對不要。

> **20–30 張標註過的截圖，勝過 200 張沒標註的。** 不要囤積。

### 4.3 — 可選：填 extracted_tokens

每個截圖標註裡有 `extracted_tokens` YAML 區塊。把 hex / fontSize / rounded 抄進去，Gate 3 可以直接拿來當起點 token。

---

## 日常使用

### 啟動（每次工作開始）

```bash
# Terminal Tab 1：Bridge Server（保持開著）
cd your-project
node .claude/skills/design-agent-studio/figma-plugin/server.js

# Terminal Tab 2：Claude Code
cd your-project
claude
```

在 Figma 打開 Plugin → Auto-import → Start listening。

### 使用

直接用自然語言跟 Claude Code 說你的設計需求：

```
> 我需要設計一個 onboarding flow，新用戶進來 3 天內流失 55%

> 這兩個版本哪個比較好？（附截圖）

> 這個 checkout 頁面轉換率只有 23%，幫我看看有什麼問題

> 把這個進度指示器改得更有動力感
```

系統會自動判斷你的需求類型：

| 你說的 | 系統做的 |
|--------|---------|
| "我需要設計..." | 三關全走：理解需求 → 探索方向 → 生成設計 |
| "哪個版本好？" | 評估分析，你決定要不要繼續做設計 |
| "這個設計有什麼問題？" | 問題診斷，你決定要不要讓 AI 改 |
| "改一下這個按鈕" | 跳過方向探索，直接改 |

### 匯出到 Figma

當你對設計滿意，說 "export"。Claude Code 會自動把 JSON 送到 bridge server，Figma Plugin 自動接收並畫出設計。

HTML mockup + DESIGN.md 會留在外部 output session 裡，Figma 只讀 `figma/design-export.json`。

---

## DESIGN.md — 跨 Gate 的視覺契約

每次 Gate 1 跑完會產出一份 `DESIGN.md`，路徑：

```text
~/sanstudio-ai-output/sessions/<timestamp>-<slug>/DESIGN.md
```

這份檔案是 **YAML frontmatter（機讀 design tokens）+ markdown body（rationale + Do's/Don'ts）**：

```yaml
---
colors:
  primary: "#0B0F1A"
  on-surface: "#F4F4F5"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
components:
  button-primary:
    backgroundColor: "{colors.primary}"   # token reference
    rounded: "{rounded.full}"
---

## Do's and Don'ts
- Don't 紫色作為 primary
- Do balance ≥48pt
```

**Gate 3 載入 DESIGN.md 後**：
- 解析 token reference（`{colors.primary}` → `#0B0F1A`）
- 跑 lint（WCAG AA 對比 ≥ 4.5:1、broken refs、section order）
- 在生成的 HTML 裡加 token-trace 註解：`<!-- {components.button-primary.backgroundColor} -->`
- BLOCKING 規則沒過 = 不出 export

**為什麼重要**：以前 Gate 1 跟 Gate 3 之間靠 prose 傳遞視覺意圖（容易丟失），現在靠這份 machine-readable + lintable 的契約。

---

## 目錄結構

```
your-project/
├── CLAUDE.md                                    ← 你的專案設定（被追加了 routing 規則）
└── .claude/skills/design-agent-studio/
    ├── CLAUDE.md                                ← skill routing 設定
    ├── README.md
    ├── scripts/
    │   └── export-design-session.sh
    ├── skills/
    │   ├── context-lock/SKILL.md                ← Gate 1
    │   ├── direction-lock/SKILL.md              ← Gate 2
    │   └── design-lock/
    │       ├── SKILL.md                         ← Gate 3
    │       ├── design-md-spec.md                ← DESIGN.md 格式規範
    │       ├── design-techniques-db.md
    │       ├── figma-schema-v0.2.md
    │       ├── svg-patterns.md
    │       ├── mobile-app-patterns.md
    │       └── references/
    │           ├── INDEX.md
    │           ├── _template.md
    │           ├── _DESIGN.example.md
    │           ├── style-manifesto.md           ← 你的個人設計信條（必填）
    │           └── mobile-app-examples/         ← 標註過的截圖（自己補）
    │               ├── finance/
    │               ├── ecommerce/
    │               └── ...
    └── figma-plugin/
        ├── manifest.json
        ├── code.ts / code.js
        ├── ui.html
        ├── tsconfig.json
        ├── test-sample.json
        └── server.js
```

外部輸出目錄（每次 export 自動建立）：

```text
~/sanstudio-ai-output/
├── latest -> sessions/<timestamp>-<slug>
└── sessions/
    └── <timestamp>-<slug>/
        ├── session.json
        ├── DESIGN.md            ← Gate 1 產出，Gate 3 lint
        ├── html/                ← hi-fi mockup（每個 screen 一份）
        ├── figma/
        │   └── design-export.json
        └── docs/                ← handoff docs / decisions
```

---

## 常見問題

### Claude Code 沒有進入結構化流程，直接回答我

檢查 `CLAUDE.md`（專案根目錄那個）有沒有 "Design Agent Studio" 的 section。如果沒有，重新跑：

```bash
cat .claude/skills/design-agent-studio/CLAUDE.md >> CLAUDE.md
```

### Gate 3 出來的設計很 generic、沒有我的味道

去填 `references/style-manifesto.md` 的 Do's/Don'ts，並補 reference library 的標註截圖。**沒做階段四 = Gate 3 只能用模型預設品味做設計。**

### Plugin 在 Figma 裡找不到

確認你用的是 **Figma 桌面版**，不是瀏覽器版。瀏覽器版不支援載入本地 Plugin。

### Plugin 匯入後 Figma 裡什麼都沒有

可能的原因：
1. **JSON 格式錯誤** — Plugin UI 會顯示紅色錯誤訊息
2. **字型沒裝** — Plugin 預設用 Inter。沒有的話去 https://rsms.me/inter/ 下載
3. **frame 在畫布外面** — 試試 `Cmd+Shift+1`（Zoom to fit）

### Bridge Server 連不上

```bash
curl http://localhost:3333/status
```

如果回應 `connection refused`，server 沒在跑。重新啟動：

```bash
node .claude/skills/design-agent-studio/figma-plugin/server.js
```

### Auto-import 燈號一直是紅色

紅色 = Plugin 連不到 bridge server。確認：
1. Bridge server 有在跑（看 Terminal 有沒有 "Listening on http://localhost:3333"）
2. `manifest.json` 裡 `devAllowedDomains` 包含 `"http://localhost:3333"`
3. 重新載入 Plugin

### TypeScript 編譯失敗

確認 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2017"],
    "module": "none",
    "strict": false,
    "skipLibCheck": true,
    "noEmitOnError": false,
    "removeComments": true
  },
  "include": ["./code.ts"]
}
```

### Export 失敗，提示 "DESIGN.md lint failed: broken-ref"

DESIGN.md 裡有 token reference 找不到對應定義（例如 `{colors.brand}` 但 `colors.brand` 沒宣告）。打開 session 的 `DESIGN.md`，補上缺的 token，重跑 export。

### Export 失敗，提示 "contrast-ratio < 4.5:1"

WCAG AA lint 沒過——前景色跟背景色對比不夠。修 DESIGN.md 的 colors，或調整 component 顏色組合。

### 我用的是 Claude.ai 不是 Claude Code

目前 Design Agent Studio 主要支援 Claude Code。Claude.ai 可以把 skill file 內容貼到 Project Instructions 裡，但自動匯出到 Figma 不可用——需要手動 copy-paste JSON 到 Plugin。

---

## 更新

```bash
cd .claude/skills/design-agent-studio
git pull
cd figma-plugin
npx tsc
```

然後在 Figma 重新載入 Plugin（不需要重新 import manifest，重新跑 Plugin 就好）。
