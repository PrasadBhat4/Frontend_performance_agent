# perf-audit — Frontend Performance Optimization Skill

## What This Skill Does

Autonomously audits and optimizes any Next.js application for performance.
It runs Lighthouse, analyzes bundles, detects inefficient data-fetching patterns,
applies AST-based code transforms, and produces a before/after score report.

## Trigger Phrases

Use this skill when the user says things like:
- "audit the performance of my app"
- "optimize my Next.js project"
- "run perf-agent on [project]"
- "check the Lighthouse score for [project]"
- "my site is slow, can you fix it"
- "analyze bundle size"
- "convert my SSR pages to ISR"

## How to Invoke

```bash
# AI agent — Groq (free, recommended)
perf-agent-groq --project <path> --prod

# AI agent — Anthropic Claude
perf-agent --project <path> --prod

# No AI (deterministic pipeline, no API key)
npx tsx src/pipeline-runner.ts --project <path> --prod
```

## Key Flags

| Flag | Effect |
|------|--------|
| `--prod` | Runs `next build` + `next start` before auditing. **Always use this for accurate scores.** Without it, Lighthouse runs against the dev server which has unoptimised bundles (~20–30 pts lower). |
| `--dry-run` | Preview all proposed transforms without writing any files. |
| `--device mobile\|desktop` | Switch Lighthouse device emulation (default: mobile). |
| `--url <url>` | Skip auto-starting a server, audit a URL directly (e.g. a staging URL). |

## What Gets Optimized

| Transform | Bundle Savings | Description |
|-----------|---------------|-------------|
| `replaceMomentWithDayjs` | ~298 KB | Replaces moment.js with Day.js |
| `optimizeLodashImports` | up to 80% | Converts lodash default imports to per-function |
| `convertImgToNextImage` | High (LCP) | Replaces `<img>` tags with Next.js `<Image>` |
| `convertSSRToISR` | Medium (TTFB) | Adds `revalidate` to SSR pages |
| `convertSSRToSSG` | Medium | Converts fully static SSR to `getStaticProps` |
| `addDynamicImports` | Medium | Code-splits heavy components |
| `addImageOptimization` | Low (LCP) | Adds `priority` prop to above-fold images |

## Prod Build Mode (Important)

`next dev` does **not** tree-shake or minify — so Lighthouse scores look 20–30 points lower
than what real users experience. Always prefer `--prod` for:

- Final before/after score comparisons
- Reporting to stakeholders
- Verifying that bundle-size transforms (moment→dayjs, lodash) actually reduced the bundle

The agent handles the full build automatically:
1. Runs `npm run build` (streams output)
2. Starts `npm run start` (background)
3. Waits for server to be accessible
4. Runs Lighthouse against the production bundle

## Real Results

Tested on `website/apps/front` (Next.js App Router, ~40 pages).
The agent prints a formatted report at the end of every run:

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
║  FCP             5.45s       4.10s       -1.35s ✅           ║
║  TTFB            290ms       195ms       -95ms  ✅           ║
╠══════════════════════════════════════════════════════════════╣
║  Transforms applied: 27   skipped: 0   iterations: 12        ║
║  ──────────────────────────────────────────────────          ║
║  ✅ replaceMomentWithDayjs → customers/page.tsx              ║
║  ✅ replaceMomentWithDayjs → blog/[slug]/page.tsx            ║
╚══════════════════════════════════════════════════════════════╝
```

## Environment

```bash
# Required for AI agent (Groq — free)
export GROQ_API_KEY=gsk_...   # https://console.groq.com

# Optional — Anthropic Claude instead
export ANTHROPIC_API_KEY=sk-ant-...
```

## MCP Server (Claude Desktop)

Add to `~/.claude/claude_desktop_config.json`:

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

Then in Claude Desktop:
> *"Audit the performance of my website app in production mode"*

Claude will run the full pipeline autonomously.
