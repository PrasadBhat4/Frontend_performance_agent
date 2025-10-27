# 🧠 Performance & Optimization Agent — Extended Capabilities

## Goal
An AI agent that not only detects frontend performance issues but also **fixes them automatically** (with developer approval).

---

## ⚙️ Capabilities Overview

| Capability | Description | Fix Support |
|------------|-------------|-------------|
| **Bundle Analysis** | Detect heavy dependencies, duplicates, dead code | ✅ Suggests + auto-fixes imports and dependency replacements |
| **Lighthouse / Web Vitals Audit** | Runs Lighthouse / PageSpeed API | ⚙️ Suggests optimizations (defer scripts, image compression) |
| **Next.js Data Fetching Advisor** | Analyzes SSR, ISR, SSG, SWR usage | ✅ Refactors to recommended fetching method |
| **Image & Asset Optimization** | Detects large unoptimized images or fonts | ✅ Converts `<img>` → `<Image>`, adds priority or lazy props |
| **Code Splitting & Lazy Loading** | Finds large dynamic imports | ✅ Wraps in `next/dynamic` automatically |
| **SEO & Meta Optimization** | Detects missing meta tags, OG tags, canonical URLs | ✅ Generates correct `<Head>` block |
| **PR Review Integration** | Posts summarized report on PR | ⚙️ Auto-fix option ("Apply all safe fixes") |
| **Refactor Mode** | Applies safe transformations locally (AST-based) | ✅ Uses codemods to rewrite code |

---

## 🧩 Implementation Plan (with Fix Capability)

### 1. Static Analysis Engine
Parse the Next.js project using AST parsers (`@babel/parser`, `recast`).

**Detection Capabilities:**
- Large static imports (`import lodash from 'lodash'`)
- Heavy dependencies (`moment`, `uuid`, etc.)
- Images missing optimization
- Pages using SSR unnecessarily
- Unused dependencies and dead code
- Inefficient data fetching patterns

```typescript
// Example AST Analysis
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const detectHeavyImports = (code: string) => {
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const heavyImports: string[] = [];
  
  traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (HEAVY_LIBRARIES.includes(source)) {
        heavyImports.push(source);
      }
    }
  });
  
  return heavyImports;
};
```

### 2. AI Layer (Claude / Code Pro)
Use Claude's tool-calling to:
- Parse bundle/Lighthouse JSONs
- Decide which issues are auto-fixable
- Generate code diffs or commit-ready patches
- Prioritize fixes by impact and safety

```typescript
// Tool Integration Example
const performanceAnalysis = async (projectPath: string) => {
  const bundleReport = await analyzeBundleSize(projectPath);
  const lighthouseReport = await runLighthouseAudit(projectPath);
  const fetchPatterns = await analyzeFetchPatterns(projectPath);
  
  // Send to Claude for intelligent analysis
  const fixes = await claude.generateFixes({
    bundleReport,
    lighthouseReport,
    fetchPatterns,
    codebase: projectPath
  });
  
  return fixes;
};
```

### 3. Code Fix Engine
Built with codemods (like `jscodeshift` or `ts-morph`).

**Example Transformations:**

#### Import Optimization
```javascript
// Before
import moment from 'moment';

// After  
import dayjs from 'dayjs';
```

#### Image Optimization
```jsx
// Before
<img src="/banner.png" />

// After
<Image src="/banner.png" width={600} height={300} />
```

#### Data Fetching Optimization
```javascript
// Before
export async function getServerSideProps() {
  const data = await fetchAPI();
  return { props: { data } };
}

// After
export async function getStaticProps() {
  const data = await fetchAPI();
  return { 
    props: { data }, 
    revalidate: 60 
  };
}
```

#### Lazy Loading Component
```javascript
// Before
import HeavyChart from './HeavyChart';

// After
const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false });
```

### 4. Auto-PR Creation
After generating fixes → create a branch and PR using GitHub API.

**PR includes:**
- Description of problems detected
- Summary of auto-applied fixes
- Remaining manual recommendations
- Performance impact estimates
- Before/after bundle size comparisons

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Core Agent** | Claude Code Pro (tool-calling + MCP) |
| **Analyzer** | Next.js bundle analyzer + Lighthouse CI |
| **Code Mod Engine** | jscodeshift / ts-morph |
| **Data Storage** | Vector DB (RAG on performance docs) |
| **Integration** | GitHub Action / CLI / Slack bot |
| **AST Processing** | @babel/parser, recast, typescript compiler API |
| **Build Analysis** | webpack-bundle-analyzer, rollup-plugin-analyzer |
| **Performance Testing** | Lighthouse, PageSpeed Insights API |

