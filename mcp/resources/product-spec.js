/**
 * Product Specification Resource
 * Provides read-only access to product specification
 * URI: agentful://product/spec
 */

/**
 * Product specification resource
 * Exposes the product specification as an MCP resource
 */
export const productSpecResource = {
  uri: 'agentful://product/spec',
  name: 'Product Specification',
  description: 'Read-only access to product specification (flat or hierarchical structure)',
  mimeType: 'text/markdown',

  /**
   * Read product specification
   * @param {Object} adapters - Data adapters
   * @returns {Promise<Object>} MCP resource response
   */
  async read(adapters) {
    try {
      const spec = await adapters.product.readProductSpec();

      if (spec.error) {
        return {
          contents: [{
            uri: 'agentful://product/spec',
            mimeType: 'application/json',
            text: JSON.stringify({
              error: spec.error,
              structure: spec.structure,
              hint: 'Create .claude/product/index.md to define your product specification'
            }, null, 2)
          }]
        };
      }

      // Flat structure - return single markdown document
      if (spec.structure === 'flat') {
        return {
          contents: [{
            uri: 'agentful://product/spec',
            mimeType: 'text/markdown',
            text: spec.content,
            metadata: {
              structure: 'flat',
              path: spec.path
            }
          }]
        };
      }

      // Hierarchical structure - return aggregated view
      if (spec.structure === 'hierarchical') {
        const domainNames = Object.keys(spec.domains);
        const aggregated = [
          '# Product Specification (Hierarchical)',
          '',
          `This product uses a hierarchical structure with ${domainNames.length} domain(s).`,
          '',
          '## Domains',
          '',
          ...domainNames.map(name => `- ${name}`),
          '',
          '---',
          ''
        ];

        // Append each domain's content
        for (const [domainName, domain] of Object.entries(spec.domains)) {
          aggregated.push(`## Domain: ${domainName}`);
          aggregated.push('');
          aggregated.push(domain.content);
          aggregated.push('');
          aggregated.push('---');
          aggregated.push('');
        }

        return {
          contents: [{
            uri: 'agentful://product/spec',
            mimeType: 'text/markdown',
            text: aggregated.join('\n'),
            metadata: {
              structure: 'hierarchical',
              domains: domainNames,
              domainCount: domainNames.length
            }
          }]
        };
      }

      // Fallback
      return {
        contents: [{
          uri: 'agentful://product/spec',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Unknown product specification structure',
            structure: spec.structure
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: 'agentful://product/spec',
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read product specification',
            message: error.message,
            hint: 'Ensure .claude/product/ directory exists and contains valid markdown files'
          }, null, 2)
        }]
      };
    }
  }
};
