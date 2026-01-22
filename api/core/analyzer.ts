/**
 * Core Codebase Analyzer
 * Analyzes project structure, patterns, and conventions
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { createHash } from 'crypto';

// Types
export interface AnalysisResult {
  projectType: 'new' | 'existing';
  confidence: number;
  techStack: TechStack;
  patterns: PatternMap;
  conventions: ConventionSet;
  structure: ProjectStructure;
  dependencies: DependencyGraph;
  examples: CodeExample[];
  errors?: AnalysisError[];
  timestamp: Date;
  checksum: string;
}

export interface TechStack {
  primaryLanguage: string;
  languages: string[];
  frameworks: {
    frontend?: string[];
    backend?: string[];
    testing?: string[];
    database?: string[];
  };
  packageManager?: string;
  buildTools?: string[];
  orm?: string;
  styling?: string[];
  confidence: number;
}

export interface Pattern {
  name: string;
  category: string;
  examples: CodeExample[];
  frequency: number;
  confidence: number;
}

export interface CodeExample {
  title: string;
  filePath: string;
  code: string;
  language: string;
  startLine?: number;
  endLine?: number;
  explanation?: string;
}

export interface ConventionSet {
  naming: NamingConvention;
  structure: StructureConvention;
  codeStyle: CodeStyleConvention;
}

export interface NamingConvention {
  files: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case';
  variables: 'camelCase' | 'PascalCase' | 'snake_case' | 'UPPER_SNAKE_CASE';
  functions: 'camelCase' | 'PascalCase' | 'snake_case';
  classes: 'PascalCase' | 'camelCase';
  constants: 'UPPER_SNAKE_CASE' | 'PascalCase' | 'camelCase';
  components?: 'PascalCase' | 'camelCase';
}

export interface StructureConvention {
  sourceRoot: string;
  testLocation: 'alongside' | 'separate' | 'mixed';
  configLocation: 'root' | 'config' | 'scattered';
  assetLocation?: string;
  layout: 'flat' | 'feature-based' | 'layer-based' | 'domain-driven';
}

export interface CodeStyleConvention {
  indentation: number | 'tab';
  quotes: 'single' | 'double' | 'mixed';
  semicolons: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  lineEndings: 'lf' | 'crlf' | 'mixed';
  maxLineLength?: number;
  bracketStyle: 'same-line' | 'new-line' | 'mixed';
}

type PatternMap = Map<string, Pattern[]>;

export interface ProjectStructure {
  rootPath: string;
  sourcePaths: string[];
  testPaths: string[];
  configPaths: string[];
  totalFiles: number;
  totalLines: number;
  directories: DirectoryInfo[];
}

export interface DirectoryInfo {
  path: string;
  purpose: 'source' | 'test' | 'config' | 'asset' | 'documentation' | 'unknown';
  fileCount: number;
  languages: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface DependencyNode {
  id: string;
  name: string;
  version?: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  category?: 'framework' | 'library' | 'tool' | 'utility';
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'depends' | 'devDepends' | 'imports';
}

export interface AnalysisError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
}

// Main Analyzer Class
export class CodebaseAnalyzer {
  private projectPath: string;
  private cache: Map<string, any> = new Map();

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
  }

  /**
   * Main analysis entry point
   */
  async analyze(): Promise<AnalysisResult> {
    try {
      // Step 1: Detect project type
      const projectType = await this.detectProjectType();

      // Step 2: Detect tech stack
      const techStack = await this.detectTechStack();

      // Step 3: Extract patterns
      const patterns = await this.extractPatterns();

      // Step 4: Extract conventions
      const conventions = await this.extractConventions();

      // Step 5: Analyze structure
      const structure = await this.analyzeStructure();

      // Step 6: Build dependency graph
      const dependencies = await this.buildDependencyGraph();

      // Step 7: Extract code examples
      const examples = await this.extractCodeExamples(patterns);

      // Step 8: Calculate confidence
      const confidence = this.calculateOverallConfidence({
        projectType,
        techStack,
        patterns,
        conventions
      });

      // Step 9: Generate checksum
      const checksum = await this.generateChecksum();

      return {
        projectType,
        confidence,
        techStack,
        patterns,
        conventions,
        structure,
        dependencies,
        examples,
        timestamp: new Date(),
        checksum
      };
    } catch (error) {
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Detect if project is new or existing
   */
  private async detectProjectType(): Promise<'new' | 'existing'> {
    const sourceFiles = await glob('**/*.{js,jsx,ts,tsx,py,go,rs,java,cs,rb,php}', {
      cwd: this.projectPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'target/**'],
      absolute: false
    });

    return sourceFiles.length < 3 ? 'new' : 'existing';
  }

  /**
   * Detect the technology stack
   */
  private async detectTechStack(): Promise<TechStack> {
    const detector = new TechStackDetector(this.projectPath);
    return await detector.detect();
  }

  /**
   * Extract code patterns
   */
  private async extractPatterns(): Promise<PatternMap> {
    const detector = new PatternDetector(this.projectPath);
    const files = await this.sampleFiles();
    return await detector.detectPatterns(files);
  }

  /**
   * Extract coding conventions
   */
  private async extractConventions(): Promise<ConventionSet> {
    const extractor = new ConventionExtractor(this.projectPath);
    const files = await this.sampleFiles();

    return {
      naming: await extractor.extractNamingConventions(files),
      structure: await extractor.extractStructureConventions(),
      codeStyle: await extractor.extractCodeStyleConventions(files)
    };
  }

  /**
   * Analyze project structure
   */
  private async analyzeStructure(): Promise<ProjectStructure> {
    const analyzer = new StructureAnalyzer(this.projectPath);
    return await analyzer.analyze();
  }

  /**
   * Build dependency graph
   */
  private async buildDependencyGraph(): Promise<DependencyGraph> {
    const builder = new DependencyGraphBuilder(this.projectPath);
    return await builder.build();
  }

  /**
   * Extract code examples from detected patterns
   */
  private async extractCodeExamples(patterns: PatternMap): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];

    for (const [category, patternList] of patterns) {
      for (const pattern of patternList) {
        examples.push(...pattern.examples.slice(0, 2)); // Take top 2 examples per pattern
      }
    }

    return examples;
  }

  /**
   * Sample representative files for analysis
   */
  private async sampleFiles(limit: number = 10): Promise<string[]> {
    const allFiles = await glob('**/*.{js,jsx,ts,tsx,py,go,rs,java,cs,rb,php}', {
      cwd: this.projectPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      absolute: true
    });

    // Sort by modification time (newest first)
    const filesWithStats = await Promise.all(
      allFiles.map(async (file) => ({
        path: file,
        mtime: (await fs.stat(file)).mtime
      }))
    );

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return filesWithStats.slice(0, limit).map(f => f.path);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(data: any): number {
    const weights = {
      techStack: 0.3,
      patterns: 0.3,
      conventions: 0.2,
      examples: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (data.techStack?.confidence) {
      totalScore += data.techStack.confidence * weights.techStack;
      totalWeight += weights.techStack;
    }

    if (data.patterns?.size > 0) {
      totalScore += 0.8 * weights.patterns;
      totalWeight += weights.patterns;
    }

    if (data.conventions) {
      totalScore += 0.7 * weights.conventions;
      totalWeight += weights.conventions;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Generate checksum for cache validation
   */
  private async generateChecksum(): Promise<string> {
    const hash = createHash('sha256');

    // Hash package files
    const packageFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml'];
    for (const file of packageFiles) {
      try {
        const content = await fs.readFile(path.join(this.projectPath, file), 'utf-8');
        hash.update(content);
      } catch {
        // File doesn't exist, skip
      }
    }

    // Hash directory structure
    const dirs = await glob('*/', {
      cwd: this.projectPath,
      ignore: ['node_modules/', '.git/', 'dist/', 'build/']
    });
    hash.update(dirs.join(','));

    return hash.digest('hex');
  }

  /**
   * Handle analysis errors gracefully
   */
  private handleAnalysisError(error: any): AnalysisResult {
    const baseResult: AnalysisResult = {
      projectType: 'new',
      confidence: 0,
      techStack: {
        primaryLanguage: 'unknown',
        languages: [],
        frameworks: {},
        confidence: 0
      },
      patterns: new Map(),
      conventions: {
        naming: {
          files: 'kebab-case',
          variables: 'camelCase',
          functions: 'camelCase',
          classes: 'PascalCase',
          constants: 'UPPER_SNAKE_CASE'
        },
        structure: {
          sourceRoot: 'src',
          testLocation: 'separate',
          configLocation: 'root',
          layout: 'flat'
        },
        codeStyle: {
          indentation: 2,
          quotes: 'single',
          semicolons: true,
          trailingComma: 'es5',
          lineEndings: 'lf',
          bracketStyle: 'same-line'
        }
      },
      structure: {
        rootPath: this.projectPath,
        sourcePaths: [],
        testPaths: [],
        configPaths: [],
        totalFiles: 0,
        totalLines: 0,
        directories: []
      },
      dependencies: {
        nodes: [],
        edges: []
      },
      examples: [],
      timestamp: new Date(),
      checksum: '',
      errors: [
        {
          code: 'ANALYSIS_FAILED',
          message: error.message || 'Unknown analysis error',
          severity: 'error',
          suggestions: [
            'Ensure the project path is correct',
            'Check that source files exist',
            'Verify file permissions'
          ]
        }
      ]
    };

    return baseResult;
  }
}

// Supporting Classes (stubs for now, would be implemented fully)
class TechStackDetector {
  constructor(private projectPath: string) {}
  async detect(): Promise<TechStack> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
}

class PatternDetector {
  constructor(private projectPath: string) {}
  async detectPatterns(files: string[]): Promise<PatternMap> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
}

class ConventionExtractor {
  constructor(private projectPath: string) {}
  async extractNamingConventions(files: string[]): Promise<NamingConvention> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
  async extractStructureConventions(): Promise<StructureConvention> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
  async extractCodeStyleConventions(files: string[]): Promise<CodeStyleConvention> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
}

class StructureAnalyzer {
  constructor(private projectPath: string) {}
  async analyze(): Promise<ProjectStructure> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
}

class DependencyGraphBuilder {
  constructor(private projectPath: string) {}
  async build(): Promise<DependencyGraph> {
    // Implementation would go here
    throw new Error('Not implemented');
  }
}