/**
 * Project Importer Service
 * Handles importing projects from HTML, React components, or ZIP archives
 */

import JSZip from 'jszip';
import { nanoid } from 'nanoid';
import type { Project, ImportResult, ProjectValidationResult } from '@/types/project';
import { DEFAULT_PROJECT_SETTINGS } from '@/types/project';
import { projectStorageService } from './project-storage';

/**
 * Project Importer Service
 */
export class ProjectImporterService {
  /**
   * Import project from file
   */
  async importFile(file: File): Promise<ImportResult> {
    const fileType = this.detectFileType(file);

    switch (fileType) {
      case 'html':
        return this.importHTML(file);
      case 'react':
        return this.importReact(file);
      case 'zip':
        return this.importZip(file);
      default:
        return {
          success: false,
          errors: [`Unsupported file type: ${fileType}`],
        };
    }
  }

  /**
   * Detect file type
   */
  private detectFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'html' || extension === 'htm') {
      return 'html';
    }

    if (extension === 'tsx' || extension === 'jsx') {
      return 'react';
    }

    if (extension === 'zip') {
      return 'zip';
    }

    return 'unknown';
  }

  /**
   * Import from HTML file
   */
  private async importHTML(file: File): Promise<ImportResult> {
    try {
      const html = await file.text();
      const validation = this.validateHTML(html);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Extract title from HTML
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : file.name.replace(/\.(html|htm)$/i, '');

      // Create project
      const project = await projectStorageService.createProject(
        title,
        `Imported from ${file.name}`,
        {
          html,
          canvasState: {
            elements: [],
            selectedElement: null,
            hoveredElement: null,
            html,
            isDirty: false,
            history: [],
            historyIndex: -1,
            clipboard: null,
          },
        }
      );

      return {
        success: true,
        project,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import HTML file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import from React component
   */
  private async importReact(file: File): Promise<ImportResult> {
    try {
      const code = await file.text();
      const validation = this.validateReactComponent(code);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Extract component name
      const componentNameMatch = code.match(/(?:const|function|class)\s+(\w+)/);
      const componentName = componentNameMatch ? componentNameMatch[1] : 'Component';

      // Extract JSX/template HTML
      const html = this.extractHTMLFromReact(code);

      // Create project
      const project = await projectStorageService.createProject(
        componentName,
        `Imported from ${file.name}`,
        {
          html,
          canvasState: {
            elements: [],
            selectedElement: null,
            hoveredElement: null,
            html,
            isDirty: false,
            history: [],
            historyIndex: -1,
            clipboard: null,
          },
        }
      );

      return {
        success: true,
        project,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import React component: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import from ZIP archive
   */
  private async importZip(file: File): Promise<ImportResult> {
    try {
      const zip = await JSZip.loadAsync(file);
      const files = Object.keys(zip.files);

      // Check for index.html (HTML export)
      if (files.includes('index.html')) {
        return await this.importZipHTML(zip, file.name);
      }

      // Check for React files (React export)
      const tsxFiles = files.filter((f) => f.endsWith('.tsx'));
      if (tsxFiles.length > 0) {
        return await this.importZipReact(zip, tsxFiles, file.name);
      }

      // Check for project.json (Visual Builder export)
      if (files.includes('project.json')) {
        return await this.importZipProject(zip, file.name);
      }

      return {
        success: false,
        errors: ['ZIP archive does not contain recognized project files'],
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import HTML from ZIP
   */
  private async importZipHTML(zip: JSZip, filename: string): Promise<ImportResult> {
    try {
      const indexHtml = await zip.file('index.html')?.async('string');
      if (!indexHtml) {
        return {
          success: false,
          errors: ['index.html not found in archive'],
        };
      }

      // Check for project metadata
      let name = filename.replace('.zip', '');
      let description = 'Imported from ZIP archive';

      const projectJson = zip.file('project.json');
      if (projectJson) {
        try {
          const metadata = JSON.parse(await projectJson.async('string'));
          name = metadata.name || name;
          description = metadata.description || description;
        } catch {
          // Ignore metadata parse errors
        }
      }

      const project = await projectStorageService.createProject(name, description, {
        html: indexHtml,
        canvasState: {
          elements: [],
          selectedElement: null,
          hoveredElement: null,
          html: indexHtml,
          isDirty: false,
          history: [],
          historyIndex: -1,
          clipboard: null,
        },
      });

      return {
        success: true,
        project,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import HTML from ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import React from ZIP
   */
  private async importZipReact(
    zip: JSZip,
    tsxFiles: string[],
    filename: string
  ): Promise<ImportResult> {
    try {
      // Find main component file (usually the first .tsx or matches name)
      const mainFile = tsxFiles[0];
      const code = await zip.file(mainFile)?.async('string');

      if (!code) {
        return {
          success: false,
          errors: ['Failed to read React component from ZIP'],
        };
      }

      const componentNameMatch = code.match(/(?:const|function|class)\s+(\w+)/);
      const componentName = componentNameMatch ? componentNameMatch[1] : 'Component';

      const html = this.extractHTMLFromReact(code);

      const project = await projectStorageService.createProject(
        componentName,
        `Imported from ${filename}`,
        {
          html,
          canvasState: {
            elements: [],
            selectedElement: null,
            hoveredElement: null,
            html,
            isDirty: false,
            history: [],
            historyIndex: -1,
            clipboard: null,
          },
        }
      );

      return {
        success: true,
        project,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import React from ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import Visual Builder project from ZIP
   */
  private async importZipProject(zip: JSZip, filename: string): Promise<ImportResult> {
    try {
      const projectJsonContent = await zip.file('project.json')?.async('string');
      if (!projectJsonContent) {
        return {
          success: false,
          errors: ['project.json not found in archive'],
        };
      }

      const metadata = JSON.parse(projectJsonContent);
      const indexHtml = await zip.file('index.html')?.async('string');

      if (!indexHtml) {
        return {
          success: false,
          errors: ['index.html not found in archive'],
        };
      }

      const project = await projectStorageService.createProject(
        metadata.name || filename.replace('.zip', ''),
        metadata.description,
        {
          html: indexHtml,
          canvasState: metadata.canvasState || {
            elements: [],
            selectedElement: null,
            hoveredElement: null,
            html: indexHtml,
            isDirty: false,
            history: [],
            historyIndex: -1,
            clipboard: null,
          },
          settings: metadata.settings || DEFAULT_PROJECT_SETTINGS,
        }
      );

      return {
        success: true,
        project,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import project from ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Validate HTML content
   */
  private validateHTML(html: string): ProjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for basic HTML structure
    if (!html.includes('<html') && !html.includes('<body')) {
      warnings.push('HTML fragment detected (missing <html> or <body> tags)');
    }

    // Check for unclosed tags (basic check)
    const openTags = (html.match(/<(\w+)[^>]*>/g) || []).length;
    const closeTags = (html.match(/<\/(\w+)>/g) || []).length;

    if (Math.abs(openTags - closeTags) > 5) {
      warnings.push('Possible unclosed HTML tags detected');
    }

    // Check for potentially dangerous content
    if (html.includes('<script')) {
      warnings.push('HTML contains <script> tags - review for safety');
    }

    if (html.includes('javascript:')) {
      errors.push('HTML contains potentially dangerous javascript: links');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate React component
   */
  private validateReactComponent(code: string): ProjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for React import
    if (!code.includes('import React') && !code.includes('from \'react\'')) {
      warnings.push('React import not found - may not be a React component');
    }

    // Check for component definition
    if (!code.match(/(?:const|function|class)\s+\w+/)) {
      errors.push('No component definition found');
    }

    // Check for JSX
    if (!code.match(/<[\w]+/)) {
      warnings.push('No JSX found - may not be a React component');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Extract HTML from React component
   */
  private extractHTMLFromReact(code: string): string {
    // Extract JSX from return statement
    const returnMatch = code.match(/return\s*\([\s\S]*?\)/);
    if (returnMatch) {
      let jsx = returnMatch[0].replace(/return\s*\(/, '').replace(/\)$/, '');

      // Convert JSX back to HTML
      jsx = jsx
        .replace(/className=/g, 'class=')
        .replace(/htmlFor=/g, 'for=')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // Remove comments
        .replace(/\{[^}]*\}/g, '') // Remove expressions
        .trim();

      return jsx;
    }

    // Fallback: extract from first JSX element
    const jsxMatch = code.match(/<[\w]+[^>]*>[\s\S]*?<\/[\w]+>/);
    if (jsxMatch) {
      return jsxMatch[0]
        .replace(/className=/g, 'class=')
        .replace(/htmlFor=/g, 'for=')
        .trim();
    }

    return '<div>Imported content</div>';
  }

  /**
   * Import project from JSON (clipboard/paste)
   */
  async importFromJSON(jsonString: string): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonString);

      // Validate project structure
      if (!data.id || !data.name || !data.html) {
        return {
          success: false,
          errors: ['Invalid project JSON: missing required fields'],
        };
      }

      // Create new project with imported data (generate new ID)
      const project = await projectStorageService.createProject(
        `${data.name} (Imported)`,
        data.description || 'Imported from JSON',
        {
          html: data.html,
          canvasState: data.canvasState || {
            elements: [],
            selectedElement: null,
            hoveredElement: null,
            html: data.html,
            isDirty: false,
            history: [],
            historyIndex: -1,
            clipboard: null,
          },
          settings: data.settings || DEFAULT_PROJECT_SETTINGS,
        }
      );

      return {
        success: true,
        project,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * Import project from URL
   */
  async importFromURL(url: string): Promise<ImportResult> {
    try {
      // Fetch HTML from URL
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const validation = this.validateHTML(html);

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Extract domain/path as name
      const urlObj = new URL(url);
      const name = urlObj.hostname.replace('www.', '');

      const project = await projectStorageService.createProject(
        name,
        `Imported from ${url}`,
        {
          html,
          canvasState: {
            elements: [],
            selectedElement: null,
            hoveredElement: null,
            html,
            isDirty: false,
            history: [],
            historyIndex: -1,
            clipboard: null,
          },
        }
      );

      return {
        success: true,
        project,
        warnings: [...validation.warnings, 'External assets may not be included'],
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Failed to import from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }
}

// Singleton instance
export const projectImporterService = new ProjectImporterService();
