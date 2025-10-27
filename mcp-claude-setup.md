# 🤖 Claude Code Pro + MCP Setup

## Overview

We'll wire your system so Claude can:
- ✅ Call performance analysis tools (bundle, Lighthouse)
- ✅ Read reports & detect issues
- ✅ Generate fix plans
- ✅ Trigger code transformations (AST/codemods)
- ✅ Open PRs automatically

---

## 🧩 MCP Overview (Model Context Protocol)

MCP acts as a bridge between Claude and your system's tools. Each tool exposes a clear schema so Claude can call it safely and deterministically.

```
Claude Code Pro
   │
   ▼
MCP Server (your agent)
   ├── bundleAnalyzer (Node script)
   ├── lighthouseRunner
   ├── nextFetchScanner
   ├── codemodEngine
   ├── githubPRTool
   └── ragRetriever
```

---

## ⚙️ Step 1 — MCP Tool Definitions

Create `src/mcp/tools.json` with tool schemas:

```json
{
  "tools": {
    "bundleAnalyzer": {
      "description": "Analyzes Next.js bundles and returns size stats, heavy dependencies, and optimization opportunities",
      "input_schema": {
        "type": "object",
        "properties": {
          "path": { 
            "type": "string",
            "description": "Path to the Next.js project root"
          }
        },
        "required": ["path"]
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "totalSize": { "type": "number" },
          "heavyDependencies": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "size": { "type": "number" },
                "suggestedReplacement": { "type": "string" },
                "impact": { "type": "string", "enum": ["high", "medium", "low"] }
              }
            }
          },
          "treeshakingOpportunities": { "type": "array" },
          "duplicateDependencies": { "type": "array" }
        }
      }
    },
    
    "lighthouseRunner": {
      "description": "Runs Lighthouse performance audit and returns detailed metrics with optimization recommendations",
      "input_schema": {
        "type": "object",
        "properties": {
          "url": { 
            "type": "string",
            "description": "URL to audit (can be localhost for local development)"
          },
          "options": {
            "type": "object",
            "properties": {
              "device": { "type": "string", "enum": ["mobile", "desktop"], "default": "mobile" },
              "throttling": { "type": "string", "enum": ["simulated3G", "simulated4G", "none"], "default": "simulated3G" }
            }
          }
        },
        "required": ["url"]
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "performanceScore": { "type": "number" },
          "metrics": {
            "type": "object",
            "properties": {
              "lcp": { "type": "number" },
              "fid": { "type": "number" },
              "cls": { "type": "number" },
              "tbt": { "type": "number" }
            }
          },
          "opportunities": { "type": "array" },
          "diagnostics": { "type": "array" }
        }
      }
    },
    
    "nextFetchScanner": {
      "description": "Scans Next.js pages for data fetching patterns and suggests optimizations",
      "input_schema": {
        "type": "object",
        "properties": {
          "projectPath": { "type": "string" },
          "pagesPath": { "type": "string", "default": "src/pages" }
        },
        "required": ["projectPath"]
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "pages": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "filePath": { "type": "string" },
                "currentMethod": { "type": "string" },
                "recommendedMethod": { "type": "string" },
                "reasoning": { "type": "string" },
                "autoFixable": { "type": "boolean" }
              }
            }
          }
        }
      }
    },
    
    "codemodEngine": {
      "description": "Applies performance-related code transformations using AST codemods",
      "input_schema": {
        "type": "object",
        "properties": {
          "fixType": { 
            "type": "string",
            "enum": [
              "replaceMomentWithDayjs",
              "optimizeLodashImports", 
              "convertImgToNextImage",
              "addDynamicImports",
              "convertSSRToISR",
              "convertSSRToSSG",
              "addImageOptimization"
            ]
          },
          "filePath": { "type": "string" },
          "options": {
            "type": "object",
            "properties": {
              "dryRun": { "type": "boolean", "default": false },
              "backup": { "type": "boolean", "default": true }
            }
          }
        },
        "required": ["fixType", "filePath"]
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "success": { "type": "boolean" },
          "changes": { "type": "array", "items": { "type": "string" } },
          "diff": { "type": "string" },
          "error": { "type": "string" }
        }
      }
    },
    
    "githubPRTool": {
      "description": "Creates a pull request with performance improvements and detailed explanations",
      "input_schema": {
        "type": "object",
        "properties": {
          "branch": { "type": "string" },
          "title": { "type": "string" },
          "body": { "type": "string" },
          "files": {
            "type": "array",
            "items": { "type": "string" },
            "description": "List of modified files to include"
          },
          "labels": {
            "type": "array",
            "items": { "type": "string" },
            "default": ["performance", "optimization", "automated-fix"]
          }
        },
        "required": ["branch", "title", "body"]
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "prUrl": { "type": "string" },
          "prNumber": { "type": "number" },
          "success": { "type": "boolean" }
        }
      }
    },
    
    "ragRetriever": {
      "description": "Retrieves performance conventions and best practices from team knowledge base",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" },
          "category": {
            "type": "string",
            "enum": ["bundling", "images", "data-fetching", "caching", "general"],
            "default": "general"
          },
          "limit": { "type": "number", "default": 5 }
        },
        "required": ["query"]
      },
      "output_schema": {
        "type": "object",
        "properties": {
          "results": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "content": { "type": "string" },
                "score": { "type": "number" },
                "source": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## ⚙️ Step 2 — MCP Server Implementation

Create `src/mcp/server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';

