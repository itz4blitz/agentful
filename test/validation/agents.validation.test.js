import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const agentsDir = path.join(projectRoot, 'template', '.claude', 'agents');

/**
 * Agent Metadata Validation Tests
 *
 * Validates that all agent markdown files have:
 * - Valid YAML frontmatter
 * - Required metadata fields
 * - Proper structure and content
 */

describe('Agent Metadata Validation', () => {
  let agentFiles = [];

  // Find all agent markdown files
  if (fs.existsSync(agentsDir)) {
    agentFiles = fs.readdirSync(agentsDir)
      .filter(file => file.endsWith('.md') && file !== 'README.md')
      .map(file => ({
        name: file,
        path: path.join(agentsDir, file)
      }));
  }

  describe('agent files exist', () => {
    it('should have agents directory', () => {
      expect(fs.existsSync(agentsDir)).toBe(true);
    });

    it('should have at least one agent file', () => {
      expect(agentFiles.length).toBeGreaterThan(0);
    });

    it('should have core agents', () => {
      const agentNames = agentFiles.map(f => f.name);

      // Core agents that should always exist
      const coreAgents = [
        'orchestrator.md',
        'frontend.md',
        'backend.md',
        'tester.md',
        'reviewer.md'
      ];

      coreAgents.forEach(agent => {
        expect(agentNames).toContain(agent);
      });
    });
  });

  describe('frontmatter validation', () => {
    agentFiles.forEach(({ name, path: filePath }) => {
      describe(name, () => {
        let content;
        let frontmatter;

        it('should be readable', () => {
          expect(() => {
            content = fs.readFileSync(filePath, 'utf-8');
          }).not.toThrow();
        });

        it('should have YAML frontmatter', () => {
          content = fs.readFileSync(filePath, 'utf-8');

          // Check for frontmatter delimiters
          expect(content).toMatch(/^---\n/);
          expect(content).toMatch(/\n---\n/);
        });

        it('should have valid YAML frontmatter', () => {
          content = fs.readFileSync(filePath, 'utf-8');

          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          expect(frontmatterMatch).toBeTruthy();

          const yamlContent = frontmatterMatch[1];
          expect(() => {
            frontmatter = yaml.load(yamlContent);
          }).not.toThrow();
        });

        it('should have required metadata fields', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter).toHaveProperty('name');
          expect(frontmatter).toHaveProperty('description');
        });

        it('should have valid name field', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter.name).toBeTruthy();
          expect(typeof frontmatter.name).toBe('string');
          expect(frontmatter.name.length).toBeGreaterThan(0);
          // Name should be lowercase, alphanumeric with hyphens
          expect(frontmatter.name).toMatch(/^[a-z0-9-]+$/);
        });

        it('should have valid description field', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter.description).toBeTruthy();
          expect(typeof frontmatter.description).toBe('string');
          expect(frontmatter.description.length).toBeGreaterThan(0);
          expect(frontmatter.description.length).toBeLessThanOrEqual(200);
        });

        it('should have model field if specified', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          if (frontmatter.model) {
            expect(typeof frontmatter.model).toBe('string');
            // Common model types
            const validModels = ['sonnet', 'opus', 'haiku', 'auto'];
            expect(validModels).toContain(frontmatter.model);
          }
        });

        it('should have tools field if specified', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          if (frontmatter.tools) {
            expect(typeof frontmatter.tools).toBe('string');
            // Should list common tools
            const commonTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'];
            const hasCommonTool = commonTools.some(tool => frontmatter.tools.includes(tool));
            expect(hasCommonTool).toBe(true);
          }
        });

        it('should match filename to agent name', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          const expectedName = name.replace('.md', '');
          expect(frontmatter.name).toBe(expectedName);
        });
      });
    });
  });

  describe('markdown content validation', () => {
    agentFiles.forEach(({ name, path: filePath }) => {
      describe(name, () => {
        let markdownBody;

        it('should have content after frontmatter', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Extract frontmatter and body more reliably
          // Match only the frontmatter at the very start of the file
          const frontmatterEnd = content.indexOf('\n---\n', 4); // Start after first '---\n'
          expect(frontmatterEnd).toBeGreaterThan(0);

          markdownBody = content.substring(frontmatterEnd + 5); // Skip past '\n---\n'
          expect(markdownBody.trim().length).toBeGreaterThan(0);
        });

        it('should have a primary heading matching agent name', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Extract frontmatter and body reliably
          const frontmatterEnd = content.indexOf('\n---\n', 4);
          markdownBody = content.substring(frontmatterEnd + 5);

          // Extract frontmatter to get name
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          const frontmatter = yaml.load(frontmatterMatch[1]);

          // Check that primary heading exists and references the agent
          // More flexible than exact match to allow variations like "agentful Orchestrator"
          const headingMatch = markdownBody.match(/^# (.+)$/m);
          expect(headingMatch).toBeTruthy();

          const heading = headingMatch[1].toLowerCase();
          const agentName = frontmatter.name.replace(/-/g, ' ');

          // Heading should contain the agent name (or major part of it)
          const nameWords = agentName.split(' ');
          const hasNameReference = nameWords.some(word =>
            word.length > 3 && heading.includes(word.toLowerCase())
          );
          expect(hasNameReference).toBe(true);
        });

        it('should have scope section', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterEnd = content.indexOf('\n---\n', 4);
          markdownBody = content.substring(frontmatterEnd + 5);

          // Accept various scope section names: "Your Scope", "Your Role", "Your Process", "Your Checks"
          expect(markdownBody).toMatch(/## Your (Scope|Role|Process|Checks)/i);
        });

        it('should have rules section', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterEnd = content.indexOf('\n---\n', 4);
          markdownBody = content.substring(frontmatterEnd + 5);

          expect(markdownBody).toMatch(/##\s+(Important\s+)?Rules/i);
        });

        it('should have substantive content (>500 chars)', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterEnd = content.indexOf('\n---\n', 4);
          markdownBody = content.substring(frontmatterEnd + 5);

          expect(markdownBody.trim().length).toBeGreaterThan(500);
        });

        it('should mention NOT in scope', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterEnd = content.indexOf('\n---\n', 4);
          markdownBody = content.substring(frontmatterEnd + 5);

          // Agents should clearly define what they DON'T do
          expect(markdownBody).toMatch(/NOT Your Scope|NOT in scope|not your responsibility/i);
        });

        it('should use bullet points for lists', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterEnd = content.indexOf('\n---\n', 4);
          markdownBody = content.substring(frontmatterEnd + 5);

          // Should have at least some bullet points
          expect(markdownBody).toMatch(/^- /m);
        });
      });
    });
  });

  describe('agent-specific validation', () => {
    it('orchestrator should mention delegation', () => {
      const orchestratorPath = path.join(agentsDir, 'orchestrator.md');
      if (fs.existsSync(orchestratorPath)) {
        const content = fs.readFileSync(orchestratorPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/delegate|delegation|task|agent/);
      }
    });

    it('frontend should mention UI components', () => {
      const frontendPath = path.join(agentsDir, 'frontend.md');
      if (fs.existsSync(frontendPath)) {
        const content = fs.readFileSync(frontendPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/component|ui|interface|react|vue|svelte/);
      }
    });

    it('backend should mention API or database', () => {
      const backendPath = path.join(agentsDir, 'backend.md');
      if (fs.existsSync(backendPath)) {
        const content = fs.readFileSync(backendPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/api|database|endpoint|service|repository/);
      }
    });

    it('tester should mention tests or coverage', () => {
      const testerPath = path.join(agentsDir, 'tester.md');
      if (fs.existsSync(testerPath)) {
        const content = fs.readFileSync(testerPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/test|coverage|unit|integration|e2e/);
      }
    });

    it('reviewer should mention quality or validation', () => {
      const reviewerPath = path.join(agentsDir, 'reviewer.md');
      if (fs.existsSync(reviewerPath)) {
        const content = fs.readFileSync(reviewerPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/quality|review|validate|lint|check/);
      }
    });
  });

  describe('consistency across agents', () => {
    it('all agents should use consistent frontmatter format', () => {
      const frontmatters = agentFiles.map(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        return yaml.load(match[1]);
      });

      // All should have same required fields
      frontmatters.forEach(fm => {
        expect(fm).toHaveProperty('name');
        expect(fm).toHaveProperty('description');
      });
    });

    it('all agents should define delegation boundaries', () => {
      agentFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Each agent should clearly define what to delegate
        // by mentioning other agents with @ prefix or by name
        const hasDelegationMention =
          content.includes('@frontend') ||
          content.includes('@backend') ||
          content.includes('@tester') ||
          content.includes('@reviewer') ||
          content.match(/delegate to|Task\(/) !== null;

        // Allow some agents (like orchestrator) to not delegate
        // but most should mention delegation or scope
        if (!filePath.includes('orchestrator')) {
          expect(
            hasDelegationMention || content.includes('NOT Your Scope')
          ).toBe(true);
        }
      });
    });

    it('all agents should use consistent heading structure', () => {
      agentFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parts = content.split(/^---\n[\s\S]*?\n---\n/m);
        const markdownBody = parts[1];

        // Should use ATX-style headings (# ##) consistently
        const headingLevels = markdownBody.match(/^#{1,6} /gm) || [];
        expect(headingLevels.length).toBeGreaterThan(2);
      });
    });
  });

  describe('code examples', () => {
    agentFiles.forEach(({ name, path: filePath }) => {
      describe(name, () => {
        it('should have properly formatted code blocks', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Count all code fences (both opening and closing)
          const allFences = (content.match(/^```/gm) || []).length;

          // Code fences should come in pairs (even number)
          if (allFences > 0) {
            expect(allFences % 2).toBe(0);
          }
        });

        it('should specify language for code blocks', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Find all code fence openings
          const codeFences = content.match(/^```[\w]*$/gm) || [];

          if (codeFences.length > 0) {
            // At least 30% should have language specified (allow plain blocks for output, examples)
            const withLanguage = codeFences.filter(fence => fence.length > 3).length;
            expect(withLanguage / codeFences.length).toBeGreaterThan(0.3);
          }
        });
      });
    });
  });

  describe('documentation quality', () => {
    agentFiles.forEach(({ name, path: filePath }) => {
      describe(name, () => {
        it('should not have TODO comments', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Should not have actual unfinished work
          // But allow documentation that mentions TODO in examples or warnings
          const lines = content.split('\n');
          const actualTodos = lines.filter(line => {
            const hasTodo = /TODO:|FIXME:|XXX:/i.test(line);
            // Allow if it's in a code example, quote, or documentation about TODOs
            const isExample = line.includes('`') || line.includes('//') || line.includes('Don\'t') || line.includes('don\'t');
            return hasTodo && !isExample;
          });

          expect(actualTodos.length).toBe(0);
        });

        it('should not have placeholder text', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Should not have obvious placeholders (but allow explanatory text about placeholders)
          // Check for actual placeholder usage, not documentation about placeholders
          expect(content).not.toMatch(/\[INSERT|<INSERT|TBD/i);

          // Allow "placeholder" in documentation context (e.g., "has placeholder values")
          // but not as an actual placeholder like "PLACEHOLDER_VALUE" or "[PLACEHOLDER]"
          const actualPlaceholders = content.match(/\[PLACEHOLDER\]|PLACEHOLDER_[A-Z_]+|<PLACEHOLDER>/i);
          expect(actualPlaceholders).toBeNull();
        });

        it('should have consistent list formatting', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // If using numbered lists, they should be consistent
          const numberedLists = content.match(/^\d+\. /gm);
          if (numberedLists && numberedLists.length > 1) {
            // Should start with 1.
            expect(content).toMatch(/^1\. /m);
          }
        });
      });
    });
  });
});
