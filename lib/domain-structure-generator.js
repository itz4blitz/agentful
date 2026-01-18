/**
 * Domain Structure Generator
 *
 * Creates hierarchical domain structures for product organization
 * with comprehensive specifications, features, and technical details.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

class DomainStructureGenerator {
  constructor(projectPath, analysis) {
    this.projectPath = projectPath;
    this.analysis = analysis;
    this.productDir = path.join(projectPath, '.claude/product');
    this.domainsDir = path.join(this.productDir, 'domains');
  }

  /**
   * Main entry point - generates domain structure
   */
  async generateDomainStructure() {
    console.log('📁 Generating domain structure...');

    // Ensure directories exist
    await fs.mkdir(this.domainsDir, { recursive: true });

    // Get domains from analysis
    const domains = this.analysis.domains || [];

    // Handle new projects (no domains detected)
    if (domains.length === 0) {
      await this.generateEmptyProjectStructure();
    } else {
      // Generate structure for each detected domain
      for (const domain of domains) {
        await this.generateDomainStructureForDomain(domain);
      }
    }

    // Generate/update product index
    await this.generateProductIndex(domains);

    // Generate completion schema
    await this.generateCompletionSchema(domains);

    console.log(`✅ Generated structure for ${domains.length} domains`);

    return {
      domains: domains.length,
      features: await this.countFeatures(domains),
    };
  }

  /**
   * Generate structure for empty project
   */
  async generateEmptyProjectStructure() {
    const indexContent = `# Product Structure

This is a new project. Domains will be automatically detected as you build features.

## Getting Started

1. Create your first feature (e.g., authentication, user management)
2. The domain structure will be automatically updated
3. Each domain will contain:
   - Feature specifications
   - Acceptance criteria
   - Technical implementation details
   - API documentation
   - Data models

## Initial Suggested Domains

Based on your tech stack, consider starting with:

- **Authentication** - User registration, login, sessions
- **Core Features** - Main business logic
- **Data Models** - Database schemas

As you implement features, run \`agentful init\` again to update this structure.
`;

    await fs.writeFile(
      path.join(this.productDir, 'index.md'),
      indexContent
    );

    // Generate completion.json for empty project
    const completionContent = {
      version: '1.0.0',
      domains: [],
      generatedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(this.productDir, 'completion.json'),
      JSON.stringify(completionContent, null, 2)
    );
  }

  /**
   * Generate structure for a specific domain
   */
  async generateDomainStructureForDomain(domain) {
    const domainDir = path.join(this.domainsDir, domain.name);
    await fs.mkdir(domainDir, { recursive: true });

    // Generate domain index
    await this.generateDomainIndex(domain);

    // Generate features
    if (domain.features && domain.features.length > 0) {
      const featuresDir = path.join(domainDir, 'features');
      await fs.mkdir(featuresDir, { recursive: true });

      for (const feature of domain.features) {
        await this.generateFeatureSpec(domain.name, feature);
      }
    }

    // Generate technical details
    await this.generateTechnicalSpec(domain);
  }

  /**
   * Generate domain index file
   */
  async generateDomainIndex(domain) {
    const domainDir = path.join(this.domainsDir, domain.name);

    // Extract domain-specific code samples
    const samples = await this.extractDomainSamples(domain.name);

    // Detect dependencies
    const dependencies = await this.detectDomainDependencies(domain.name);

    const content = `# ${this.formatDomainName(domain.name)} Domain

${this.generateDomainOverview(domain)}

## Confidence

${this.formatConfidence(domain.confidence)}

## Detected Features

${this.formatFeatures(domain.features || [])}

## Technical Details

### Technologies Used

${this.formatTechnologies(domain.technologies || [])}

### Code Samples

${this.formatCodeSamples(samples)}

### API Endpoints

${this.formatEndpoints(samples.endpoints || [])}

### Data Models

${this.formatModels(samples.models || [])}

## Dependencies

${this.formatDependencies(dependencies)}

## Integration Points

${this.formatIntegrationPoints()}

## Implementation Notes

${this.generateImplementationNotes(domain)}
`;

    await fs.writeFile(
      path.join(domainDir, 'index.md'),
      content
    );
  }

  /**
   * Generate feature specification
   */
  async generateFeatureSpec(domainName, feature) {
    const featuresDir = path.join(this.domainsDir, domainName, 'features');
    const featureFile = path.join(featuresDir, `${feature.name}.md`);

    const content = `# ${this.formatFeatureName(feature.name)}

${this.generateFeatureOverview(feature)}

## Acceptance Criteria

${this.formatAcceptanceCriteria(feature.acceptanceCriteria || [])}

## Implementation Status

${this.formatImplementationStatus(feature)}

## Technical Details

### API Endpoints

${this.formatFeatureEndpoints(feature)}

### Data Models

${this.formatFeatureModels(feature)}

### Business Logic

${this.formatBusinessLogic(feature)}

## Related Files

${this.formatRelatedFiles(feature)}

## Dependencies

${this.formatFeatureDependencies(feature)}
`;

    await fs.writeFile(featureFile, content);
  }

  /**
   * Generate technical specification for domain
   */
  async generateTechnicalSpec(domain) {
    const domainDir = path.join(this.domainsDir, domain.name);
    const samples = await this.extractDomainSamples(domain.name);

    const content = `# Technical Specification: ${this.formatDomainName(domain.name)}

## Architecture

${this.generateArchitectureDiagram()}

## API Specification

### REST Endpoints

${this.formatAPIEndpoints(samples.endpoints || [])}

### Request/Response Schemas

${this.formatSchemas()}

## Data Models

### Database Schema

${this.formatDatabaseSchema(samples.models || [])}

### Entity Relationships

${this.formatEntityRelationships()}

## Business Logic

### Services

${this.formatServices(samples.services || [])}

### Workflows

${this.formatWorkflows()}

## Security

${this.formatSecuritySpec()}

## Performance Considerations

${this.formatPerformanceSpec()}

## Testing Strategy

${this.formatTestingSpec()}
`;

    await fs.writeFile(
      path.join(domainDir, 'technical.md'),
      content
    );
  }

  /**
   * Generate product index
   */
  async generateProductIndex(domains) {
    const content = `# Product Structure

Auto-generated domain structure for your project.

## Overview

This project has been analyzed and organized into ${domains.length} domain(s).

**Last Updated**: ${new Date().toISOString()}

## Domains

${this.formatDomainList(domains)}

## Domain Hierarchy

${this.generateDomainHierarchy(domains)}

## Quick Navigation

${this.generateQuickNavigation(domains)}

## Statistics

- **Total Domains**: ${domains.length}
- **Total Features**: ${this.countTotalFeatures(domains)}
- **Detected Technologies**: ${this.formatDetectedTech()}

## Usage

Use this structure to:
- Navigate between product domains
- Understand feature relationships
- Find API documentation
- Review data models
- Track implementation progress
`;

    await fs.writeFile(
      path.join(this.productDir, 'index.md'),
      content
    );
  }

  /**
   * Generate completion schema
   */
  async generateCompletionSchema(domains) {
    const completion = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      project: {
        path: this.projectPath,
        name: path.basename(this.projectPath),
      },
      techStack: this.analysis.techStack || {},
      domains: [],
    };

    // Build domain structure
    for (const domain of domains) {
      const domainData = {
        name: domain.name,
        confidence: domain.confidence,
        features: [],
        technologies: domain.technologies || [],
      };

      if (domain.features) {
        for (const feature of domain.features) {
          domainData.features.push({
            name: feature.name,
            status: feature.status || 'detected',
            acceptanceCriteria: feature.acceptanceCriteria || [],
          });
        }
      }

      completion.domains.push(domainData);
    }

    await fs.writeFile(
      path.join(this.productDir, 'completion.json'),
      JSON.stringify(completion, null, 2)
    );
  }

  /**
   * Extract domain-specific code samples
   */
  async extractDomainSamples(domainName) {
    const samples = {
      code: [],
      endpoints: [],
      models: [],
      schemas: [],
      services: [],
    };

    // Domain-specific file patterns
    const patterns = {
      'auth-agent': ['auth', 'user', 'login', 'register', 'session'],
      'billing-agent': ['billing', 'payment', 'subscription', 'invoice'],
      'content-agent': ['content', 'post', 'article', 'blog'],
    };

    const keywords = patterns[domainName] || [domainName];

    // Find related files
    const files = await this.findDomainFiles(keywords, 5);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(this.projectPath, file);

        // Extract code samples
        if (content.length > 0 && content.length < 1500) {
          samples.code.push({
            path: relativePath,
            content: content,
          });
        }

        // Extract endpoints
        if (content.includes('router.') || content.includes('app.') || content.includes('@Get')) {
          samples.endpoints.push(...this.extractEndpoints(content, relativePath));
        }

        // Extract models
        if (content.includes('model') || content.includes('schema') || content.includes('interface')) {
          samples.models.push(...this.extractModels(content, relativePath));
        }

        // Extract services
        if (content.includes('service') || content.includes('Service')) {
          samples.services.push({
            path: relativePath,
            content: content.substring(0, 500),
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return samples;
  }

  /**
   * Detect domain dependencies
   */
  async detectDomainDependencies(domainName) {
    const dependencies = [];

    // Analyze imports and requires in domain files
    const files = await this.findDomainFiles([domainName], 5);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          // Detect imports from other domains
          if (line.includes('import') || line.includes('require')) {
            const domains = ['auth', 'user', 'billing', 'content', 'notification'];
            for (const domain of domains) {
              if (line.toLowerCase().includes(domain) && domain !== domainName) {
                dependencies.push({
                  from: domainName,
                  to: domain,
                  type: line.includes('import') ? 'import' : 'require',
                });
              }
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return [...new Set(dependencies.map(d => JSON.stringify(d)))].map(s => JSON.parse(s));
  }

  /**
   * Find domain files
   */
  async findDomainFiles(keywords, maxFiles = 5) {
    const files = [];

    const scanDir = async (dirPath) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= maxFiles) return;

          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Skip common directories
            if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
              await scanDir(fullPath);
            }
          } else if (entry.isFile() && this.isSourceFile(entry.name)) {
            // Check if file matches keywords
            for (const keyword of keywords) {
              if (entry.name.toLowerCase().includes(keyword.toLowerCase())) {
                files.push(fullPath);
                break;
              }
            }
          }
        }
      } catch (error) {
        // Can't read directory
      }
    };

    await scanDir(this.projectPath);
    return files;
  }

  /**
   * Check if file is a source file
   */
  isSourceFile(filename) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Extract endpoints from code
   */
  extractEndpoints(content, filePath) {
    const endpoints = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('router.') || line.includes('app.') || line.includes('@Get') || line.includes('@Post')) {
        endpoints.push({
          file: filePath,
          code: line.trim(),
        });
      }
    }

    return endpoints;
  }

  /**
   * Extract models from code
   */
  extractModels(content, filePath) {
    const models = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('model ') || line.includes('schema ') || line.includes('interface ') || line.includes('type ')) {
        models.push({
          file: filePath,
          code: line.trim(),
        });
      }
    }

    return models;
  }

  /**
   * Count features
   */
  async countFeatures(domains) {
    let count = 0;
    for (const domain of domains) {
      if (domain.features) {
        count += domain.features.length;
      }
    }
    return count;
  }

  /**
   * Format helpers
   */

  formatDomainName(name) {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  formatFeatureName(name) {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  formatConfidence(confidence) {
    const percentage = Math.round((confidence || 0) * 100);
    return `${percentage}% - Based on code analysis`;
  }

  formatFeatures(features) {
    if (!features || features.length === 0) {
      return 'No specific features detected yet.';
    }
    return features.map(f => `- **${this.formatFeatureName(f.name)}**: ${f.description || 'No description'}`).join('\n');
  }

  formatTechnologies(tech) {
    if (!tech || tech.length === 0) return 'Not specified';
    return tech.map(t => `- \`${t}\``).join('\n');
  }

  formatCodeSamples(samples) {
    if (!samples.code || samples.code.length === 0) return 'No samples available';
    return samples.code.slice(0, 3).map(s =>
      `#### ${s.path}\n\`\`\`\n${s.content.substring(0, 500)}...\n\`\`\``
    ).join('\n\n');
  }

  formatEndpoints(endpoints) {
    if (!endpoints || endpoints.length === 0) return 'No endpoints detected';
    return endpoints.map(e => `- ${e.file}: \`${e.code}\``).join('\n');
  }

  formatModels(models) {
    if (!models || models.length === 0) return 'No models detected';
    return models.map(m => `- ${m.file}: \`${m.code}\``).join('\n');
  }

  formatDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) return 'No dependencies detected';
    return dependencies.map(d => `- Depends on **${d.to}** (${d.type})`).join('\n');
  }

  formatIntegrationPoints() {
    return 'Integration points will be detected as you build more features.';
  }

  formatDetectedTech() {
    const tech = this.analysis.techStack || {};
    return Object.entries(tech).map(([key, value]) =>
      `- ${key}: ${value || 'Not detected'}`
    ).join('\n');
  }

  formatDomainList(domains) {
    if (domains.length === 0) return 'No domains detected yet.';
    return domains.map(d =>
      `### [${this.formatDomainName(d.name)}](./domains/${d.name}/index.md)\n\n${d.description || 'No description'}`
    ).join('\n\n');
  }

  generateDomainOverview(domain) {
    return `The **${this.formatDomainName(domain.name)}** domain handles ${this.formatDomainName(domain.name)}-related functionality.

${domain.description || 'Automatically detected from codebase analysis.'}`;
  }

  generateImplementationNotes(domain) {
    return `This domain was automatically detected with **${Math.round((domain.confidence || 0) * 100)}%** confidence based on:

- File names and directory structure
- Code patterns and imports
- API endpoints
- Data models

As you implement more features in this domain, this documentation will be updated automatically.`;
  }

  countTotalFeatures(domains) {
    return domains.reduce((count, domain) => count + (domain.features?.length || 0), 0);
  }

  generateDomainHierarchy(domains) {
    // Simple hierarchy for now - can be enhanced
    if (domains.length === 0) return 'No domains detected yet.';

    return domains.map(d => `- ${d.name}${d.features ? ` (${d.features.length} features)` : ''}`).join('\n');
  }

  generateQuickNavigation(domains) {
    return domains.map(d => `- [${this.formatDomainName(d.name)}](domains/${d.name}/index.md)`).join('\n');
  }

  formatAcceptanceCriteria(criteria) {
    if (!criteria || criteria.length === 0) return 'No acceptance criteria defined yet.';
    return criteria.map(c => `- [ ] ${c}`).join('\n');
  }

  formatImplementationStatus(feature) {
    return feature.status || 'Detected - not yet implemented';
  }

  formatFeatureEndpoints(feature) {
    return feature.endpoints ? feature.endpoints.map(e => `- \`${e.method} ${e.path}\``).join('\n') : 'No endpoints defined';
  }

  formatFeatureModels(feature) {
    return feature.models ? feature.models.map(m => `- \`${m}\``).join('\n') : 'No models defined';
  }

  formatBusinessLogic(feature) {
    return feature.businessLogic || 'Business logic will be documented during implementation.';
  }

  formatRelatedFiles(feature) {
    return feature.files ? feature.files.map(f => `- \`${f}\``).join('\n') : 'No files detected';
  }

  formatFeatureDependencies(feature) {
    return feature.dependencies ? feature.dependencies.map(d => `- ${d}`).join('\n') : 'No dependencies';
  }

  generateFeatureOverview(feature) {
    return feature.description || `Feature for ${this.formatFeatureName(feature.name)}`;
  }

  formatAPIEndpoints(endpoints) {
    if (!endpoints || endpoints.length === 0) return 'No endpoints documented yet.';
    return endpoints.map(e =>
      `#### ${e.file}\n\`\`\`\n${e.code}\n\`\`\``
    ).join('\n\n');
  }

  formatSchemas() {
    return 'Request/response schemas will be documented during implementation.';
  }

  formatDatabaseSchema(models) {
    if (!models || models.length === 0) return 'No models documented yet.';
    return models.map(m =>
      `#### ${m.file}\n\`\`\`\n${m.code}\n\`\`\``
    ).join('\n\n');
  }

  formatEntityRelationships() {
    return 'Entity relationships will be documented as more features are implemented.';
  }

  formatServices(services) {
    if (!services || services.length === 0) return 'No services documented yet.';
    return services.map(s =>
      `#### ${s.path}\n\`\`\`\n${s.content}\n\`\`\``
    ).join('\n\n');
  }

  formatWorkflows() {
    return 'Workflows will be documented during implementation.';
  }

  formatSecuritySpec() {
    return 'Security considerations will be documented during implementation.';
  }

  formatPerformanceSpec() {
    return 'Performance considerations will be documented during implementation.';
  }

  formatTestingSpec() {
    return 'Testing strategy will be documented during implementation.';
  }

  generateArchitectureDiagram() {
    return 'Architecture diagram will be generated during implementation.';
  }
}

export default DomainStructureGenerator;
