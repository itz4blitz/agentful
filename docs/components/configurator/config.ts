export interface ConfigState {
  agents: string[]
  skills: string[]
  hooks: string[]
  gates: string[]
}

export const agents = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    description: 'Coordinates work, never writes code directly. Required.',
    required: true,
    icon: '🎯',
  },
  {
    id: 'architect',
    name: 'Architect',
    description: 'Analyzes tech stack, generates domain-specific agents.',
    required: false,
    icon: '🏗️',
  },
  {
    id: 'backend',
    name: 'Backend',
    description: 'Server-side logic, APIs, databases, authentication.',
    required: false,
    icon: '⚙️',
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'UI components, state management, client-side code.',
    required: false,
    icon: '🎨',
  },
  {
    id: 'tester',
    name: 'Tester',
    description: 'Test generation, test execution, coverage reports.',
    required: false,
    icon: '🧪',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Quality validation, type checking, linting, security.',
    required: false,
    icon: '✅',
  },
  {
    id: 'fixer',
    name: 'Fixer',
    description: 'Automated remediation of validation failures.',
    required: false,
    icon: '🔧',
  },
  {
    id: 'product-analyzer',
    name: 'Product Analyzer',
    description: 'Analyzes product specs, reverse-engineers features.',
    required: false,
    icon: '📊',
  },
]

export const skills = [
  {
    id: 'product-tracking',
    name: 'Product Tracking',
    description: 'Track feature completion, blocking decisions, and progress.',
    icon: '📊',
  },
  {
    id: 'validation',
    name: 'Validation',
    description: 'Quality gates for type checking, tests, coverage, security.',
    icon: '✅',
  },
  {
    id: 'conversation',
    name: 'Conversation',
    description: 'Natural language interface for ad-hoc questions and tasks.',
    icon: '💬',
  },
  {
    id: 'product-planning',
    name: 'Product Planning',
    description: 'Guided product specification creation and analysis.',
    icon: '📝',
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Test generation patterns and execution strategies.',
    icon: '🧪',
  },
  {
    id: 'deployment',
    name: 'Deployment',
    description: 'Deployment workflows and CI/CD configuration.',
    icon: '🚀',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Best practices research for tech stacks and domains.',
    icon: '🔍',
  },
]

export const hooks = [
  {
    id: 'health-check',
    name: 'Health Check',
    description: 'Quick agentful health check on session start',
    icon: '🏥',
  },
  {
    id: 'block-random-docs',
    name: 'Block Random Docs',
    description: 'Prevent creation of random markdown files outside approved locations',
    icon: '🚫',
  },
  {
    id: 'block-file-creation',
    name: 'Block File Creation',
    description: 'Prevent creation of arbitrary JSON/TXT/LOG files',
    icon: '⛔',
  },
  {
    id: 'product-spec-watcher',
    name: 'Product Spec Watcher',
    description: 'Watch product specs for changes and update state',
    icon: '👁️',
  },
  {
    id: 'architect-drift-detector',
    name: 'Architect Drift Detector',
    description: 'Detect when codebase drifts from generated agent conventions',
    icon: '🏗️',
  },
]

export const gates = [
  { id: 'types', name: 'Type Checking', description: 'Static type validation for your language', icon: '🔍' },
  { id: 'tests', name: 'Tests', description: 'All test suites must pass', icon: '✅' },
  { id: 'coverage', name: 'Coverage', description: 'Minimum 80% code coverage', icon: '📊' },
  { id: 'lint', name: 'Linting', description: 'Code style and quality validation', icon: '🎨' },
  { id: 'security', name: 'Security', description: 'Dependency vulnerability scanning', icon: '🔒' },
  { id: 'dead-code', name: 'Dead Code', description: 'Detect unused code and dependencies', icon: '🗑️' },
]

// Default: FULL agentful installation - EVERYTHING enabled
export const fullConfig: ConfigState = {
  agents: agents.map(a => a.id),
  skills: skills.map(s => s.id),
  hooks: hooks.map(h => h.id),
  gates: gates.map(g => g.id),
}
