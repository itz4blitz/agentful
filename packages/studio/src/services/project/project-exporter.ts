/**
 * Project Exporter Service
 * Handles exporting projects to HTML, React, or ZIP format
 */

import JSZip from 'jszip';
import type { Project, ExportOptions, ExportResult } from '@/types/project';
import type { CanvasElement } from '@/types/canvas';

/**
 * Project Exporter Service
 */
export class ProjectExporterService {
  /**
   * Export project with specified options
   */
  async exportProject(project: Project, options: ExportOptions): Promise<ExportResult> {
    switch (options.format) {
      case 'html':
        return this.exportToHTML(project, options);
      case 'react':
        return this.exportToReact(project, options);
      case 'zip':
        return this.exportToZip(project, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export to standalone HTML
   */
  private async exportToHTML(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    let html = project.html;

    // Add document structure
    const fullHtml = this.buildFullHTML(
      html,
      project.name,
      project.settings.theme,
      options
    );

    // Apply minification if requested
    const finalHtml = options.minify ? this.minifyHTML(fullHtml) : fullHtml;

    const blob = new Blob([finalHtml], { type: 'text/html' });
    const filename = this.sanitizeFilename(`${project.name}.html`);

    return {
      blob,
      filename,
      mimeType: 'text/html',
      size: blob.size,
    };
  }

  /**
   * Export to React component
   */
  private async exportToReact(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const componentCode = this.generateReactComponent(
      project.html,
      project.name,
      options
    );

    const stylesCode = this.generateReactStyles(project.settings.theme, options);

    // Create a multi-file export
    const files = {
      [`${project.name}.tsx`]: componentCode,
      [`${project.name}.module.css`]: stylesCode,
      'index.ts': `export { ${this.toPascalCase(project.name)} } from './${project.name}';`,
    };

    // If single file requested, combine them
    if (options.inlineCSS) {
      const combinedCode = this.combineReactFiles(componentCode, stylesCode);
      const blob = new Blob([combinedCode], { type: 'text/typescript' });
      const filename = this.sanitizeFilename(`${project.name}.tsx`);

      return {
        blob,
        filename,
        mimeType: 'text/typescript',
        size: blob.size,
      };
    }

    // Otherwise export as ZIP (will be handled by exportToZip)
    const zip = new JSZip();
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = this.sanitizeFilename(`${project.name}-react.zip`);

    return {
      blob,
      filename,
      mimeType: 'application/zip',
      size: blob.size,
    };
  }

  /**
   * Export to ZIP bundle
   */
  private async exportToZip(
    project: Project,
    options: ExportOptions
  ): Promise<ExportResult> {
    const zip = new JSZip();

    // Add HTML file
    const fullHtml = this.buildFullHTML(
      project.html,
      project.name,
      project.settings.theme,
      options
    );
    zip.file('index.html', options.minify ? this.minifyHTML(fullHtml) : fullHtml);

    // Add React component if requested
    if (options.format === 'react') {
      const componentCode = this.generateReactComponent(
        project.html,
        project.name,
        options
      );
      const stylesCode = this.generateReactStyles(project.settings.theme, options);

      zip.file(`src/${project.name}.tsx`, componentCode);
      zip.file(`src/${project.name}.module.css`, stylesCode);
      zip.file('src/index.ts', `export { ${this.toPascalCase(project.name)} } from './${project.name}';`);
    }

    // Add package.json if React export
    if (options.format === 'react') {
      const packageJson = {
        name: this.toKebabCase(project.name),
        version: '1.0.0',
        private: true,
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      };
      zip.file('package.json', JSON.stringify(packageJson, null, 2));
    }

    // Add README
    const readme = this.generateReadme(project);
    zip.file('README.md', readme);

    // Add project metadata
    const metadata = {
      name: project.name,
      description: project.description,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    zip.file('project.json', JSON.stringify(metadata, null, 2));

    // Generate the ZIP
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: options.minify ? 9 : 6 },
    });

    const filename = this.sanitizeFilename(`${project.name}.zip`);

    return {
      blob,
      filename,
      mimeType: 'application/zip',
      size: blob.size,
    };
  }

  /**
   * Build full HTML document
   */
  private buildFullHTML(
    bodyContent: string,
    title: string,
    theme: any,
    options: ExportOptions
  ): string {
    const cssVariables = this.generateCSSVariables(theme);
    const styles = this.generateGlobalStyles(theme, options);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    ${cssVariables}
    ${styles}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
  }

  /**
   * Generate CSS variables from theme
   */
  private generateCSSVariables(theme: any): string {
    const colors = theme.colors || {};
    const variables = Object.entries(colors)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join('\n');

    return `:root {
${variables}
}`;
  }

  /**
   * Generate global styles
   */
  private generateGlobalStyles(theme: any, options: ExportOptions): string {
    return `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--background);
  color: var(--foreground);
}
`;
  }

  /**
   * Generate React component
   */
  private generateReactComponent(
    html: string,
    name: string,
    options: ExportOptions
  ): string {
    const componentName = this.toPascalCase(name);
    const hasStyles = !options.inlineCSS;

    return `import React from 'react';
${hasStyles ? `import styles from './${name}.module.css';` : ''}

interface ${componentName}Props {
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({
  className: classNameProp${hasStyles ? `, ...props` : ''}
}) => {
  return (
    <div${hasStyles ? ` className={styles.root}${classNameProp ? ` \${classNameProp}` : ''}` : ` className="${classNameProp || ''}"`}${hasStyles ? ' {...props}' : ''}>
      ${this.htmlToJSX(html)}
    </div>
  );
};

export default ${componentName};
`;
  }

  /**
   * Generate React styles
   */
  private generateReactStyles(theme: any, options: ExportOptions): string {
    const cssVariables = this.generateCSSVariables(theme);
    const globalStyles = this.generateGlobalStyles(theme, options);

    return `${cssVariables}

.root {
  ${globalStyles}
}
`;
  }

  /**
   * Combine React files into single file
   */
  private combineReactFiles(componentCode: string, stylesCode: string): string {
    // Extract styles from .module.css format
    const stylesMatch = stylesCode.match(/:root \{([^}]+)\}/s);
    const styles = stylesMatch ? stylesMatch[1] : '';

    // Insert styles into component
    return componentCode.replace(
      /(import React[\s\S]*?\n)/,
      `$1
/* Embedded Styles */
:root {${styles}}

`
    );
  }

