import { CodePattern, ErrorFix } from '../../src/types/index.js';

/**
 * Fixture Builder
 * - Creates test data for patterns and error fixes
 * - Deterministic generation for consistent tests
 */
export class FixtureBuilder {
  /**
   * Create test pattern
   */
  static createPattern(overrides: Partial<CodePattern> = {}): CodePattern {
    const id = overrides.id || `pattern-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      code: overrides.code || `// Test pattern code for ${id}`,
      tech_stack: overrides.tech_stack || 'next.js@14+typescript',
      success_rate: overrides.success_rate ?? 0.5,
      ...overrides
    };
  }

  /**
   * Create batch of test patterns
   */
  static createPatternBatch(count: number, overrides: Partial<CodePattern> = {}): CodePattern[] {
    return Array.from({ length: count }, (_, i) =>
      this.createPattern({
        ...overrides,
        id: `pattern-${i}`,
        code: `// Test pattern ${i}`
      })
    );
  }

  /**
   * Create test error fix
   */
  static createErrorFix(overrides: Partial<ErrorFix> = {}): ErrorFix {
    const id = overrides.id || `error-fix-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      error_message: overrides.error_message || `Test error message for ${id}`,
      fix_code: overrides.fix_code || `// Fix code for ${id}`,
      tech_stack: overrides.tech_stack || 'next.js@14+typescript',
      success_rate: overrides.success_rate ?? 0.5,
      ...overrides
    };
  }

  /**
   * Create batch of test error fixes
   */
  static createErrorFixBatch(count: number, overrides: Partial<ErrorFix> = {}): ErrorFix[] {
    return Array.from({ length: count }, (_, i) =>
      this.createErrorFix({
        ...overrides,
        id: `error-fix-${i}`,
        error_message: `Test error ${i}`,
        fix_code: `// Fix code ${i}`
      })
    );
  }
}
