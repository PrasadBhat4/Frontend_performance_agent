# perf-audit

> Autonomous AI skill that audits and optimizes any Next.js application for performance.
> Runs Lighthouse, analyzes bundles, applies AST codemods, and reports before/after Core Web Vitals.

## What It Does

Point it at any Next.js project. It does the rest:

1. **Runs Lighthouse** against the production build — accurate Core Web Vitals (LCP, CLS, TBT, FCP, TTFB)
2. **Analyzes the bundle** — finds moment.js (298 KB), unoptimized lodash imports, unoptimized images
3. **Scans data fetching** — flags `getServerSideProps` pages that can become ISR or SSG
4. **Applies fixes autonomously** — rewrites code with AST codemods via jscodeshift
5. **Rebuilds + re-audits** — shows a before/after score comparison in a formatted table

## Real Results

Tested on a production Next.js App Router app (~40 pages):

| Metric | Before | After |
|--------|--------|-------|
| **Performance Score** | **26/100** | **52/100 (+26)** |
| LCP | 11.1s | 3.5s |
| TBT | 1312ms | 1236ms |
| CLS | 0.355 | 0.228 |
| TTFB | 290ms | 195ms |

27 transforms applied across the codebase in a single run.

## Installation

```bash
# Install globally
npm install -g frontend-performance-agent

# Set your free Groq API key
export GROQ_API_KEY=gsk_...   # https://console.groq.com — no credit card needed
```

## Usage

```bash
# Interactive — auto-discovers Next.js projects in ~/Documents/work/
perf-agent-groq --prod

# Direct path
perf-agent-groq --project ./my-next-app --prod

# Dry run — preview transforms without writing files
perf-agent-groq --project ./my-next-app --prod --dry-run

# Desktop mode
perf-agent-groq --project ./my-next-app --prod --device desktop
```

## Why --prod Matters

`next dev` skips tree-shaking and minification. Lighthouse scores against the dev server
look 20–30 points lower than what real users experience. `--prod` runs `next build + next start`
so every score reflects the actual shipped bundle.

## Transforms Applied

| Transform | Impact | Description |
|-----------|--------|-------------|
| `replaceMomentWithDayjs` | **~298 KB** | Replaces moment.js with Day.js |
| `optimizeLodashImports` | **up to 80%** | Converts default imports to per-function |
| `convertImgToNextImage` | **High LCP** | Replaces `<img>` with Next.js `<Image>` |
| `convertSSRToISR` | **Medium TTFB** | Adds `revalidate` to SSR pages |
| `convertSSRToSSG` | **Medium** | Converts static SSR to `getStaticProps` |
| `addDynamicImports` | **Medium** | Code-splits heavy components |
| `addImageOptimization` | **Low LCP** | Adds `priority` prop to above-fold images |

## Output

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
║  CLS              0.355      0.228       -0.127 ✅           ║
║  TBT             1312ms      1236ms       -76ms ✅           ║
║  FCP              5.45s      4.10s       -1.35s ✅           ║
║  TTFB             290ms       195ms        -95ms ✅          ║
╠══════════════════════════════════════════════════════════════╣
║  Transforms applied: 27   skipped: 0   iterations: 12        ║
╚══════════════════════════════════════════════════════════════╝
```

## Key Flags

| Flag | Effect |
|------|--------|
| `--prod` | Runs `next build + next start` before auditing (accurate scores) |
| `--dry-run` | Preview all proposed transforms without writing any files |
| `--device mobile\|desktop` | Switch Lighthouse device emulation (default: mobile) |
| `--url <url>` | Skip auto-starting a server, audit a live URL directly |

## Requirements

- Node.js 18+
- Next.js 13+ project (Pages Router or App Router)
- Chrome/Chromium (for Lighthouse)
- Free Groq API key from [console.groq.com](https://console.groq.com)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `GROQ_API_KEY is not set` | `export GROQ_API_KEY=gsk_...` or add to `~/.zshrc` |
| Rate limit warning | Agent auto-falls back to a different free Groq model |
| Build fails | Check `npm run build` works standalone in your project |
| Chrome not found | `brew install --cask google-chrome` (macOS) |
| Port 3000 in use | Stop other servers or pass `--url http://localhost:PORT` |

## MCP Server (Claude Desktop)

```json
{
  "mcpServers": {
    "frontend-performance-agent": {
      "command": "node",
      "args": ["/path/to/frontend-performance-agent/dist/server.js"]
    }
  }
}
```

Then in Claude Desktop: *"Audit the performance of my website app"*

## Tech Stack

- **AI**: Groq (Llama 3.3 70B) — free, or Anthropic Claude
- **Performance**: Google Lighthouse 12
- **Codemods**: jscodeshift AST transforms
- **Bundle analysis**: Next.js build output + @next/bundle-analyzer
- **Protocol**: MCP (Model Context Protocol) for Claude Desktop integration
