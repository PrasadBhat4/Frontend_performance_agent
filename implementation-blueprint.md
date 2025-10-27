# 💻 Frontend Performance Agent - Implementation Blueprint

## 🏗️ High-Level Architecture

```
 ┌──────────────────────────┐
 │  Developer / CI Trigger  │
 │  (CLI, GitHub Action)    │
 └────────────┬─────────────┘
              │
              ▼
     ┌────────────────┐
     │ Performance Agent │
     └────────────────┘
              │
 ┌───────────────────────────────────────────┐
 │             Submodules                    │
 │                                           │
 │  1️⃣ Analyzer Layer                       │
 │     - Bundle Analyzer                     │
 │     - Lighthouse Runner                   │
 │     - Next.js Data Fetch Scanner          │
 │                                           │
 │  2️⃣ AI Layer (Claude Code Pro)           │
 │     - Tool calling                        │
 │     - RAG retrieval (team rules)          │
 │     - Fix generation + explanation         │
 │                                           │
 │  3️⃣ Code Fix Engine                      │
 │     - AST transforms (jscodeshift / ts-morph)│
 │     - Patch generator                     │
 │                                           │
 │  4️⃣ Integration Layer                    │
 │     - GitHub API (auto PRs)               │
 │     - CLI / VSCode plugin / Slack reporter│
 └───────────────────────────────────────────┘
              │
              ▼
   ┌────────────────────┐
   │  Output Reports     │
   │  (Markdown / PR)    │
   └────────────────────┘
```

## 🧠 Detailed Flow

### Trigger
- **CLI command**: `npx perf-agent analyze`
- **Or GitHub Action** on pull request

### Analyzer Layer
Uses:
- `@next/bundle-analyzer` → creates analyze.json
- `lighthouse-ci` → generates Lighthouse JSON report
- Custom AST scanner → finds SSR/ISR usage

### AI Layer (Claude)
- Reads JSONs + RAG data
- Decides: "Which issues can be auto-fixed?"
- Generates fix plans and explanations

### Fix Engine
- Executes jscodeshift codemods
- Generates patch files or applies directly

### Output
- Markdown report → summary + fix status
- Optional: GitHub PR creation via REST API

---

## 📁 Folder Structure

```
performance-agent/
├── src/
│   ├── analysis/
│   │   ├── bundleAnalyzer.ts      # Uses Next.js bundle analyzer
│   │   ├── lighthouseRunner.ts    # Runs Lighthouse CI
│   │   ├── fetchScanner.ts        # Finds data fetching patterns
│   │   └── assetChecker.ts        # Image/font optimization
│   │
│   ├── ai/
│   │   ├── promptTemplates/
│   │   │   ├── analyzePrompt.md
│   │   │   ├── fixPrompt.md
│   │   │   └── summarizePrompt.md
│   │   ├── claudeAgent.ts         # Tool calling + MCP orchestration
│   │   └── ragRetriever.ts        # Loads team conventions from vector DB
│   │
│   ├── fix/
│   │   ├── importOptimizer.ts     # Optimize imports (e.g. lodash → lodash/debounce)
│   │   ├── imageOptimizer.ts      # Convert <img> → <Image>
│   │   ├── fetchRefactor.ts       # SSR → ISR/SSG
│   │   ├── codeSplitter.ts        # Dynamic imports
│   │   └── applyPatches.ts        # Runs all codemods
│   │
│   ├── integrations/
│   │   ├── github.ts              # PR creation, comment posting
│   │   ├── cli.ts                 # CLI entrypoint
│   │   └── slack.ts               # Slack notifications (optional)
│   │
│   ├── types/
│   │   ├── analysis.ts
│   │   ├── report.ts
│   │   └── fix.ts
│   │
│   └── index.ts                   # Main orchestrator
│
├── reports/
│   └── performance-summary.md
│
├── tests/
│   └── ... unit and integration tests ...
│
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

---

## 🧰 Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| **Language** | TypeScript | Type-safe Node.js implementation |
| **Performance Tools** | `@next/bundle-analyzer`, `lighthouse-ci` | Bundle & page audits |
| **Static Analysis** | `ts-morph`, `jscodeshift`, `@babel/parser` | Code scanning & rewriting |
| **AI Layer** | Claude Code Pro SDK | Tool-calling, reasoning, generating fixes |
| **Knowledge Storage (RAG)** | Pinecone / Supabase Vector | Team rules & conventions |
| **Integration** | GitHub REST API / Octokit | Auto-create PRs |
| **CLI** | commander / oclif | Developer commands |
| **Logger** | pino | Structured logs |
| **Testing** | vitest / jest | Validation |

---

## ⚡ CLI Commands

```bash
# Analyze performance
npx perf-agent analyze

# Auto-fix issues
npx perf-agent fix