  /**
   * Convert HTML to JSX
   */
  private htmlToJSX(html: string): string {
    return html
      .replace(/class=/g, 'className=')
      .replace(/for=/g, 'htmlFor=')
      .replace(/style="([^"]+)"/g, (_match, styles) => {
        // Convert CSS string to React style object
        const styleObj = styles
          .split(';')
          .filter((s: string) => s.trim())
          .map((s: string) => {
            const [prop, value] = s.split(':').map((part: string) => part.trim());
            const camelProp = prop.replace(/-([a-z])/g, (_: string, letter: string) =>
              letter.toUpperCase()
            );
            return `${camelProp}: '${value}'`;
          })
          .join(', ');
        return `style={{${styleObj}}}`;
      })
      .replace(/<!--/g, '{/*')
      .replace(/-->/g, '*/}')
      .replace(/&nbsp;/g, ' ')
      .replace(/<br>/g, '<br />')
      .replace(/<hr>/g, '<hr />')
      .replace(/<img([^>]+)>/g, '<img$1 />');
  }

  /**
   * Generate README
   */
  private generateReadme(project: Project): string {
    return `# ${project.name}

${project.description || 'No description provided.'}

## Exported from Visual Website Builder

This project was exported on ${new Date().toLocaleDateString()}.

## Files

- \`index.html\` - Standalone HTML file
- \`project.json\` - Project metadata

## Usage

Simply open \`index.html\` in a web browser to view the project.

For development, you can extract this archive and use the source files.

## Credits

Created with Visual Website Builder
`;
  }

  /**
   * Minify HTML
   */
  private minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove space between tags
      .replace(/\s*{\s*/g, '{') // Remove space around braces
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';')
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .trim();
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    // Split name and extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    const ext = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';

    const sanitizedName = name
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    return sanitizedName + ext;
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\s/g, '');
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate thumbnail from project
   */
  async generateThumbnail(project: Project): Promise<string | undefined> {
    // Create a hidden iframe to render the project
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);

    try {
      // Wait for iframe to load
      await new Promise((resolve) => {
        iframe.onload = resolve;
        iframe.srcdoc = project.html;
      });

      // Capture screenshot
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw iframe content to canvas
        ctx.drawImage(iframe as any, 0, 0, 800, 600);

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png', 0.8);
        return dataUrl;
      }
    } finally {
      document.body.removeChild(iframe);
    }

    return undefined;
  }
}

// Singleton instance
export const projectExporterService = new ProjectExporterService();
