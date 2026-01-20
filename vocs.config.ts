import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'agentful',
  description: 'Human-in-the-loop development kit for Claude Code. Structured development with specialized agents where Claude implements and you decide.',

  editLink: {
    pattern: 'https://github.com/itz4blitz/agentful/edit/main/docs/:path',
  },

  sidebar: {
    '/': [
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
        text: 'Skills',
        items: [
          { text: 'Overview', link: '/skills' },
          { text: 'Conversation', link: '/skills/conversation' },
          { text: 'Product Tracking', link: '/skills/product-tracking' },
          { text: 'Validation', link: '/skills/validation' },
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
          { text: '/agentful-agents', link: '/commands/agentful-agents' },
          { text: '/agentful-skills', link: '/commands/agentful-skills' },
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
    accentColor: '#10b981',
  },
})