// Import your tool implementations
import { analyzeBundle } from '../analysis/bundleAnalyzer.js';
import { runLighthouse } from '../analysis/lighthouseRunner.js';
import { scanDataFetching } from '../analysis/fetchScanner.js';
import { applyCodemod } from '../fix/applyPatches.js';
import { createPR } from '../integrations/github.js';
import { retrieveDocs } from '../ai/ragRetriever.js';

class PerformanceAgentServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'frontend-performance-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'bundleAnalyzer',
            description: 'Analyzes Next.js bundles and returns size stats, heavy dependencies, and optimization opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                path: { 
                  type: 'string',
                  description: 'Path to the Next.js project root'
                }
              },
              required: ['path']
            }
          },
          {
            name: 'lighthouseRunner',
            description: 'Runs Lighthouse performance audit and returns detailed metrics',
            inputSchema: {
              type: 'object',
              properties: {
                url: { 
                  type: 'string',
                  description: 'URL to audit'
                },
                options: {
                  type: 'object',
                  properties: {
                    device: { type: 'string', enum: ['mobile', 'desktop'] },
                    throttling: { type: 'string', enum: ['simulated3G', 'simulated4G', 'none'] }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'nextFetchScanner',
            description: 'Scans Next.js pages for data fetching patterns',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: { type: 'string' },
                pagesPath: { type: 'string' }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'codemodEngine',
            description: 'Applies performance-related code transformations',
            inputSchema: {
              type: 'object',
              properties: {
                fixType: { 
                  type: 'string',
                  enum: [
                    'replaceMomentWithDayjs',
                    'optimizeLodashImports',
                    'convertImgToNextImage',
                    'addDynamicImports',
                    'convertSSRToISR',
                    'convertSSRToSSG'
                  ]
                },
                filePath: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    dryRun: { type: 'boolean' },
                    backup: { type: 'boolean' }
                  }
                }
              },
              required: ['fixType', 'filePath']
            }
          },
          {
            name: 'githubPRTool',
            description: 'Creates a pull request with performance improvements',
            inputSchema: {
              type: 'object',
              properties: {
                branch: { type: 'string' },
                title: { type: 'string' },
                body: { type: 'string' },
                files: { type: 'array', items: { type: 'string' } }
              },
              required: ['branch', 'title', 'body']
            }
          },
          {
            name: 'ragRetriever',
            description: 'Retrieves performance conventions from team knowledge base',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                category: { type: 'string' },
                limit: { type: 'number' }
              },
              required: ['query']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'bundleAnalyzer':
            const bundleResult = await analyzeBundle(args.path);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(bundleResult, null, 2)
                }
              ]
            };

          case 'lighthouseRunner':
            const lighthouseResult = await runLighthouse(args.url, args.options);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(lighthouseResult, null, 2)
                }
              ]
            };

          case 'nextFetchScanner':
            const fetchResult = await scanDataFetching(args.projectPath, args.pagesPath);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(fetchResult, null, 2)
                }
              ]
            };

          case 'codemodEngine':
            const codemodResult = await applyCodemod(args.fixType, args.filePath, args.options);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(codemodResult, null, 2)
                }
              ]
            };

          case 'githubPRTool':
            const prResult = await createPR(args.branch, args.title, args.body, args.files);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(prResult, null, 2)
                }
              ]
            };

          case 'ragRetriever':
            const ragResult = await retrieveDocs(args.query, args.category, args.limit);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(ragResult, null, 2)
                }
              ]
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Frontend Performance Agent MCP server running on stdio');
  }
}

