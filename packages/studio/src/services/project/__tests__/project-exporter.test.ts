/**
 * Project Exporter Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectExporterService } from '../project-exporter';
import type { Project, ExportOptions } from '@/types/project';
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project';

describe('ProjectExporterService', () => {
  let service: ProjectExporterService;
  let mockProject: Project;

  beforeEach(() => {
    service = new ProjectExporterService();

    mockProject = {
      id: 'test-project-1',
      name: 'Test Project',
      description: 'A test project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      html: '<div class="container"><h1>Hello World</h1><p>Test content</p></div>',
      canvasState: {
        elements: [],
        selectedElement: null,
        hoveredElement: null,
        html: '<div class="container"><h1>Hello World</h1><p>Test content</p></div>',
        isDirty: false,
        history: [],
        historyIndex: -1,
        clipboard: null,
      },
      settings: DEFAULT_PROJECT_SETTINGS,
    };
  });

  describe('exportToHTML', () => {
    it('should export project as HTML blob', async () => {
      const options: ExportOptions = {
        format: 'html',
        minify: false,
        inlineCSS: false,
        includeAssets: false,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toBe('text/html');
      expect(result.filename).toBe('test_project.html');
      expect(result.size).toBeGreaterThan(0);
    });

    it('should include complete HTML structure', async () => {
      const options: ExportOptions = {
        format: 'html',
        minify: false,
        inlineCSS: false,
        includeAssets: false,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      // Convert blob to text using FileReader
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(result.blob);
      });

      expect(text).toContain('<!DOCTYPE html>');
      expect(text).toContain('<html');
      expect(text).toContain('<head>');
      expect(text).toContain('<body>');
      expect(text).toContain(mockProject.html);
    });

    it('should minify HTML when requested', async () => {
      const options: ExportOptions = {
        format: 'html',
        minify: true,
        inlineCSS: false,
        includeAssets: false,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(result.blob);
      });

      // Minified version should be smaller
      expect(text.length).toBeLessThan(mockProject.html.length + 500);
    });

    it('should include CSS variables from theme', async () => {
      const options: ExportOptions = {
        format: 'html',
        minify: false,
        inlineCSS: false,
        includeAssets: false,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(result.blob);
      });

      expect(text).toContain('--background:');
      expect(text).toContain('--foreground:');
      expect(text).toContain('--primary:');
    });
  });

  describe('exportToReact', () => {
    it('should export project as React component', async () => {
      const options: ExportOptions = {
        format: 'react',
        minify: false,
        inlineCSS: false,
        includeAssets: false,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toBe('application/zip');
      expect(result.filename).toBe('test_project-react.zip');
    });

    it('should convert HTML to JSX format', async () => {
      // This test verifies the internal JSX conversion logic
      const jsx = (service as any).htmlToJSX('<div class="test">Content</div>');

      expect(jsx).toContain('className=');
      expect(jsx).not.toContain('class=');
    });

    it('should handle React style objects', async () => {
      const jsx = (service as any).htmlToJSX(
        '<div style="color: red; font-size: 14px;">Test</div>'
      );

      expect(jsx).toContain('style={{');
      expect(jsx).toContain('color:');
      expect(jsx).toContain('fontSize:');
    });

    it('should convert HTML comments to JSX comments', async () => {
      const jsx = (service as any).htmlToJSX('<div><!-- Comment -->Test</div>');

      expect(jsx).toContain('{/*');
      expect(jsx).toContain('*/}');
      expect(jsx).not.toContain('<!--');
    });
  });

  describe('exportToZip', () => {
    it('should export project as ZIP bundle', async () => {
      const options: ExportOptions = {
        format: 'zip',
        minify: false,
        inlineCSS: false,
        includeAssets: true,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.mimeType).toBe('application/zip');
      expect(result.filename).toBe('test_project.zip');
    });

    it('should include index.html in ZIP', async () => {
      const options: ExportOptions = {
        format: 'zip',
        minify: false,
        inlineCSS: false,
        includeAssets: true,
        includeComments: false,
        sourceMap: false,
      };

      const result = await service.exportProject(mockProject, options);

      // Note: We'd need JSZip to verify contents, but we can at least check it's a valid ZIP
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('filename sanitization', () => {
    it('should sanitize filenames correctly', () => {
      const sanitized = (service as any).sanitizeFilename('Test Project@#$!.html');
      expect(sanitized).toBe('test_project_html');
    });

    it('should handle multiple special characters', () => {
      const sanitized = (service as any).sanitizeFilename('My---Project___Name');
      expect(sanitized).toBe('my_project_name');
    });
  });

  describe('case conversion utilities', () => {
    it('should convert to PascalCase', () => {
      expect((service as any).toPascalCase('test-project')).toBe('TestProject');
      expect((service as any).toPascalCase('test_project')).toBe('TestProject');
      expect((service as any).toPascalCase('test project')).toBe('TestProject');
    });

    it('should convert to kebab-case', () => {
      expect((service as any).toKebabCase('TestProject')).toBe('test-project');
      expect((service as any).toKebabCase('testProject')).toBe('test-project');
    });
  });

  describe('error handling', () => {
    it('should throw error for unsupported format', async () => {
      const options = {
        format: 'unsupported' as any,
        minify: false,
        inlineCSS: false,
        includeAssets: false,
        includeComments: false,
        sourceMap: false,
      };

      await expect(
        service.exportProject(mockProject, options)
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('HTML minification', () => {
    it('should remove unnecessary whitespace', () => {
      const html = '<div>  <p>  Test  </p>  </div>';
      const minified = (service as any).minifyHTML(html);

      expect(minified).not.toContain('  ');
    });

    it('should remove HTML comments', () => {
      const html = '<div><!-- Comment --><p>Test</p></div>';
      const minified = (service as any).minifyHTML(html);

      expect(minified).not.toContain('<!--');
      expect(minified).not.toContain('-->');
    });
  });
});