# Generate performance report
npx perf-agent report --format md

# Create GitHub PR with fixes
npx perf-agent pr --auto

# Interactive fix selection
npx perf-agent fix --interactive

# Run specific analyzer
npx perf-agent analyze --bundle-only
npx perf-agent analyze --lighthouse-only

# Set performance budgets
npx perf-agent budget --lcp 2500 --fid 100

# Initialize configuration
npx perf-agent init
```

---

## 🧩 Implementation Examples

### Main Orchestrator (`src/index.ts`)

```typescript
import { analyzeBundle, runLighthouse, scanDataFetching } from './analysis';
import { runClaudeAgent } from './ai/claudeAgent';
import { applyFixes } from './fix';
import { createPR } from './integrations/github';
import { generateReport } from './report';

interface PerformanceAgentOptions {
  autoFix?: boolean;
  createPR?: boolean;
  interactive?: boolean;
  dryRun?: boolean;
}

export async function runPerformanceAgent(
  projectPath: string,
  options: PerformanceAgentOptions = {}
): Promise<void> {
  console.log('🚀 Starting performance analysis...');
  
  // 1. Run all analyzers in parallel
  const [bundleReport, lighthouseReport, fetchReport] = await Promise.all([
    analyzeBundle(projectPath),
    runLighthouse(projectPath),
    scanDataFetching(projectPath),
  ]);
  
  const analysisData = {
    bundle: bundleReport,
    lighthouse: lighthouseReport,
    dataFetching: fetchReport,
    projectPath,
  };
  
  console.log('🤖 Analyzing with AI...');
  
  // 2. Send to Claude for intelligent analysis
  const aiPlan = await runClaudeAgent(analysisData);
  
  // 3. Generate human-readable report
  const report = generateReport(aiPlan);
  console.log('📊 Performance Report Generated');
  
  // 4. Apply fixes if requested
  if (options.autoFix && !options.dryRun) {
    console.log('🔧 Applying performance fixes...');
    const appliedFixes = await applyFixes(aiPlan.fixes, {
      interactive: options.interactive,
      projectPath,
    });
    
    // 5. Create PR if requested
    if (options.createPR && appliedFixes.length > 0) {
      console.log('📝 Creating performance improvement PR...');
      await createPR({
        fixes: appliedFixes,
        report,
        projectPath,
      });
    }
  }
  
  console.log('✅ Performance analysis complete!');
}
```

### Bundle Analyzer (`src/analysis/bundleAnalyzer.ts`)

```typescript
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  heavyDependencies: HeavyDependency[];
  duplicates: DuplicateDependency[];
  treeshakingOpportunities: TreeshakingOpportunity[];
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: ModuleInfo[];
}

interface HeavyDependency {
  name: string;
  size: number;
  suggestedReplacement?: string;
  impact: 'high' | 'medium' | 'low';
}

export async function analyzeBundle(projectPath: string): Promise<BundleAnalysis> {
  console.log('📦 Analyzing bundle size...');
  
  try {
    // Run Next.js build with analyzer
    execSync('npm run build', { 
      cwd: projectPath, 
      stdio: 'pipe' 
    });
    
    // Check if bundle analyzer output exists
    const analyzerPath = path.join(projectPath, '.next/analyze/client.html');
    const statsPath = path.join(projectPath, '.next/analyze/client.json');
    
    if (await fileExists(statsPath)) {
      const stats = JSON.parse(await fs.readFile(statsPath, 'utf-8'));
      return parseWebpackStats(stats);
    }
    
    throw new Error('Bundle analyzer output not found');
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    throw error;
  }
}

function parseWebpackStats(stats: any): BundleAnalysis {
  const chunks = stats.chunks.map(chunk => ({
    name: chunk.name,
    size: chunk.size,
    modules: chunk.modules.map(mod => ({
      name: mod.name,
      size: mod.size,
    })),
  }));
  
  const heavyDependencies = findHeavyDependencies(chunks);
  const duplicates = findDuplicateDependencies(chunks);
  const treeshakingOpportunities = findTreeshakingOpportunities(chunks);
  
  return {
    totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
    chunks,
    heavyDependencies,
    duplicates,
    treeshakingOpportunities,
  };
}

const HEAVY_LIBRARIES = {
  'moment': { size: 300000, replacement: 'dayjs' },
  'lodash': { size: 150000, replacement: 'lodash-es' },
  'uuid': { size: 50000, replacement: 'nanoid' },
  '@material-ui/core': { size: 500000, replacement: '@mui/material' },
};

