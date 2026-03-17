# 🚀 frontend-performance-agent

> **Autonomous AI agent that analyzes and optimizes Next.js performance — for free.**
> Powered by Groq (Llama 3.3 70B) or Anthropic Claude. No manual code review needed.

---

## What It Does

You point it at any Next.js project. It does the rest:

1. **Detects your app** — scans `~/Documents/work/` and auto-finds `next.config.*`
2. **Runs Lighthouse** — gets full Core Web Vitals (LCP, CLS, TBT, FCP, TTI, TTFB)
3. **Analyzes your bundle** — finds heavy deps, tree-shaking opportunities
4. **Scans data fetching** — flags SSR pages that can become ISR or SSG
5. **Applies fixes autonomously** — rewrites code using AST codemods
6. **Re-runs Lighthouse** — shows before/after score comparison

### Real Results (website/apps/front — production build)

| Metric | Before | After |
|--------|--------|-------|
| **Performance Score** | **26/100** | **52/100 (+26 🎉)** |
| LCP | 11.1s | 3.5s |
| TBT | 1312ms | 1236ms |
| CLS | 0.355 | 0.228 |

> **Why production build matters**: `next dev` skips tree-shaking and minification, so Lighthouse scores on dev server look much worse than reality (and don't reflect code changes like moment→dayjs). Always use `--prod` for accurate before/after comparisons.

---

## Quick Start

> **For accurate scores always add `--prod`** — without it Lighthouse runs against
> the unoptimised dev server and scores look 20–30 points lower than production reality.

### Option 1 — Groq (Free, Recommended)

Get a free API key at [console.groq.com](https://console.groq.com) — no credit card needed.

```bash
# Install globally
npm install -g frontend-performance-agent

# Set your free Groq key
echo 'export GROQ_API_KEY=gsk_...' >> ~/.zshrc && source ~/.zshrc

# Run in production mode — it will ask which project to audit
perf-agent-groq --prod
```

Output:
```
📁 Projects found in ~/Documents/work/:

  1. website
  2. Aipack
  3. my-app

Which folder to audit? (number or full path): 1

🔍 Found Next.js app at: ~/Documents/work/website/apps/front

📱 Device? [mobile/desktop]: mobile
🏗️  Server mode? [dev/prod]: prod
🔧 Changes? [preview/apply]: apply

🤖 Groq AI Agent starting...
   Server  : Production (next build + next start)

  → analyzeBundle(...)
  🏗️  Running next build (this may take a few minutes)...
  ✅ Production server ready at http://localhost:3000
  → runLighthouse(...)        ← accurate production score
  → applyCodeTransform(replaceMomentWithDayjs → customers/page.tsx) ✅
  → applyCodeTransform(replaceMomentWithDayjs → blog/[slug]/page.tsx) ✅
  ... applied 27 transforms
  🏗️  Rebuilding to measure real bundle savings...
  → runLighthouse(...)        ← after score

Score: 26 → 52 (+26) 🎉
```

### Option 2 — Anthropic Claude (Requires API credits)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
perf-agent --project ./my-next-app --prod --verbose
```

### Option 3 — No AI (Pipeline Runner, zero cost)

```bash
npx tsx src/pipeline-runner.ts --project ./my-next-app --prod
```

---

## Setup Guide

### 1 — Prerequisites

| Requirement | Check |
|-------------|-------|
| Node.js 18+ | `node --version` |
| Chrome/Chromium | Required for Lighthouse |
| A Next.js 13+ project | Pages Router or App Router |
| Free Groq API key | [console.groq.com](https://console.groq.com) — no credit card |

### 2 — Install

```bash
# Global install (recommended)
npm install -g frontend-performance-agent

# Or run directly from source
git clone https://github.com/your-org/frontend-performance-agent
cd frontend-performance-agent
npm install
```

### 3 — Set your API key

```bash
# Add to shell profile so it persists
echo 'export GROQ_API_KEY=gsk_...' >> ~/.zshrc && source ~/.zshrc

# Verify it's set
echo $GROQ_API_KEY
```

### 4 — Run

```bash
# Interactive mode — picks up your project automatically
perf-agent-groq --prod

# It will ask three questions:
#   Which project to audit?     → pick number or enter path
#   Device?                     → mobile / desktop
#   Server mode?                → prod (recommended for real scores)
#   Apply changes?              → preview / apply
```

### 5 — What to expect

```
╔══════════════════════════════════════════════════════════════╗
║  📊  Performance Report                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Mode    : Production  (next build + next start)             ║
║  Device  : mobile  |  Throttling: simulated3G                ║
║  Changes : Applied to disk                                   ║
╠══════════════════════════════════════════════════════════════╣
║  Score   : 26  →  52  (+26)  🎉                              ║
╠══════════════════════════════════════════════════════════════╣
║  Metric          Before      After       Δ                   ║
║  ──────────────────────────────────────────────────          ║
║  LCP             11.10s      3.50s       -7.60s ✅           ║
║  CLS             0.355       0.228       -0.127 ✅           ║
║  TBT             1312ms      1236ms      -76ms  ✅           ║
║  TTFB            290ms       195ms       -95ms  ✅           ║
╠══════════════════════════════════════════════════════════════╣
║  Transforms applied: 27   skipped: 0   iterations: 12        ║
║  ──────────────────────────────────────────────────          ║
║  ✅ replaceMomentWithDayjs → customers/page.tsx              ║
║  ✅ replaceMomentWithDayjs → blog/[slug]/page.tsx            ║
║  ... 25 more                                                 ║
╚══════════════════════════════════════════════════════════════╝
```

> **Build time**: `next build` takes 2–5 minutes depending on your project size.
> The agent waits automatically — no extra steps needed.

### Troubleshooting

| Problem | Fix |
|---------|-----|
| `GROQ_API_KEY is not set` | Run `export GROQ_API_KEY=gsk_...` or add to `~/.zshrc` |
| Rate limit warning | Agent auto-falls back to a different free Groq model |
| Build fails | Check `next build` works standalone: `cd your-app && npm run build` |
| Chrome not found | Install Chrome: `brew install --cask google-chrome` (macOS) |
| Port 3000 in use | Stop other servers or pass `--url http://localhost:PORT` |

---

## Installation

```bash
# From npm
npm install -g frontend-performance-agent

# Or clone and link locally
git clone https://github.com/your-org/frontend-performance-agent
cd frontend-performance-agent
npm install && npm link
```

---

## CLI Reference

### `perf-agent-groq` — AI agent powered by Groq (free)

```bash
perf-agent-groq [options]

Options:
  --project, -p  <path>    Next.js root (interactive prompt if omitted)
  --url,     -u  <url>     Lighthouse URL (auto-starts server if omitted)
  --dry-run                Preview changes, don't write files
  --prod                   Build for production before auditing (accurate scores)
  --device       mobile|desktop            (default: mobile)
  --throttling   simulated3G|simulated4G|none  (default: simulated3G)
  --model        <model>   Groq model      (default: llama-3.3-70b-versatile)

Server modes:
  (default)  next dev   — fast startup, lower scores (dev bundles are unoptimised)
  --prod     next build + next start — accurate production Lighthouse scores

Environment:
  GROQ_API_KEY   Free key from https://console.groq.com

Free models available:
  llama-3.3-70b-versatile        ← recommended
  meta-llama/llama-4-scout-17b-16e-instruct
  llama-3.1-8b-instant
```

### `perf-agent` — AI agent powered by Anthropic Claude

```bash
perf-agent [options]

Options:
  --project, -p  <path>    Next.js root         (required)
  --url,     -u  <url>     Lighthouse URL
  --dry-run                Preview only
  --device       mobile|desktop
  --throttling   simulated3G|simulated4G|none
  --model        <model>   Claude model  (default: claude-opus-4-6)
  --verbose, -v            Show agent reasoning

Environment:
  ANTHROPIC_API_KEY   From https://console.anthropic.com
```

---

## What Gets Optimized

| Transform | Impact | Description |
|-----------|--------|-------------|
| `replaceMomentWithDayjs` | **~298kb** | Swaps moment.js → Day.js |
| `optimizeLodashImports` | **up to 80%** | Converts default imports to per-function |
| `convertImgToNextImage` | **High** | Replaces `<img>` with Next.js `<Image>` |
| `convertSSRToISR` | **Medium** | Adds `revalidate` to SSR pages |
| `convertSSRToSSG` | **Medium** | Converts fully static SSR to `getStaticProps` |
| `addDynamicImports` | **Medium** | Code-splits heavy components |
| `addImageOptimization` | **Low** | Adds `priority` prop to above-fold images |

---

## Architecture

```
frontend-performance-agent/
├── src/
│   ├── agent-groq.ts        # 🤖 AI agent (Groq / Llama 3.3 70B)
│   ├── agent.ts             # 🤖 AI agent (Anthropic Claude)
│   ├── agent-runner.ts      # CLI entry point (Anthropic)
│   ├── pipeline-runner.ts   # Deterministic pipeline (no AI needed)
│   ├── server.ts            # MCP server (Claude Desktop integration)
│   └── tools/
│       ├── bundleAnalyzer.ts      # Webpack/Next.js bundle analysis
│       ├── lighthouseRunner.ts    # Lighthouse + dev server management
│       ├── dataFetchingScanner.ts # SSR/ISR/SSG pattern detection
│       └── codeTransformer.ts     # AST codemods via jscodeshift
├── bin/
│   ├── perf-agent-groq      # Groq CLI wrapper
│   └── perf-audit           # Pipeline CLI wrapper
└── skills/
    └── perf-audit.md        # Claude Desktop skill definition
```

### How the AI Agent Works

The agent uses a **tool-calling loop** (agentic loop):

```
User prompt → LLM decides which tool to call
           → Tool executes (Lighthouse, bundle scan, codemod)
           → Result fed back to LLM
           → LLM decides next tool
           → ... repeat until done
           → LLM writes final report
```

The LLM (Llama 3.3 70B or Claude) makes all decisions:
- Which files need fixing
- Which transforms to apply
- Whether improvements are good enough to stop

This is different from a fixed script — the AI adapts to what it finds.

---

## MCP Server (Claude Desktop Integration)

The agent also runs as an MCP server, exposing tools directly inside Claude Desktop:

```json
// ~/.claude/claude_desktop_config.json
{
  "mcpServers": {
    "frontend-performance-agent": {
      "command": "node",
      "args": ["/path/to/frontend-performance-agent/dist/server.js"]
    }
  }
}
```

Then in Claude Desktop, just say:
> *"Audit the performance of my website app"*

Claude will autonomously call all the tools and report back.

---

## Tech Stack

- **Runtime**: Node.js 18+ / TypeScript
- **AI**: Groq API (Llama 3.3 70B) or Anthropic Claude API
- **Performance**: Google Lighthouse 11
- **Code transforms**: jscodeshift (AST codemods)
- **Bundle analysis**: Next.js build output + @next/bundle-analyzer
- **Protocol**: Model Context Protocol (MCP) for Claude Desktop

---

## Requirements

- Node.js 18+
- Next.js 13+ project (Pages Router or App Router)
- Chrome/Chromium (for Lighthouse)
- `GROQ_API_KEY` (free) **or** `ANTHROPIC_API_KEY`

---

## License

MIT — built for the Anthropic hackathon 2025.
