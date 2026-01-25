import { defineConfig } from 'vocs'
import { readFileSync } from 'fs'

const version = JSON.parse(readFileSync('./version.json', 'utf-8')).version

export default defineConfig({
  title: `agentful v${version}`,
  description: 'Pre-configured development toolkit for Claude Code. Orchestrates specialized agents in parallel with inter-agent communication to build features from product specs.',

  logoUrl: '/logo.svg',
  iconUrl: '/logo-icon.svg',
  ogImageUrl: '/logo-icon.svg',

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
          { text: 'Product Planning', link: '/skills/product-planning' },
          { text: 'Product Tracking', link: '/skills/product-tracking' },
          { text: 'Research', link: '/skills/research' },
          { text: 'Testing', link: '/skills/testing' },
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
        text: 'Agents',
        items: [
          { text: 'Agent Overview', link: '/agents' },
          { text: 'Orchestrator', link: '/agents/orchestrator' },
          { text: 'Product Analyzer', link: '/agents/product-analyzer' },
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
        text: 'Infrastructure',
        items: [
          { text: 'CI/CD Integration', link: '/ci-integration' },
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

  vite: {
    css: {
      preprocessorOptions: {
        css: {
          additionalData: `
            .vocs_Sidebar_sectionTitle {
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%) !important;
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent !important;
              background-clip: text !important;
              color: transparent !important;
              font-weight: 600 !important;
            }
          `
        }
      }
    }
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
    tags: [
      {
        tagName: 'style',
        children: `
          .vocs_Sidebar_sectionTitle {
            background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            color: transparent !important;
            font-weight: 600 !important;
          }
        `,
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          href: '/custom.css',
        },
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
          integrity: 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==',
          crossorigin: 'anonymous',
        },
      },
      {
        tagName: 'script',
        attributes: {
          src: '/animate-favicon.js',
          async: true,
        },
      },
      {
        tagName: 'script',
        children: `
          (function() {
            const style = document.createElement('style');
            style.textContent = \`.vocs_Sidebar_sectionTitle {
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%) !important;
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent !important;
              background-clip: text !important;
              color: transparent !important;
              font-weight: 600 !important;
            }\`;
            document.head.appendChild(style);
          })();
        `,
      },
    ],
  },
})