---

## 💡 Detailed Fix Examples

### 1️⃣ Bundle Optimization Fixes

#### Heavy Library Replacement
```javascript
// Detection: moment.js (300kb) → dayjs (2kb)
const libraryReplacements = {
  'moment': 'dayjs',
  'lodash': 'lodash-es',  // Tree-shakeable version
  'uuid': 'nanoid',       // Smaller alternative
};

// Codemod Implementation
export const replaceHeavyLibrary = (fileInfo, api) => {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  
  // Replace import declarations
  root.find(j.ImportDeclaration)
    .filter(path => path.value.source.value === 'moment')
    .replaceWith(j.importDeclaration([], j.literal('dayjs')));
    
  return root.toSource();
};
```

#### Dead Code Elimination
```javascript
// Detection & Removal of unused imports
const removeUnusedImports = (ast) => {
  const usedIdentifiers = new Set();
  const importedIdentifiers = new Map();
  
  // Collect all imported identifiers
  traverse(ast, {
    ImportDeclaration(path) {
      path.node.specifiers.forEach(spec => {
        importedIdentifiers.set(spec.local.name, path);
      });
    },
    
    // Track usage
    Identifier(path) {
      if (!path.isReferencedIdentifier()) return;
      usedIdentifiers.add(path.node.name);
    }
  });
  
  // Remove unused imports
  importedIdentifiers.forEach((path, name) => {
    if (!usedIdentifiers.has(name)) {
      path.remove();
    }
  });
};
```

### 2️⃣ Next.js Specific Optimizations

#### Image Component Migration
```typescript
// AST transformation for Image optimization
const migrateToNextImage = {
  visitJSXElement(path) {
    const { openingElement } = path.value;
    
    if (openingElement.name.name === 'img') {
      // Extract src attribute
      const srcAttr = openingElement.attributes.find(
        attr => attr.name.name === 'src'
      );
      
      if (srcAttr) {
        // Transform to Next.js Image component
        openingElement.name.name = 'Image';
        
        // Add required width/height if missing
        if (!hasAttribute(openingElement, 'width')) {
          addAttribute(openingElement, 'width', '600');
        }
        if (!hasAttribute(openingElement, 'height')) {
          addAttribute(openingElement, 'height', '400');
        }
        
        // Add import if not present
        addNextImageImport(path);
      }
    }
    
    this.traverse(path);
  }
};
```

#### Data Fetching Strategy Optimization
```typescript
// Analyze and optimize data fetching methods
const optimizeDataFetching = async (filePath: string) => {
  const analysis = await analyzeDataFetching(filePath);
  
  const recommendations = [];
  
  // SSR → ISR conversion for cacheable data
  if (analysis.hasSSR && analysis.isCacheable) {
    recommendations.push({
      type: 'convert_ssr_to_isr',
      reason: 'Data is cacheable, ISR will improve performance',
      transform: convertSSRToISR,
      impact: 'High - Reduces server load and improves TTFB'
    });
  }
  
  // Client-side fetch → SSG for static data
  if (analysis.hasClientFetch && analysis.isStatic) {
    recommendations.push({
      type: 'convert_client_to_ssg',
      reason: 'Data is static, SSG will improve performance',
      transform: convertClientToSSG,
      impact: 'Medium - Reduces client-side requests'
    });
  }
  
  return recommendations;
};
```

### 3️⃣ Performance Critical Path Fixes

#### Script Loading Optimization
```typescript
// Automatically defer non-critical scripts
const optimizeScriptLoading = (ast) => {
  traverse(ast, {
    JSXElement(path) {
      if (path.node.openingElement.name.name === 'script') {
        const src = getAttributeValue(path.node, 'src');
        
        // Check if script is critical
        if (!isCriticalScript(src)) {
          // Add defer attribute
          addJSXAttribute(path.node, 'defer', true);
        }
        
        // Add async for third-party scripts
        if (isThirdPartyScript(src)) {
          addJSXAttribute(path.node, 'async', true);
        }
      }
    }
  });
};
```