// Start the server
const server = new PerformanceAgentServer();
server.run().catch(console.error);
```

---

## ⚙️ Step 3 — Claude Code Pro Configuration

Create `.clauderc` file in your project root:

```json
{
  "name": "Frontend Performance Agent",
  "description": "AI agent that analyzes and fixes Next.js performance issues automatically",
  "mcpServers": {
    "frontend-performance-agent": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "systemPrompt": "You are a senior frontend performance engineer. Your role is to analyze web applications for performance issues and automatically apply fixes when safe to do so. Always explain your reasoning and provide before/after comparisons.",
  "tools": {
    "enabled": [
      "bundleAnalyzer",
      "lighthouseRunner", 
      "nextFetchScanner",
      "codemodEngine",
      "githubPRTool",
      "ragRetriever"
    ],
    "autoApprove": [
      "bundleAnalyzer",
      "lighthouseRunner",
      "nextFetchScanner",
      "ragRetriever"
    ]
  },
  "rag": {
    "enabled": true,
    "vectorStore": "supabase",
    "embeddingModel": "text-embedding-3-small",
    "collections": ["performance-docs", "team-conventions"]
  }
}
```

---

## 🧠 Step 4 — Claude Prompt Templates

Create `src/ai/promptTemplates/` with these files:

### `analyzePrompt.md`
```markdown
# Frontend Performance Analysis

You are a senior performance engineer analyzing a Next.js application.

## Available Tools
- `bundleAnalyzer`: Analyze bundle sizes and dependencies
- `lighthouseRunner`: Run performance audits
- `nextFetchScanner`: Check data fetching patterns
- `ragRetriever`: Get team conventions

## Your Task
1. **Analyze** the application using available tools
2. **Identify** performance issues and optimization opportunities
3. **Classify** each issue as:
   - 🟢 Auto-fixable (safe transformations)
   - 🟡 Semi-auto (requires confirmation)
   - 🔴 Manual (requires human intervention)

## Analysis Process
1. Start by calling `bundleAnalyzer` to understand bundle composition
2. Run `lighthouseRunner` for performance metrics
3. Use `nextFetchScanner` to check data fetching patterns
4. Query `ragRetriever` for relevant team conventions
5. Provide prioritized recommendations

## Output Format
Provide analysis in this structure:
- **Executive Summary** (2-3 sentences)
- **Critical Issues** (high impact, auto-fixable)
- **Optimization Opportunities** (medium impact)
- **Manual Review Required** (complex changes)
- **Estimated Impact** (performance improvements)

Project Path: {{PROJECT_PATH}}
URL to Audit: {{AUDIT_URL}}
```

### `fixPrompt.md`
```markdown
# Performance Fix Application

You have identified performance issues and now need to apply fixes.

## Available Codemods
- `replaceMomentWithDayjs`: Replace moment.js with dayjs
- `optimizeLodashImports`: Convert to tree-shakeable imports  
- `convertImgToNextImage`: Upgrade to Next.js Image component
- `addDynamicImports`: Add code splitting with dynamic imports
- `convertSSRToISR`: Convert SSR to Incremental Static Regeneration
- `convertSSRToSSG`: Convert SSR to Static Site Generation

## Safety Guidelines
1. **Always backup** files before transformation
2. **Apply one fix at a time** to isolate issues
3. **Validate** each fix with the team's conventions via `ragRetriever`
4. **Create descriptive PR** explaining all changes

## Fix Application Process
1. Query `ragRetriever` for relevant conventions
2. Apply fixes using `codemodEngine` 
3. Validate changes don't break functionality
4. Create comprehensive PR with `githubPRTool`

Identified Issues: {{ISSUES_LIST}}
```

### `summarizePrompt.md`
```markdown
# Performance Optimization Summary

Create a comprehensive summary of performance improvements made.

## Required Sections
1. **Changes Made** 
   - List of files modified
   - Specific optimizations applied
   - Before/after metrics

2. **Performance Impact**
   - Bundle size improvements
   - Lighthouse score changes  
   - Core Web Vitals improvements

3. **Team Benefits**
   - Reduced load times
   - Better user experience
   - Lower infrastructure costs

## PR Description Template
Use this format for GitHub PR:

```markdown
# 🚀 Performance Optimization

## Summary
Brief description of optimizations applied.

## Changes
- [ ] Bundle optimization (X kb reduction)
- [ ] Image optimization 
- [ ] Data fetching improvements
- [ ] Code splitting enhancements

## Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Bundle Size | X kb | Y kb | Z% reduction |
| LCP | X ms | Y ms | Z ms faster |
| Performance Score | X | Y | Z point increase |

## Testing
- [ ] Bundle builds successfully
- [ ] All pages load correctly
- [ ] Performance tests pass
```

Applied Fixes: {{APPLIED_FIXES}}
Performance Data: {{PERFORMANCE_DATA}}
```

---

## ⚙️ Step 5 — Example Workflow Implementation

Create `src/workflows/performanceWorkflow.ts`:

```typescript
import { ClaudeClient } from '@anthropic-ai/claude-sdk';

export class PerformanceWorkflow {
  private claude: ClaudeClient;

  constructor() {
    this.claude = new ClaudeClient({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async runFullAnalysis(projectPath: string, auditUrl: string) {
    const conversation = await this.claude.conversations.create({
      model: 'claude-3-sonnet-20240229',
      systemPrompt: `You are a senior frontend performance engineer. Analyze this Next.js application and apply performance optimizations.`,
    });

    // Step 1: Initial Analysis
    const analysisPrompt = `
Please analyze this Next.js application for performance issues:

Project Path: ${projectPath}
Audit URL: ${auditUrl}

Use the available MCP tools to:
1. Analyze bundle composition
2. Run Lighthouse audit
3. Scan data fetching patterns
4. Check team conventions

Provide a prioritized list of issues with auto-fix recommendations.
    `;

    const analysisResponse = await conversation.sendMessage(analysisPrompt);

    // Step 2: Apply Fixes
    const fixPrompt = `
Based on your analysis, please apply all auto-fixable optimizations.
Use the codemod engine to make safe transformations.
Create a pull request when complete.
    `;

    const fixResponse = await conversation.sendMessage(fixPrompt);

    return {
      analysis: analysisResponse,
      fixes: fixResponse,
    };
  }
}
```

---

## 🧩 Example Tool Calls

### 1. Bundle Analysis Call
```json
{
  "tool": "bundleAnalyzer",
  "arguments": {
    "path": "./my-nextjs-app"
  }
}
```

**Claude receives:**
```json
{
  "totalSize": 2400000,
  "heavyDependencies": [
    {
      "name": "moment",
      "size": 300000,
      "suggestedReplacement": "dayjs",
      "impact": "high"
    }
  ],
  "treeshakingOpportunities": ["lodash"],
  "duplicateDependencies": ["react-is"]
}
```

### 2. Lighthouse Analysis Call
```json
{
  "tool": "lighthouseRunner", 
  "arguments": {
    "url": "http://localhost:3000",
    "options": {
      "device": "mobile",
      "throttling": "simulated3G"
    }
  }
}
```

### 3. Apply Fix Call
```json
{
  "tool": "codemodEngine",
  "arguments": {
    "fixType": "replaceMomentWithDayjs",
    "filePath": "src/components/DatePicker.tsx",
    "options": {
      "dryRun": false,
      "backup": true
    }
  }
}
```

### 4. Create PR Call
```json
{
  "tool": "githubPRTool",
  "arguments": {
    "branch": "perf/optimize-bundle-dependencies",
    "title": "🚀 Optimize dependencies - reduce bundle by 250kb",
    "body": "## Performance Improvements\n\n- Replace moment.js with dayjs (300kb → 2kb)\n- Optimize lodash imports for tree-shaking\n- Convert images to Next.js Image component\n\n## Impact\n- Bundle size: -250kb (-10%)\n- LCP improvement: -1.2s\n- Performance score: +15 points",
    "files": [
      "src/components/DatePicker.tsx",
      "src/pages/dashboard.tsx",
      "package.json"
    ]
  }
}
```

---

## 🛡️ Security & Sandboxing

### Environment Setup
```bash
# .env file
ANTHROPIC_API_KEY=your_claude_api_key
GITHUB_TOKEN=your_github_token
NODE_ENV=production

# Limit tool permissions
MCP_ALLOWED_PATHS=/workspace/projects
MCP_GITHUB_ORG=your-org
MCP_MAX_FILE_SIZE=10MB
```

### Sandboxing Configuration
```typescript
// src/mcp/security.ts
export const SECURITY_CONFIG = {
  allowedPaths: ['/workspace', '/tmp'],
  blockedCommands: ['rm -rf', 'sudo', 'curl'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedDomains: ['localhost', 'github.com'],
  rateLimits: {
    bundleAnalysis: '10/hour',
    codeTransformation: '50/hour',
    prCreation: '5/hour'
  }
};
```

---

## ✅ Testing the Setup

Create `test/mcp-integration.test.ts`:

```typescript
import { PerformanceAgentServer } from '../src/mcp/server';

describe('MCP Integration', () => {
  test('bundleAnalyzer tool returns valid analysis', async () => {
    const result = await callTool('bundleAnalyzer', {
      path: './test-fixtures/sample-nextjs-app'
    });
    
    expect(result).toHaveProperty('totalSize');
    expect(result).toHaveProperty('heavyDependencies');
  });

  test('codemodEngine applies fixes correctly', async () => {
    const result = await callTool('codemodEngine', {
      fixType: 'replaceMomentWithDayjs',
      filePath: './test-fixtures/date-component.tsx',
      options: { dryRun: true }
    });
    
    expect(result.success).toBe(true);
    expect(result.changes).toContain('Replaced moment import with dayjs');
  });
});
```

## 🚀 Launch Commands

```bash
# Build MCP server
npm run build

# Start MCP server
node dist/mcp/server.js

# Test tool calling
npm run test:mcp

# Run full workflow
npx perf-agent analyze --mcp
```

## ✅ End Result

Claude Code Pro now becomes the intelligent brain of your Performance Agent:

- ✅ **Calls local tools** via MCP safely
- ✅ **Reads complex data** from bundle + Lighthouse
- ✅ **Generates smart fixes** based on best practices
- ✅ **Applies codemods** automatically with rollback
- ✅ **Creates detailed PRs** with performance explanations
- ✅ **Follows team conventions** via RAG integration
- ✅ **Learns from feedback** to improve recommendations

Your performance agent is now a fully autonomous system that can analyze, fix, and improve frontend performance without human intervention while staying aligned with your team's standards.