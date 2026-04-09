# Design Agent Studio — 安裝教學

給團隊成員的 step-by-step 安裝指南。完成後你就可以在 Claude Code 裡用 AI 做設計思維 → 方向探索 → 高保真設計 → 自動匯出到 Figma。

整個安裝大約需要 **10-15 分鐘**。

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

# 下載
git clone https://github.com/YOUR_ORG/design-agent-studio.git .claude/skills/design-agent-studio
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

# 安裝 Figma 型別定義
npm install --save-dev @figma/plugin-typings

# 編譯 TypeScript → JavaScript
npx tsc
```

> 如果看到 TypeScript 錯誤，確認 `tsconfig.json` 裡 `strict` 是 `false`。你上傳的修正版已經處理了這個問題。

### 步驟 2：在 Figma 載入 Plugin

1. 打開 **Figma 桌面版**
2. 點選左上角 **Figma logo** → **Plugins** → **Development** → **Import plugin from manifest...**
3. 選擇這個檔案：`.claude/skills/design-agent-studio/figma-plugin/manifest.json`
4. Plugin 會出現在 **Plugins → Development → Design Agent Studio**

### 步驟 3：測試 Plugin

1. 在 Figma 開一個新檔案
2. 右鍵 → **Plugins** → **Development** → **Design Agent Studio**
3. Plugin 面板會打開，你看到三個 tab：**Paste JSON** / **Upload file** / **Auto-import**
4. 打開 `figma-plugin/test-sample.json`，複製裡面的 JSON
5. 貼到 Plugin 的 **Paste JSON** tab
6. 看到 preview 顯示 "2 screens, 15+ nodes" → 點 **Import to Figma**
7. Canvas 上出現兩個 frame：**Welcome / default** 和 **Welcome / empty**

如果看到兩個設計 frame — Plugin 安裝成功。

---

## 階段三：設定自動匯出（2 分鐘）

這一步讓你在 Claude Code 裡說 "export" 就自動把設計送到 Figma，不用手動 copy-paste。

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

> 這個 Terminal 需要一直開著。bridge server 是 Claude Code 和 Figma Plugin 之間的橋樑。
> Claude 產生的 HTML / JSON / handoff docs 會寫到 `/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output`，不會塞進 repo 根目錄。

### 步驟 2：Figma Plugin 開始監聽

1. 在 Figma 打開 Plugin（右鍵 → Plugins → Development → Design Agent Studio）
2. 切到 **Auto-import** tab
3. 點 **Start listening**
4. 狀態燈從灰色變黃色（"Connected — waiting for export..."）

### 步驟 3：測試自動匯出

回到你跑 Claude Code 的 Terminal（不是 bridge server 那個），測試一下：

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

## 日常使用

安裝完之後，每次工作的流程：

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

系統會自動判斷你的需求類型，走對應的流程：

| 你說的 | 系統做的 |
|--------|---------|
| "我需要設計..." | 三關全走：理解需求 → 探索方向 → 生成設計 |
| "哪個版本好？" | 評估分析，你決定要不要繼續做設計 |
| "這個設計有什麼問題？" | 問題診斷，你決定要不要讓 AI 改 |
| "改一下這個按鈕" | 跳過方向探索，直接改 |

### 匯出到 Figma

當你對設計滿意，說 "export"。Claude Code 會自動把 JSON 送到 bridge server，Figma Plugin 自動接收並畫出設計。

HTML mockup 會留在外部 output session 裡，Figma 只讀 `figma/design-export.json`。

---

## 目錄結構

安裝完之後你的專案裡多了這些：

```
your-project/
├── CLAUDE.md                                    ← 你的專案設定（被追加了 routing 規則）
└── .claude/skills/design-agent-studio/
    ├── CLAUDE.md                                ← skill routing 設定
    ├── README.md                                ← 專案說明
    ├── context-lock-SKILL-v2.md                 ← Gate 1：理解需求 + 鎖定 visual contract
    ├── direction-lock-SKILL-v2.md               ← Gate 2：探索方向 + 驗證可行性
    ├── design-lock-SKILL-v2.md                  ← Gate 3：生成設計 + 匯出
    ├── scripts/
    │   └── export-design-session.sh             ← 匯出 session / JSON / companion docs
    ├── skills/
    │   └── design-lock/
    │       ├── design-techniques-db.md          ← Gate 3 技法資料庫
    │       └── figma-schema-v0.2.md             ← Figma JSON schema
    └── figma-plugin/
        ├── manifest.json                        ← Figma Plugin 設定
        ├── code.ts                              ← Plugin 原始碼
        ├── code.js                              ← 編譯後的 Plugin
        ├── ui.html                              ← Plugin 介面
        ├── tsconfig.json                        ← TypeScript 設定
        ├── test-sample.json                     ← 測試用 JSON
        └── server.js                            ← Bridge Server
```

外部輸出目錄：

```text
/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/
├── latest -> sessions/<timestamp>-<slug>
└── sessions/
    └── <timestamp>-<slug>/
        ├── session.json
        ├── html/
        ├── figma/
        └── docs/
```

---

## 常見問題

### Claude Code 沒有進入結構化流程，直接回答我

檢查 `CLAUDE.md`（專案根目錄那個）有沒有 "Design Agent Studio" 的 section。如果沒有，重新跑：

```bash
cat .claude/skills/design-agent-studio/CLAUDE.md >> CLAUDE.md
```

### Plugin 在 Figma 裡找不到

確認你用的是 **Figma 桌面版**，不是瀏覽器版。瀏覽器版的 Figma 不支援載入本地 Plugin。

### Plugin 匯入後 Figma 裡什麼都沒有

可能的原因：
1. **JSON 格式錯誤** — Plugin UI 會顯示紅色錯誤訊息，看是什麼問題
2. **字型沒裝** — Plugin 預設用 Inter。如果你的電腦沒有 Inter，去 https://rsms.me/inter/ 下載安裝
3. **frame 在畫布外面** — 試試 `Cmd+Shift+1`（Zoom to fit）看看 frame 是不是跑到很遠的地方

### Bridge Server 連不上

```bash
# 檢查 server 是否在跑
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
3. 重新載入 Plugin（Figma → Plugins → Development → 重新選 manifest）

### TypeScript 編譯失敗

確認 `tsconfig.json` 是這樣的：

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

然後重新跑 `npx tsc`。

### 我用的是 Claude.ai 不是 Claude Code

目前 Design Agent Studio 主要支援 Claude Code。如果你用 Claude.ai，可以把 skill file 的內容貼到 Claude.ai Project 的 Instructions 裡，但自動匯出到 Figma 的功能不可用 — 需要手動 copy-paste JSON 到 Plugin。

---

## 更新

當 repo 有新版本時：

```bash
cd .claude/skills/design-agent-studio
git pull
cd figma-plugin
npx tsc
```

然後在 Figma 重新載入 Plugin（不需要重新 import manifest，重新跑 Plugin 就好）。