#### Font Loading Optimization
```typescript
// Add preload for critical fonts
const optimizeFontLoading = (ast) => {
  const fonts = detectFontUsage(ast);
  
  fonts.critical.forEach(font => {
    addFontPreload(ast, font.url, font.format);
  });
  
  fonts.nonCritical.forEach(font => {
    addFontDisplaySwap(ast, font.selector);
  });
};
```

---

## 🧭 Detailed Roadmap

### Phase 1: Analysis & Detection (Weeks 1-3)
**Goal: Comprehensive issue detection**

- ✅ Bundle & Lighthouse analysis
- ✅ Generate markdown reports
- ✅ AST-based code analysis
- ✅ Performance bottleneck identification

**Deliverables:**
- CLI tool for analysis
- JSON/Markdown report generation
- Performance scoring system

### Phase 2: Auto-Fix Engine (Weeks 4-7)
**Goal: Safe code transformations**

- ✅ AST-based code analysis & fix suggestions
- ✅ Codemod engine for safe transformations
- ✅ Auto-fix command (`npx perf-agent fix`)
- ✅ Interactive fix selection

**Deliverables:**
- Code transformation engine
- Library of performance codemods
- Interactive CLI for fix selection
- Rollback mechanism for safety

### Phase 3: Integration & Automation (Weeks 8-12)
**Goal: Seamless workflow integration**

- ✅ GitHub Action integration → PR comments
- ✅ Auto-fix PRs + Slack summaries
- ✅ Team preference learning (RAG + feedback)
- ✅ Performance regression prevention

**Deliverables:**
- GitHub Action package
- PR automation system
- Team dashboard
- Slack/Discord integrations

---

## 🔧 Implementation Architecture

### Core Components

```typescript
// Main Agent Interface
class PerformanceAgent {
  private analyzer: CodeAnalyzer;
  private fixer: CodeFixEngine;
  private reporter: ReportGenerator;
  private integrator: IntegrationManager;
  
  async analyze(projectPath: string): Promise<AnalysisReport> {
    const bundleAnalysis = await this.analyzer.analyzeBundles(projectPath);
    const performanceAudit = await this.analyzer.auditPerformance(projectPath);
    const codeIssues = await this.analyzer.scanCodeIssues(projectPath);
    
    return this.reporter.generateReport({
      bundleAnalysis,
      performanceAudit,
      codeIssues
    });
  }
  
  async fix(issues: Issue[], options: FixOptions): Promise<FixResult[]> {
    const fixes = await this.fixer.generateFixes(issues);
    
    if (options.autoApply) {
      return await this.fixer.applyFixes(fixes, options);
    }
    
    return fixes;
  }
  
  async createPR(fixes: FixResult[]): Promise<PullRequest> {
    return await this.integrator.createPerformancePR(fixes);
  }
}
```

### Codemod Pipeline

```typescript
// Fix Pipeline Architecture
interface FixPipeline {
  detect: (ast: AST) => Issue[];
  validate: (issue: Issue) => boolean;
  transform: (issue: Issue, ast: AST) => Transformation;
  apply: (transformation: Transformation) => Result;
  rollback?: (result: Result) => void;
}

// Example: Heavy Import Fix Pipeline
const heavyImportPipeline: FixPipeline = {
  detect: (ast) => detectHeavyImports(ast),
  validate: (issue) => isReplacementAvailable(issue.library),
  transform: (issue, ast) => generateReplacement(issue, ast),
  apply: (transformation) => applyTransformation(transformation),
  rollback: (result) => revertChanges(result)
};
```

---

## ✅ End Result

### A Self-Healing Performance Assistant That:

1. **🔍 Detects** performance and data-fetching issues automatically
2. **🔧 Fixes** issues with safe, tested code transformations
3. **📊 Reports** improvements with before/after metrics
4. **🤖 Automates** PR creation with detailed explanations
5. **🧠 Learns** your team's preferences via RAG + feedback loop
6. **🛡️ Protects** against regressions with performance budgets
7. **📈 Tracks** performance improvements over time
8. **🎯 Prioritizes** fixes by impact and implementation effort

### Key Benefits:

- **Zero-Config Setup**: Works out of the box with Next.js projects
- **Safe Transformations**: All fixes are reversible and tested
- **Team Integration**: Learns and enforces team conventions
- **Performance Focused**: Every recommendation improves real metrics
- **Developer Friendly**: Clear explanations and educational content
- **Continuous Improvement**: Gets better with usage and feedback

This extended agent becomes a true performance engineering partner, not just a monitoring tool.