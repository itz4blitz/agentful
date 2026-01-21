import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const commandsDir = path.join(projectRoot, 'template', '.claude', 'commands');

/**
 * Command Markdown Validation Tests
 *
 * Validates that all command markdown files follow the correct structure:
 * - YAML frontmatter with required fields
 * - Proper markdown formatting
 * - Required sections
 */

describe('Command Markdown Validation', () => {
  let commandFiles = [];

  // Find all command markdown files
  if (fs.existsSync(commandsDir)) {
    commandFiles = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        name: file,
        path: path.join(commandsDir, file)
      }));
  }

  describe('command files exist', () => {
    it('should have commands directory', () => {
      expect(fs.existsSync(commandsDir)).toBe(true);
    });

    it('should have at least one command file', () => {
      expect(commandFiles.length).toBeGreaterThan(0);
    });

    it('should have core agentful commands', () => {
      const commandNames = commandFiles.map(f => f.name);

      expect(commandNames).toContain('agentful.md');
      expect(commandNames).toContain('agentful-start.md');
      expect(commandNames).toContain('agentful-status.md');
      expect(commandNames).toContain('agentful-validate.md');
    });
  });

  describe('frontmatter validation', () => {
    commandFiles.forEach(({ name, path: filePath }) => {
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

        it('should have required frontmatter fields', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter).toHaveProperty('name');
          expect(frontmatter).toHaveProperty('description');
        });

        it('should have non-empty name', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter.name).toBeTruthy();
          expect(typeof frontmatter.name).toBe('string');
          expect(frontmatter.name.length).toBeGreaterThan(0);
        });

        it('should have non-empty description', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter.description).toBeTruthy();
          expect(typeof frontmatter.description).toBe('string');
          expect(frontmatter.description.length).toBeGreaterThan(0);
        });

        it('should have description under 200 characters', () => {
          content = fs.readFileSync(filePath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          frontmatter = yaml.load(frontmatterMatch[1]);

          expect(frontmatter.description.length).toBeLessThanOrEqual(200);
        });
      });
    });
  });

  describe('markdown body validation', () => {
    commandFiles.forEach(({ name, path: filePath }) => {
      describe(name, () => {
        let markdownBody;

        it('should have content after frontmatter', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parts = content.split(/^---\n[\s\S]*?\n---\n/m);

          expect(parts.length).toBeGreaterThan(1);
          markdownBody = parts[1];
          expect(markdownBody.trim().length).toBeGreaterThan(0);
        });

        it('should have a primary heading', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parts = content.split(/^---\n[\s\S]*?\n---\n/m);
          markdownBody = parts[1];

          // Should have # heading
          expect(markdownBody).toMatch(/^# /m);
        });

        it('should not have multiple top-level headings', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parts = content.split(/^---\n[\s\S]*?\n---\n/m);
          markdownBody = parts[1];

          const topLevelHeadings = markdownBody.match(/^# .+$/gm) || [];
          expect(topLevelHeadings.length).toBeLessThanOrEqual(1);
        });

        it('should have at least one section (## heading)', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parts = content.split(/^---\n[\s\S]*?\n---\n/m);
          markdownBody = parts[1];

          const sections = markdownBody.match(/^## .+$/gm) || [];
          expect(sections.length).toBeGreaterThan(0);
        });

        it('should not have overly long lines', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parts = content.split(/^---\n[\s\S]*?\n---\n/m);
          markdownBody = parts[1];

          const lines = markdownBody.split('\n');
          const longLines = lines.filter(line => {
            // Ignore code blocks and URLs
            if (line.trim().startsWith('```')) return false;
            if (line.trim().startsWith('http')) return false;
            return line.length > 120;
          });

          // Allow some long lines, but not too many
          expect(longLines.length).toBeLessThan(lines.length * 0.1);
        });
      });
    });
  });

  describe('command-specific validation', () => {
    it('agentful.md should mention natural language', () => {
      const agentfulPath = path.join(commandsDir, 'agentful.md');
      if (fs.existsSync(agentfulPath)) {
        const content = fs.readFileSync(agentfulPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/natural|conversation|chat/);
      }
    });

    it('agentful-start.md should mention workflow', () => {
      const startPath = path.join(commandsDir, 'agentful-start.md');
      if (fs.existsSync(startPath)) {
        const content = fs.readFileSync(startPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/workflow|process|step/);
      }
    });

    it('agentful-validate.md should mention quality checks', () => {
      const validatePath = path.join(commandsDir, 'agentful-validate.md');
      if (fs.existsSync(validatePath)) {
        const content = fs.readFileSync(validatePath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/test|lint|check|quality|validation/);
      }
    });

    it('agentful-status.md should mention progress', () => {
      const statusPath = path.join(commandsDir, 'agentful-status.md');
      if (fs.existsSync(statusPath)) {
        const content = fs.readFileSync(statusPath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/progress|status|completion|percentage/);
      }
    });
  });

  describe('markdown formatting', () => {
    commandFiles.forEach(({ name, path: filePath }) => {
      describe(name, () => {
        it('should use consistent heading style', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parts = content.split(/^---\n[\s\S]*?\n---\n/m);
          const markdownBody = parts[1];

          // Should use ATX-style headings (# ##) not Setext (underlines)
          expect(markdownBody).not.toMatch(/^.+\n=+$/m);
          expect(markdownBody).not.toMatch(/^.+\n-+$/m);
        });

        it('should have proper code block syntax', () => {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Count all code fences (opening and closing)
          const allFences = (content.match(/^```/gm) || []).length;

          // Every code block needs an opening and closing fence
          // So total fences should be even
          if (allFences > 0) {
            expect(allFences % 2).toBe(0);
          }
        });

        it('should not have trailing whitespace', () => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          const linesWithTrailingSpace = lines.filter(line => line.match(/\s+$/));

          // Allow some trailing whitespace, but not excessive
          expect(linesWithTrailingSpace.length).toBeLessThan(lines.length * 0.05);
        });
      });
    });
  });

  describe('consistency across commands', () => {
    it('all commands should use consistent frontmatter format', () => {
      const frontmatters = commandFiles.map(({ path: filePath }) => {
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

    it('command names should match filenames', () => {
      commandFiles.forEach(({ name, path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = yaml.load(match[1]);

        const expectedName = name.replace('.md', '');
        expect(frontmatter.name).toBe(expectedName);
      });
    });
  });
});
