export interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  heavyDependencies: HeavyDependency[];
  duplicates: DuplicateDependency[];
  treeshakingOpportunities: TreeshakingOpportunity[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  modules: ModuleInfo[];
}

export interface ModuleInfo {
  name: string;
  size: number;
  id: string | number;
}

export interface HeavyDependency {
  name: string;
  size: number;
  suggestedReplacement?: string;
  impact: 'high' | 'medium' | 'low';
  reason: string;
}

export interface DuplicateDependency {
  name: string;
  versions: string[];
  totalSize: number;
}

export interface TreeshakingOpportunity {
  library: string;
  currentImport: string;
  suggestedImport: string;
  estimatedSavings: number;
}

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

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  savings: number;
  impact: 'high' | 'medium' | 'low';
}

export interface Diagnostic {
  id: string;
  title: string;
  description: string;
  score: number;
}

export interface DataFetchingAnalysis {
  pages: PageAnalysis[];
  summary: {
    totalPages: number;
    ssrPages: number;
    ssgPages: number;
    isrPages: number;
    clientOnlyPages: number;
  };
}

export interface PageAnalysis {
  filePath: string;
  currentMethod: 'SSR' | 'SSG' | 'ISR' | 'CLIENT' | 'UNKNOWN';
  recommendedMethod: 'SSR' | 'SSG' | 'ISR' | 'CLIENT';
  reasoning: string;
  autoFixable: boolean;
  dataFetching: {
    hasGetServerSideProps: boolean;
    hasGetStaticProps: boolean;
    hasGetStaticPaths: boolean;
    hasClientFetch: boolean;
    isStatic: boolean;
    isCacheable: boolean;
  };
}

export interface CodeTransformResult {
  success: boolean;
  changes: string[];
  diff?: string;
  error?: string;
  filePath: string;
  transformType: string;
}

export interface AnalysisOptions {
  projectPath: string;
  buildCommand?: string;
  url?: string;
  skipBuild?: boolean;
}