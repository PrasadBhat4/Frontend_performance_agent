# Frontend Performance Agent - MCP Server

An MCP (Model Context Protocol) server that provides AI-powered frontend performance analysis and optimization tools for Next.js applications.

## 🚀 Features

- **Bundle Analysis**: Analyze Next.js bundles for heavy dependencies and optimization opportunities
- **Lighthouse Audits**: Run automated performance audits with Core Web Vitals
- **Data Fetching Scanner**: Scan for optimal data fetching patterns (SSR/SSG/ISR)
- **Code Transformations**: Apply performance fixes using AST codemods
- **Performance Reports**: Generate comprehensive optimization reports

## 🔧 Installation & Setup

1. **Build the MCP server:**
```bash
npm install
npm run build
```

2. **Configure Claude Code:**
Create/update `.clauderc` in your project root:
```json
{
  "mcpServers": {
    "frontend-performance-agent": {
      "command": "node",
      "args": ["path/to/frontend-performance-agent/dist/server.js"]
    }
  }
}
```

3. **Restart Claude Code** to load the MCP server

## 🧰 Available Tools

### `analyzeBundle`
Analyzes Next.js bundle for size and dependencies.
```
Input: { projectPath: string }
```

### `runLighthouse` 
Runs Lighthouse performance audit.
```
Input: { 
  url: string, 
  options?: { device: 'mobile'|'desktop', throttling: 'simulated3G'|'simulated4G'|'none' }
}
```

### `scanDataFetching`
Scans pages for data fetching optimization opportunities.
```
Input: { projectPath: string, pagesPath?: string }
```

### `applyCodeTransform`
Applies performance code transformations.
```
Input: { 
  transformType: 'replaceMomentWithDayjs'|'optimizeLodashImports'|'convertImgToNextImage'|etc,
  filePath: string,
  options?: { dryRun?: boolean, backup?: boolean }
}
```

### `startDevServer`
Starts Next.js dev server if not running.
```
Input: { projectPath: string }
```

### `generatePerformanceReport`
Creates comprehensive performance report.
```
Input: { bundleData: object, lighthouseData: object, dataFetchingData?: object }
```

## 💡 Usage Example

Once configured, you can ask Claude:

> "Analyze the performance of my Next.js app and suggest optimizations"

Claude will automatically:
1. Analyze your bundle using `analyzeBundle`
2. Run Lighthouse audit using `runLighthouse`
3. Scan data fetching patterns using `scanDataFetching`
4. Generate a comprehensive report with actionable recommendations
5. Optionally apply auto-fixes using `applyCodeTransform`

## 🔧 Supported Transformations

- **Replace moment.js with dayjs**: Reduces bundle by ~300kb
- **Optimize lodash imports**: Enable tree-shaking
- **Convert img to Next.js Image**: Better performance and SEO
- **Add dynamic imports**: Implement code splitting
- **Convert SSR to ISR/SSG**: Optimize data fetching strategy
- **Add image optimization**: Priority loading for above-fold images

## 📋 Requirements

- Node.js 18+
- Next.js project
- Claude Code with MCP support

## 🐛 Troubleshooting

1. **Server not starting**: Check Node.js version and dependencies
2. **Tool not found**: Verify `.clauderc` configuration and restart Claude Code
3. **Analysis fails**: Ensure you're in a valid Next.js project directory

## 🤝 Contributing

This is an open-source performance agent. Contributions welcome!

## 📄 License

MIT