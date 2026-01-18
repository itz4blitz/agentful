/**
 * Template Engine
 *
 * Simple template engine for variable interpolation in agent templates.
 * Supports nested objects, arrays, and conditional rendering.
 */

class TemplateEngine {
  /**
   * Render template with data
   */
  static render(template, data) {
    let content = template;

    // Handle arrays and objects with special formatting FIRST
    content = this.formatComplexTypes(content, data);

    // Replace simple variables: {{variable}}
    content = this.replaceVariables(content, data);

    // Add timestamp if needed
    if (content.includes('{{generated_at}}')) {
      content = content.replace(/\{\{generated_at\}\}/g, new Date().toISOString());
    }

    return content;
  }

  /**
   * Replace simple variables
   */
  static replaceVariables(content, data) {
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(placeholder, this.formatValue(value));
    }
    return content;
  }

  /**
   * Format complex types (arrays, objects)
   */
  static formatComplexTypes(content, data) {
    // Handle code_samples first (before generic samples check)
    if (data.codeSamples && Array.isArray(data.codeSamples)) {
      const placeholder = new RegExp('\\{\\{code_samples\\}\\}', 'g');
      const formatted = this.formatSamples(data.codeSamples);
      content = content.replace(placeholder, formatted);
    }

    // Handle samples array
    if (data.samples && Array.isArray(data.samples)) {
      const placeholder = new RegExp('\\{\\{samples\\}\\}', 'g');
      const formatted = this.formatSamples(data.samples);
      content = content.replace(placeholder, formatted);
    }
    // Handle patterns array - format as bullet points
    if (data.patterns && Array.isArray(data.patterns)) {
      const placeholder = new RegExp('\\{\\{patterns\\}\\}', 'g');
      const formatted = data.patterns
        .map(p => {
          if (typeof p === 'string') return `- ${p}`;
          if (p.keyword && p.context) {
            return `- **${p.keyword}**: Found in codebase`;
          }
          return JSON.stringify(p);
        })
        .join('\n');
      content = content.replace(placeholder, formatted);
    }

    // Handle conventions array
    if (data.conventions && Array.isArray(data.conventions)) {
      const placeholder = new RegExp('\\{\\{conventions\\}\\}', 'g');
      const formatted = data.conventions
        .filter(c => c && c.trim())
        .map(c => `- ${c}`)
        .join('\n');
      content = content.replace(placeholder, formatted || 'No specific conventions detected');
    }

    // Handle features array
    if (data.features && Array.isArray(data.features)) {
      const placeholder = new RegExp('\\{\\{features\\}\\}', 'g');
      const formatted = data.features
        .map(f => `- **${f.name}**: ${f.description || 'No description'}`)
        .join('\n');
      content = content.replace(placeholder, formatted || 'No features detected');
    }

    // Handle endpoints array
    if (data.endpoints && Array.isArray(data.endpoints)) {
      const placeholder = new RegExp('\\{\\{endpoints\\}\\}', 'g');
      const formatted = data.endpoints
        .map(e => `- \`${e.code || e}\``)
        .join('\n');
      content = content.replace(placeholder, formatted || 'No endpoints detected');
    }

    // Handle models array
    if (data.models && Array.isArray(data.models)) {
      const placeholder = new RegExp('\\{\\{models\\}\\}', 'g');
      const formatted = data.models
        .map(m => `- \`${m.code || m}\``)
        .join('\n');
      content = content.replace(placeholder, formatted || 'No models detected');
    }

    return content;
  }

  /**
   * Format code samples for display
   */
  static formatSamples(samples) {
    if (!samples || samples.length === 0) {
      return 'No code samples available yet.';
    }

    return samples
      .slice(0, 5) // Limit to 5 samples
      .map(sample => {
        if (typeof sample === 'string') return sample;

        const path = sample.path || 'unknown';
        const content = sample.content || '';

        return `#### ${path}\n\`\`\`\n${content.substring(0, 800)}${content.length > 800 ? '\n...' : ''}\n\`\`\``;
      })
      .join('\n\n');
  }

  /**
   * Format value for template
   */
  static formatValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }
}

export default TemplateEngine;