function findHeavyDependencies(chunks: ChunkInfo[]): HeavyDependency[] {
  const dependencies = new Map<string, number>();
  
  chunks.forEach(chunk => {
    chunk.modules.forEach(module => {
      const packageName = extractPackageName(module.name);
      if (packageName) {
        dependencies.set(packageName, (dependencies.get(packageName) || 0) + module.size);
      }
    });
  });
  
  return Array.from(dependencies.entries())
    .filter(([name, size]) => size > 100000 || HEAVY_LIBRARIES[name])
    .map(([name, size]) => ({
      name,
      size,
      suggestedReplacement: HEAVY_LIBRARIES[name]?.replacement,
      impact: size > 200000 ? 'high' : size > 100000 ? 'medium' : 'low',
    }));
}

function extractPackageName(moduleName: string): string | null {
  const match = moduleName.match(/node_modules\/([^\/]+)/);
  return match ? match[1] : null;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

### Lighthouse Runner (`src/analysis/lighthouseRunner.ts`)

```typescript
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

export interface LighthouseAnalysis {
  performanceScore: number;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    tbt: number;
    fcp: number;
  };
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  savings: number;
  impact: 'high' | 'medium' | 'low';
}

export async function runLighthouse(url: string): Promise<LighthouseAnalysis> {
  console.log('🔍 Running Lighthouse audit...');
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  try {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };
    
    const runnerResult = await lighthouse(url, options);
    const report = JSON.parse(runnerResult.report);
    
    return parseLighthouseReport(report);
    
  } finally {
    await chrome.kill();
  }
}

function parseLighthouseReport(report: any): LighthouseAnalysis {
  const audits = report.audits;
  
  const metrics = {
    lcp: audits['largest-contentful-paint']?.numericValue || 0,
    fid: audits['max-potential-fid']?.numericValue || 0,
    cls: audits['cumulative-layout-shift']?.numericValue || 0,
    tbt: audits['total-blocking-time']?.numericValue || 0,
    fcp: audits['first-contentful-paint']?.numericValue || 0,
  };
  
  const opportunities = Object.values(audits)
    .filter((audit: any) => audit.details?.type === 'opportunity')
    .map((audit: any) => ({
      id: audit.id,
      title: audit.title,
      description: audit.description,
      savings: audit.details.overallSavingsMs || 0,
      impact: audit.details.overallSavingsMs > 1000 ? 'high' : 
              audit.details.overallSavingsMs > 500 ? 'medium' : 'low',
    }));
  
  return {
    performanceScore: report.categories.performance.score * 100,
    metrics,
    opportunities,
    diagnostics: [], // Parse diagnostics similarly
  };
}
```

### Claude Agent Integration (`src/ai/claudeAgent.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysis {
  summary: string;
  fixes: PerformanceFix[];
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

export interface PerformanceFix {
  type: string;
  description: string;
  file: string;
  autoFixable: boolean;
  codemod?: string;
  reasoning: string;
}

export async function runClaudeAgent(analysisData: any): Promise<AIAnalysis> {
  console.log('🤖 Running Claude analysis...');
  
  const prompt = buildAnalysisPrompt(analysisData);
  
  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    tools: [
      {
        name: 'analyze_bundle',
        description: 'Analyze bundle for optimization opportunities',
        input_schema: {
          type: 'object',
          properties: {
            dependencies: { type: 'array' },
            suggestions: { type: 'array' },
          },
        },
      },
      {
        name: 'generate_fix',
        description: 'Generate a code fix for a performance issue',
        input_schema: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            file: { type: 'string' },
            fix: { type: 'string' },
            autoFixable: { type: 'boolean' },
          },
        },
      },
    ],
  });
  
  return parseClaudeResponse(message);
}

function buildAnalysisPrompt(analysisData: any): string {
  const template = readFileSync(
    path.join(__dirname, 'promptTemplates', 'analyzePrompt.md'),
    'utf-8'
  );
  
  return template
    .replace('{{BUNDLE_DATA}}', JSON.stringify(analysisData.bundle, null, 2))
    .replace('{{LIGHTHOUSE_DATA}}', JSON.stringify(analysisData.lighthouse, null, 2))
    .replace('{{FETCH_DATA}}', JSON.stringify(analysisData.dataFetching, null, 2));
}

function parseClaudeResponse(message: any): AIAnalysis {
  // Parse Claude's response and tool calls
  // Convert to structured AIAnalysis format
  return {
    summary: extractSummary(message),
    fixes: extractFixes(message),
    priority: 'high',
    estimatedImpact: 'Reduces bundle size by ~30%, improves LCP by 1.2s',
  };
}
```

### Fix Engine (`src/fix/applyPatches.ts`)

```typescript
import { execSync } from 'child_process';
import { PerformanceFix } from '../ai/claudeAgent';

export interface FixResult {
  fix: PerformanceFix;
  applied: boolean;
  error?: string;
  changes?: string[];
}

