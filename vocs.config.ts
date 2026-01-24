import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'agentful',
  description: 'Pre-configured AI agent toolkit with self-hosted remote execution. The Swiss Army Knife of AI Agents - works with any LLM, any tech stack, any platform.',

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
          { text: 'Installation', link: '/getting-started/installation' },
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
          { text: 'Git Worktrees', link: '/concepts/git-worktrees' },
        ],
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Distributed MCP', link: '/architecture/distributed-mcp' },
          { text: 'HTTP/SSE Transport', link: '/architecture/http-transport' },
          { text: 'OAuth 2.1 Flow', link: '/architecture/oauth-flow' },
          { text: 'Client Pool', link: '/architecture/client-pool' },
          { text: 'Work Distribution', link: '/architecture/work-distribution' },
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
          { text: '/agentful-generate', link: '/commands/agentful-generate' },
          { text: '/agentful-update', link: '/commands/agentful-update' },
        ],
      },
      {
        text: 'LLM Providers',
        items: [
          { text: 'Provider Overview', link: '/llm-providers' },
          { text: 'GLM-4.7 (10x Cheaper)', link: '/llm-providers/glm' },
          { text: 'Ollama & LM Studio (Local)', link: '/llm-providers/local' },
        ],
      },
      {
        text: 'Server & Infrastructure',
        items: [
          { text: 'Self-Hosted Server', link: '/server' },
          { text: 'Remote Execution', link: '/remote-execution' },
          { text: 'CI/CD Integration', link: '/ci-integration' },
          { text: 'Pipelines', link: '/pipelines/overview' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'State Schema', link: '/reference/state-schema' },
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
