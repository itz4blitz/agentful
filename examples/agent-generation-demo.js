/**
 * Agent Generation Demo
 *
 * Demonstrates the smart agent generation system.
 * Run with: node examples/agent-generation-demo.js
 */

import AgentGenerator from '../lib/agent-generator.js';
import DomainStructureGenerator from '../lib/domain-structure-generator.js';
import TemplateEngine from '../lib/template-engine.js';

async function demo() {
  console.log('\n🚀 Agent Generation System Demo\n');
  console.log('=' .repeat(60));

  // Simulate a project analysis result
  const mockAnalysis = {
    primaryLanguage: 'typescript',
    primaryFramework: 'nextjs',
    techStack: {
      language: 'typescript',
      framework: 'nextjs',
      orm: 'prisma',
      database: 'postgresql',
      ui: 'react',
      testing: 'jest',
    },
    domains: [
      {
        name: 'auth',
        confidence: 0.9,
        description: 'Authentication and authorization functionality',
        features: [
          {
            name: 'user-registration',
            description: 'User registration with email verification',
            status: 'detected',
            acceptanceCriteria: [
              'User can register with email and password',
              'Email verification is sent',
              'User account is created',
            ],
          },
          {
            name: 'user-login',
            description: 'User login with JWT tokens',
            status: 'detected',
            acceptanceCriteria: [
              'User can login with credentials',
              'JWT token is generated',
              'Session is established',
            ],
          },
        ],
        technologies: ['next-auth', 'jwt', 'bcrypt'],
      },
      {
        name: 'billing',
        confidence: 0.7,
        description: 'Billing and subscription management',
        features: [
          {
            name: 'subscription-management',
            description: 'Manage user subscriptions',
            status: 'detected',
            acceptanceCriteria: [
              'User can view subscription',
              'User can upgrade/downgrade',
              'Billing history is available',
            ],
          },
        ],
        technologies: ['stripe', 'prisma'],
      },
    ],
  };

  console.log('\n📊 Mock Analysis Data:');
  console.log(`  Language: ${mockAnalysis.primaryLanguage}`);
  console.log(`  Framework: ${mockAnalysis.primaryFramework}`);
  console.log(`  Domains: ${mockAnalysis.domains.map(d => d.name).join(', ')}`);

  // Demo: Agent Generation
  console.log('\n\n🤖 1. Agent Generation');
  console.log('-'.repeat(60));

  const agentGenerator = new AgentGenerator(process.cwd(), mockAnalysis);

  console.log('\n✨ Would generate:');
  console.log('  • Core agents: backend, frontend, tester, reviewer, fixer');
  console.log('  • Domain agents: auth-agent, billing-agent');
  console.log('  • Tech agents: nextjs-agent, prisma-agent, postgresql-agent');

  console.log('\n📝 Generated agents would include:');
  console.log('  • Real code samples from the project');
  console.log('  • Project-specific conventions');
  console.log('  • Domain-specific knowledge');
  console.log('  • Tech-specific patterns');

  // Demo: Domain Structure Generation
  console.log('\n\n📁 2. Domain Structure Generation');
  console.log('-'.repeat(60));

  const domainGenerator = new DomainStructureGenerator(process.cwd(), mockAnalysis);

  console.log('\n✨ Would generate:');
  console.log('  • .claude/product/index.md');
  console.log('  • .claude/product/domains/auth/index.md');
  console.log('  • .claude/product/domains/auth/features/user-registration.md');
  console.log('  • .claude/product/domains/auth/features/user-login.md');
  console.log('  • .claude/product/domains/auth/technical.md');
  console.log('  • .claude/product/domains/billing/index.md');
  console.log('  • .claude/product/domains/billing/features/subscription-management.md');
  console.log('  • .claude/product/domains/billing/technical.md');
  console.log('  • .claude/product/completion.json');

  console.log('\n📝 Generated structure would include:');
  console.log('  • Domain overviews with confidence scores');
  console.log('  • Feature specifications with acceptance criteria');
  console.log('  • Technical documentation');
  console.log('  • API endpoints and data models');
  console.log('  • Dependencies and integration points');

  // Demo: Template Interpolation
  console.log('\n\n📋 3. Template Interpolation Example');
  console.log('-'.repeat(60));

  const template = `# {{tech}} Agent

Technology: {{tech}}
Type: {{techType}}
Language: {{language}}

## Conventions:
{{conventions}}

## Code Samples:
{{samples}}
`;

  const mockData = {
    tech: 'nextjs',
    techType: 'framework',
    language: 'typescript',
    conventions: [
      'Uses App Router',
      'Components in app/ directory',
      'Server components by default',
    ],
    samples: [
      {
        path: 'app/page.tsx',
        content: 'export default function Page() {\n  return <div>Hello</div>\n}',
      },
    ],
  };

  console.log('\n📄 Template:');
  console.log(template);
  console.log('\n📊 Data:');
  console.log(JSON.stringify(mockData, null, 2));
  console.log('\n✅ Rendered Output:');
  console.log(TemplateEngine.render(template, mockData));

  // Demo: Pattern Extraction
  console.log('\n\n🔍 4. Pattern Extraction Example');
  console.log('-'.repeat(60));

  console.log('\n✨ Would extract from codebase:');
  console.log('  • Naming conventions (camelCase, PascalCase)');
  console.log('  • Import patterns (@/, relative paths)');
  console.log('  • Code structure (classes, functions)');
  console.log('  • API patterns (router, app, decorators)');
  console.log('  • Error handling patterns');
  console.log('  • Testing patterns');

  console.log('\n📝 Sample patterns for backend agent:');
  console.log('  • Repository pattern detected in src/repositories/');
  console.log('  • Service layer found in src/services/');
  console.log('  • Route handlers in src/routes/');
  console.log('  • Uses async/await consistently');
  console.log('  • Error classes: ConflictError, NotFoundError');

  // Summary
  console.log('\n\n✨ Summary');
  console.log('=' .repeat(60));
  console.log('\n🎯 Key Features:');
  console.log('  ✓ Context-aware agent generation');
  console.log('  ✓ Real code samples from project');
  console.log('  ✓ Project-specific patterns and conventions');
  console.log('  ✓ Domain-specific agents (auth, billing, etc.)');
  console.log('  ✓ Tech-specific agents (Next.js, Prisma, etc.)');
  console.log('  ✓ Hierarchical domain structure');
  console.log('  ✓ Feature specifications with acceptance criteria');
  console.log('  ✓ Technical documentation');
  console.log('  ✓ Works with ANY tech stack');
  console.log('  ✓ Handles empty projects');

  console.log('\n📂 Generated Files:');
  console.log('  • .claude/agents/auto-generated/*.md');
  console.log('  • .claude/product/index.md');
  console.log('  • .claude/product/domains/*/index.md');
  console.log('  • .claude/product/domains/*/features/*.md');
  console.log('  • .claude/product/domains/*/technical.md');
  console.log('  • .claude/product/completion.json');
  console.log('  • .agentful/architecture.json (updated)');

  console.log('\n🚀 Ready to use with: agentful init\n');
}

// Run demo
demo().catch(console.error);
