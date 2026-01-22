import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'agentful',
  description: 'An agent toolkit for development, automation, and CI',

  logoUrl: '/logo.svg',
  iconUrl: '/logo-icon.svg',

  editLink: {
    pattern: 'https://github.com/itz4blitz/agentful/edit/main/docs/:path',
  },

  sidebar: {
    '/': [
      {
        text: 'Getting Started',
        items: [
          { text: 'Configure & Install', link: '/' },
          { text: 'Overview', link: '/getting-started/overview' },
          { text: 'Quick Start', link: '/getting-started/quick-start' },
          { text: 'Your First Project', link: '/getting-started/first-project' },
          { text: 'Presets', link: '/getting-started/presets' },
          { text: 'Migration Guide', link: '/getting-started/migration' },
          { text: 'Configuration', link: '/getting-started/configuration' },
        ],
      },
      {
        text: 'Skills',
        items: [
          { text: 'Overview', link: '/skills' },
          { text: 'Conversation', link: '/skills/conversation' },
          { text: 'Product Tracking', link: '/skills/product-tracking' },
          { text: 'Validation', link: '/skills/validation' },
        ],
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Agent Architecture', link: '/concepts/architecture' },
          { text: 'Background Agent Patterns', link: '/concepts/background-agents' },
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
          { text: '/agentful-product', link: '/commands/agentful-product' },
          { text: '/agentful-start', link: '/commands/agentful-start' },
          { text: '/agentful-status', link: '/commands/agentful-status' },
          { text: '/agentful-decide', link: '/commands/agentful-decide' },
          { text: '/agentful-validate', link: '/commands/agentful-validate' },
          { text: '/agentful-analyze', link: '/commands/agentful-analyze' },
        ],
      },
      {
        text: 'Deployment',
        items: [
          { text: 'CI/CD Integration', link: '/ci-integration' },
          { text: 'Remote Execution', link: '/remote-execution' },
        ],
      },
      {
        text: 'Brand',
        items: [
          { text: 'Logo Usage', link: '/brand/logo' },
        ],
      },
    ],
  },

  topNav: [
    { text: 'Docs', link: '/' },
    { text: 'GitHub', link: 'https://github.com/itz4blitz/agentful' },
    { text: 'Discord', link: 'https://discord.gg/SMDvJXUe' },
  ],

  theme: {
    accentColor: {
      light: '#10b981',
      dark: '#10b981',
    },
    colorScheme: 'dark',
  },

  socials: [
    {
      icon: 'github',
      link: 'https://github.com/itz4blitz/agentful',
    },
    {
      icon: 'discord',
      link: 'https://discord.gg/SMDvJXUe',
    },
  ],

  head: {
    link: [
      {
        rel: 'stylesheet',
        href: '/custom.css',
      },
    ],
    script: [
      {
        src: '/animate-favicon.js',
        async: true,
      },
    ],
  },
})