export async function applyFixes(
  fixes: PerformanceFix[],
  options: { interactive?: boolean; projectPath: string }
): Promise<FixResult[]> {
  const results: FixResult[] = [];
  
  for (const fix of fixes) {
    if (!fix.autoFixable) {
      results.push({
        fix,
        applied: false,
        error: 'Manual fix required',
      });
      continue;
    }
    
    if (options.interactive) {
      const shouldApply = await confirmFix(fix);
      if (!shouldApply) {
        results.push({ fix, applied: false, error: 'Skipped by user' });
        continue;
      }
    }
    
    try {
      const result = await applyFix(fix, options.projectPath);
      results.push(result);
    } catch (error) {
      results.push({
        fix,
        applied: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

async function applyFix(fix: PerformanceFix, projectPath: string): Promise<FixResult> {
  console.log(`🔧 Applying fix: ${fix.description}`);
  
  switch (fix.type) {
    case 'import_optimization':
      return await applyImportOptimization(fix, projectPath);
    case 'image_optimization':
      return await applyImageOptimization(fix, projectPath);
    case 'fetch_refactor':
      return await applyFetchRefactor(fix, projectPath);
    default:
      throw new Error(`Unknown fix type: ${fix.type}`);
  }
}

async function applyImportOptimization(
  fix: PerformanceFix,
  projectPath: string
): Promise<FixResult> {
  const codemodPath = path.join(__dirname, 'codemods', 'import-optimizer.js');
  
  try {
    execSync(
      `npx jscodeshift -t ${codemodPath} ${fix.file}`,
      { cwd: projectPath, stdio: 'pipe' }
    );
    
    return {
      fix,
      applied: true,
      changes: [`Optimized imports in ${fix.file}`],
    };
  } catch (error) {
    throw new Error(`Failed to apply import optimization: ${error.message}`);
  }
}

async function confirmFix(fix: PerformanceFix): Promise<boolean> {
  // Interactive CLI confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    readline.question(
      `Apply fix "${fix.description}"? (y/N): `,
      (answer: string) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}
```

---

## 🔧 Package.json Configuration

```json
{
  "name": "frontend-performance-agent",
  "version": "1.0.0",
  "description": "AI-powered frontend performance optimization agent",
  "main": "dist/index.js",
  "bin": {
    "perf-agent": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/cli.ts",
    "test": "vitest",
    "lint": "eslint src/**/*.ts",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "@next/bundle-analyzer": "^14.0.0",
    "lighthouse": "^11.0.0",
    "chrome-launcher": "^1.0.0",
    "jscodeshift": "^0.15.0",
    "ts-morph": "^21.0.0",
    "@babel/parser": "^7.23.0",
    "@babel/traverse": "^7.23.0",
    "@octokit/rest": "^20.0.0",
    "commander": "^11.0.0",
    "pino": "^8.16.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0",
    "inquirer": "^9.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/babel__traverse": "^7.20.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0",
    "eslint": "^8.0.0"
  },
  "keywords": [
    "performance",
    "optimization",
    "next.js",
    "react",
    "ai",
    "lighthouse",
    "bundle-analyzer"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/frontend-performance-agent"
  },
  "license": "MIT"
}
```

---

## 🚀 Getting Started Commands

```bash
# Create new project
mkdir frontend-performance-agent
cd frontend-performance-agent

# Initialize package.json
npm init -y

# Install dependencies
npm install @anthropic-ai/sdk @next/bundle-analyzer lighthouse chrome-launcher jscodeshift ts-morph @babel/parser @babel/traverse @octokit/rest commander pino chalk ora inquirer

# Install dev dependencies  
npm install -D @types/node @types/babel__traverse typescript vitest tsx eslint

# Create TypeScript config
npx tsc --init

# Create folder structure
mkdir -p src/{analysis,ai/promptTemplates,fix,integrations,types} reports tests

# Start development
npm run dev
```

---

## ✅ Implementation Checklist

### Phase 1: Core Analysis
- [ ] Set up TypeScript project structure
- [ ] Implement bundle analyzer integration
- [ ] Implement Lighthouse runner
- [ ] Create data fetching pattern scanner
- [ ] Set up basic CLI interface

### Phase 2: AI Integration  
- [ ] Set up Claude SDK integration
- [ ] Create prompt templates
- [ ] Implement tool calling system
- [ ] Add RAG for team conventions
- [ ] Create fix generation logic

### Phase 3: Code Transformation
- [ ] Build jscodeshift codemods
- [ ] Implement import optimization
- [ ] Add image optimization transforms
- [ ] Create data fetching refactoring
- [ ] Add interactive fix selection

### Phase 4: Integration & Automation
- [ ] GitHub API integration
- [ ] PR creation and commenting
- [ ] Slack notifications
- [ ] Performance reporting
- [ ] CI/CD GitHub Action

This blueprint provides everything needed to start building the performance agent implementation.