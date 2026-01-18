import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'agentful',
  description: 'Autonomous product development kit for Claude Code. Transform any project into a 24/7 self-building system with specialized agents.',

  icon: '/assets/agentful.jpeg',
  logo: {
    light: '/assets/agentful.jpeg',
    dark: '/assets/agentful.jpeg',
  },

  url: 'https://agentful.app',

  editLink: 'https://github.com/itz4blitz/agentful/edit/main/docs',

  socials: [
    {
      icon: 'github',
      link: 'https://github.com/itz4blitz/agentful',
    },
  ],

  ogImageUrl: 'https://agentful.app/assets/agentful.jpeg',

  sidebar: {
    '/': [
      {
        text: 'Philosophy',
        items: [
          { text: 'Core Principles', link: '/philosophy' },
        ],
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Quick Start', link: '/getting-started/quick-start' },
          { text: 'Your First Project', link: '/getting-started/first-project' },
          { text: 'Configuration', link: '/getting-started/configuration' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Overview', link: '/core-concepts' },
          { text: 'Agent System', link: '/core-concepts/agents' },
          { text: 'The Orchestrator', link: '/core-concepts/orchestrator' },
          { text: 'Slash Commands', link: '/core-concepts/slash-commands' },
          { text: 'Skills', link: '/core-concepts/skills' },
          { text: 'State Management', link: '/core-concepts/state-management' },
        ],
      },
      {
        text: 'Agents',
        items: [
          { text: 'Agent Overview', link: '/agents' },
          { text: 'Orchestrator', link: '/agents/orchestrator' },
          { text: 'Architect', link: '/agents/architect' },
          { text: 'Backend', link: '/agents/backend' },
          { text: 'Frontend', link: '/agents/frontend' },
          { text: 'Tester', link: '/agents/tester' },
          { text: 'Reviewer', link: '/agents/reviewer' },
          { text: 'Fixer', link: '/agents/fixer' },
          { text: 'Custom Agents', link: '/agents/custom-agents' },
        ],
      },
      {
        text: 'Commands',
        items: [
          { text: 'Commands Overview', link: '/commands' },
          { text: '/agentful', link: '/commands/agentful' },
          { text: '/agentful-start', link: '/commands/agentful-start' },
          { text: '/agentful-status', link: '/commands/agentful-status' },
          { text: '/agentful-decide', link: '/commands/agentful-decide' },
          { text: '/agentful-validate', link: '/commands/agentful-validate' },
        ],
      },
      {
        text: 'Autonomous Development',
        items: [
          { text: 'Autonomous Mode', link: '/autonomous-development' },
          { text: '24/7 Development', link: '/autonomous-development/24-7-development' },
          { text: 'Quality Gates', link: '/autonomous-development/quality-gates' },
          { text: 'Recovery Strategies', link: '/autonomous-development/recovery-strategies' },
          { text: 'Monitoring', link: '/autonomous-development/monitoring' },
        ],
      },
      {
        text: 'Workflows',
        items: [
          { text: 'Workflow Patterns', link: '/workflows' },
          { text: 'Feature Development', link: '/workflows/feature-development' },
          { text: 'Bug Fixing', link: '/workflows/bug-fixing' },
          { text: 'Refactoring', link: '/workflows/refactoring' },
          { text: 'Testing', link: '/workflows/testing' },
        ],
      },
      {
        text: 'Configuration',
        items: [
          { text: 'Configuration Overview', link: '/configuration' },
          { text: 'Project Structure', link: '/configuration/project-structure' },
          { text: 'Agent Configuration', link: '/configuration/agent-configuration' },
          { text: 'Workflow Configuration', link: '/configuration/workflow-configuration' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Guides Overview', link: '/guides' },
          { text: 'Writing PRODUCT.md', link: '/guides/writing-product-md' },
          { text: 'Team Adoption', link: '/guides/team-adoption' },
          { text: 'Troubleshooting', link: '/guides/troubleshooting' },
          { text: 'Best Practices', link: '/guides/best-practices' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'CLI Reference', link: '/reference/cli-reference' },
          { text: 'State Files', link: '/reference/state-files' },
          { text: 'Settings Reference', link: '/reference/settings-reference' },
        ],
      },
      {
        text: 'Examples',
        items: [
          { text: 'Full-Stack App', link: '/examples/full-stack-app' },
          { text: 'API Development', link: '/examples/api-development' },
          { text: 'Frontend Project', link: '/examples/frontend-project' },
        ],
      },
    ],
  },

  topNav: [
    { text: 'Docs', link: '/' },
    { text: 'Guides', link: '/guides' },
    { text: 'Examples', link: '/examples' },
    { text: 'GitHub', link: 'https://github.com/itz4blitz/agentful' },
    { text: 'Discord', link: 'https://discord.gg/SMDvJXUe' },
  ],

  theme: {
    accentColor: '#10b981', // Green instead of blue
  },

  head: [
    '<link rel="stylesheet" href="/custom.css">',
  ],
})
