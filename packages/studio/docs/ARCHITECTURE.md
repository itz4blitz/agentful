# agentful Studio - AI Tooling Integration Architecture

## Executive Summary

agentful Studio is designed as a **provider-agnostic AI development environment** that integrates with multiple AI ecosystems while maintaining a clean abstraction layer. This architecture enables seamless switching between providers, supports AI-specific features, and provides extensible integration points for future AI platforms.

**Key Design Principles:**
1. **Provider Agnostic** - No lock-in to any single AI provider
2. **Secure by Default** - API keys and secrets managed via VS Code's secure storage
3. **Extensible** - Easy to add new providers and AI ecosystems
4. **Project-Aware** - Configuration can be global, workspace-specific, or project-specific
5. **User-First UX** - Simple configuration UI with advanced options available

---

## 1. Provider Abstraction Layer

### 1.1 Core Provider Interface

All AI providers implement a unified interface that abstracts provider-specific differences:

```typescript
interface AIProvider {
  // Provider metadata
  id: string
  name: string
  icon: string
  description: string
  website: string

  // Authentication
  requiresAuth: boolean
  authType: 'apiKey' | 'oauth' | 'none'
  authUrl?: string

  // Models available
  models: AIModel[]

  // Capabilities
  capabilities: ProviderCapabilities

  // Initialize provider with credentials
  initialize(credentials: ProviderCredentials): Promise<void>

  // Generate completion
  generate(request: GenerationRequest): Promise<GenerationResponse>

  // Stream completion (optional)
  stream?(request: GenerationRequest): AsyncGenerator<GenerationChunk>

  // Validate credentials
  validateCredentials?(credentials: ProviderCredentials): Promise<boolean>
}

interface AIModel {
  id: string
  name: string
  description: string
  contextWindow: number
  maxTokens: number
  supportsStreaming: boolean
  supportsFunctionCalling: boolean
  supportsVision: boolean
  costPer1kTokens: {
    input: number
    output: number
  }
}

interface ProviderCapabilities {
  streaming: boolean
  functionCalling: boolean
  vision: boolean
  tools: boolean
  artifacts: boolean // Provider-specific output formats (Claude artifacts, OpenAI code interpreter, etc.)
  systemMessages: boolean
  temperature: boolean
  topP: boolean
  maxTokens: boolean
}
```

### 1.2 Provider Implementations

#### Claude (Anthropic)
```typescript
class ClaudeProvider implements AIProvider {
  id = 'anthropic'
  name = 'Claude'
  models = [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      contextWindow: 200000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      // ...
    },
    // claude-3-opus, claude-3-haiku, etc.
  ]

  capabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    tools: true,
    artifacts: true, // Claude-specific artifacts
    systemMessages: true,
    temperature: true,
    topP: true,
    maxTokens: true,
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Use Anthropic SDK
    // Handle artifacts if present in response
  }
}
```

#### OpenAI
```typescript
class OpenAIProvider implements AIProvider {
  id = 'openai'
  name = 'OpenAI'
  models = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      contextWindow: 128000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      // ...
    },
    // gpt-4-turbo, gpt-3.5-turbo, etc.
  ]

  capabilities = {
    streaming: true,
    functionCalling: true,
    vision: true,
    tools: true,
    artifacts: false, // OpenAI has different features (code interpreter, DALL-E, etc.)
    systemMessages: true,
    temperature: true,
    topP: true,
    maxTokens: true,
  }
}
```

#### Google Gemini
```typescript
class GeminiProvider implements AIProvider {
  id = 'google'
  name = 'Gemini'
  models = [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash',
      contextWindow: 1000000,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      // ...
    },
  ]
}
```

### 1.3 Provider Registry

```typescript
class ProviderRegistry {
  private providers = new Map<string, AIProvider>()

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id)
  }

  listAll(): AIProvider[] {
    return Array.from(this.providers.values())
  }

  getEnabled(): AIProvider[] {
    // Return providers with valid credentials
  }
}

// Built-in providers
const registry = new ProviderRegistry()
registry.register(new ClaudeProvider())
registry.register(new OpenAIProvider())
registry.register(new GeminiProvider())
```

---

## 2. Configuration Management

### 2.1 Configuration Schema

```typescript
interface ProviderConfiguration {
  // Active provider for this scope
  activeProviderId: string

  // Provider-specific configurations
  providers: {
    [providerId: string]: ProviderConfig
  }

  // Default generation settings
  defaults: GenerationSettings

  // Per-workspace overrides
  workspaceOverrides?: {
    [workspacePath: string]: Partial<ProviderConfiguration>
  }
}

interface ProviderConfig {
  enabled: boolean

  // API key (stored securely, referenced by ID)
  apiKeyId?: string

  // OAuth token (if applicable)
  oauthTokenId?: string

  // Default model for this provider
  defaultModel: string

  // Provider-specific settings
  settings?: {
    baseURL?: string // For custom endpoints (e.g., Azure OpenAI)
    organizationId?: string // OpenAI-specific
    region?: string // AWS Bedrock, etc.
    version?: string // API version
  }
}

interface GenerationSettings {
  temperature?: number
  topP?: number
  maxTokens?: number
  stream?: boolean
  systemMessage?: string
}
```

### 2.2 Secure Credential Storage

**IMPORTANT:** Use VS Code's `secretStorage` API for all API keys and sensitive credentials:

```typescript
class SecureCredentialManager {
  constructor(private context: vscode.ExtensionContext) {}

  // Store API key securely
  async storeApiKey(providerId: string, apiKey: string): Promise<string> {
    const keyId = `${providerId}.apiKey.${Date.now()}`
    await this.context.secrets.store(keyId, apiKey)
    return keyId // Return ID to store in config (not the actual key)
  }

  // Retrieve API key
  async getApiKey(keyId: string): Promise<string | undefined> {
    return await this.context.secrets.get(keyId)
  }

  // Delete API key
  async deleteApiKey(keyId: string): Promise<void> {
    await this.context.secrets.delete(keyId)
  }

  // List all credential IDs for a provider
  async listCredentials(providerId: string): Promise<string[]> {
    // Scan secret storage for keys matching pattern
  }
}
```

**Migration Needed:** Current implementation uses `globalState` for Clerk tokens. These should migrate to `secretStorage` for better security.

### 2.3 Configuration Scopes

Configuration is hierarchical and merged in the following order:

1. **Global Settings** (User-level)
   - Stored in: `globalState`
   - Scope: All VS Code instances
   - Use case: Default provider, API keys, default models

2. **Workspace Settings** (Workspace-level)
   - Stored in: `workspaceState`
   - Scope: Current workspace
   - Use case: Team-specific providers, project defaults

3. **Project Settings** (Project-level)
   - Stored in: `.agentful/providers.json` (gitignored)
   - Scope: Current project/repository
   - Use case: Project-specific models, cost allocation

```typescript
class ConfigurationManager {
  async getEffectiveConfig(workspacePath?: string): Promise<ProviderConfiguration> {
    // Merge: global -> workspace -> project
    const global = await this.getGlobalConfig()
    const workspace = workspacePath ? await this.getWorkspaceConfig(workspacePath) : {}
    const project = workspacePath ? await this.getProjectConfig(workspacePath) : {}

    return deepMerge({}, global, workspace, project)
  }
}
```

### 2.4 Configuration UI

#### Sidebar - Quick Settings
- **Active Provider Toggle** - Switch between providers
- **Model Selector** - Quick model selection
- **Connection Status** - Visual indicator (green/red/yellow)
- **Quick Actions** - Test connection, rotate API key

#### Main Panel - Full Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ Provider Configuration                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─ Active Provider ─────────────────────────────────────┐  │
│ │ ◉ Claude  ○ OpenAI  ○ Gemini                         │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Claude Configuration ───────────────────────────────┐  │
│ │                                                       │  │
│ │ API Key        [•••••••••••••••••]  [Test] [Rotate] │  │
│ │ Model          [claude-3-5-sonnet ▼]                 │  │
│ │ Base URL       [https://api.anthropic.com]          │  │
│ │                                                       │  │
│ │ Generation Settings                                   │  │
│ │ Temperature    [0.7]                    (0.0 - 1.0) │  │
│ │ Max Tokens     [4096]                               │  │
│ │ Top P          [1.0]                    (0.0 - 1.0) │  │
│ │                                                       │  │
│ │ [Save Configuration]                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Workspace Override ─────────────────────────────────┐  │
│ │ ☑ Use workspace-specific settings                     │  │
│ │ Override for: /Users/blitz/Development/agentful       │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. MCP Server Integration

### 3.1 What Are MCP Servers?

**MCP (Model Context Protocol)** servers are external services that provide tools, resources, and prompts to AI agents. They enable:
- **Tools** - External functions AI can call (e.g., file system, database queries, API calls)
- **Resources** - Data sources (e.g., documentation, codebases, APIs)
- **Prompts** - Pre-built prompt templates

### 3.2 MCP Server Discovery

```typescript
interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  type: 'stdio' | 'sse' // Transport type

  // Server executable (for stdio) or URL (for SSE)
  command?: string
  args?: string[]
  url?: string

  // Capabilities
  capabilities: {
    tools: boolean
    resources: boolean
    prompts: boolean
  }

  // Configuration
  env?: Record<string, string> // Environment variables
  timeout?: number // Request timeout
}

class MCPServerRegistry {
  // Discover MCP servers from:
  // 1. User configuration (~/.agentful/mcp-servers.json)
  // 2. Workspace configuration (.agentful/mcp-servers.json)
  // 3. npm packages (@agentful/mcp-server-*)
  async discover(): Promise<MCPServer[]> { }

  // Register a server
  async register(server: MCPServer): Promise<void> { }

  // Start a server
  async start(serverId: string): Promise<MCPClient> { }

  // Stop a server
  async stop(serverId: string): Promise<void> { }

  // List running servers
  listRunning(): MCPClient[] { }
}
```

### 3.3 MCP Server Management UI

**Location:** Sidebar tree view

```
┌─ MCP Servers ──────────────────────────────────────────────┐
│                                                             │
│ ▶ agentful-mcp-server          [● Running]                 │
│   └─ Memory (supermemory.ai)                               │
│                                                             │
│ ▶ filesystem                   [● Running]                 │
│   ├─ Tools: 12                                            │
│   └─ Resources: 0                                          │
│                                                             │
│ ▶ github                      [⚪ Stopped]                 │
│   └─ Tools: 5                                             │
│                                                             │
│ [+ Add Server]                                              │
└─────────────────────────────────────────────────────────────┘
```

**Clicking a server shows:**
- Server details (name, version, description)
- Available tools (with parameters)
- Available resources (with URIs)
- Connection status
- Start/Stop toggle
- Configuration button

### 3.4 MCP Client Integration

```typescript
class MCPClient {
  // List available tools from server
  async listTools(): Promise<Tool[]> { }

  // Call a tool
  async callTool(name: string, args: unknown): Promise<ToolResult> { }

  // List resources
  async listResources(): Promise<Resource[]> { }

  // Read a resource
  async readResource(uri: string): Promise<string> { }

  // List prompts
  async listPrompts(): Promise<Prompt[]> { }

  // Get a prompt
  async getPrompt(name: string, args?: unknown): Promise<string> { }
}
```

### 3.5 MCP Server Configuration

**User-level** (`~/.agentful/mcp-servers.json`):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@agentful/mcp-server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/blitz/Development"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@agentful/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}" // References secret storage
      }
    }
  }
}
```

**Workspace-level** (`.agentful/mcp-servers.json`):
```json
{
  "mcpServers": {
    "project-docs": {
      "command": "node",
      "args": ["./scripts/mcp-server.js"],
      "env": {
        "DOCS_PATH": "./docs"
      }
    }
  }
}
```

---

## 4. Skills & Agents Integration

### 4.1 Skills Definition

**Skills.sh Pattern:**
- Reusable prompt templates
- Parameterized inputs
- Output formats (text, JSON, artifacts)
- Version controlled in `.claude/skills/`

```typescript
interface Skill {
  id: string
  name: string
  description: string
  category: string

  // Prompt template
  template: string

  // Parameters
  parameters: SkillParameter[]

  // Expected output format
  outputFormat: 'text' | 'json' | 'artifact'

  // Required provider capabilities
  requiredCapabilities: Partial<ProviderCapabilities>
}

interface SkillParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  default?: unknown
}
```

**Example Skill** (`.claude/skills/code-review/SKILL.md`):
```markdown
# Code Review Skill

Review code changes for bugs, security issues, and best practices.

## Parameters
- `diff` - Git diff or code changes (required)
- `language` - Programming language (optional)
- `focus` - Areas to focus on (optional: security, performance, readability)

## Output
JSON with:
```json
{
  "issues": [{ "line": 10, "severity": "high", "message": "..." }],
  "suggestions": ["..."],
  "summary": "..."
}
```

## Required Capabilities
- No special requirements
```

### 4.2 Custom Agents (Claude Code Pattern)

**Location:** `.claude/agents/<agent-name>.md`

```markdown
# Frontend Developer Agent

You are a senior frontend developer specializing in React, TypeScript, and modern web development.

## Responsibilities
- Build React components using TypeScript
- Follow project coding standards
- Write tests for all components
- Ensure accessibility (WCAG 2.1 AA)

## Tech Stack
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- shadcn/ui

## Constraints
- No external UI libraries beyond shadcn/ui
- Use functional components with hooks
- Prefer composition over inheritance
```

### 4.3 Agent Registry & Discovery

```typescript
class AgentRegistry {
  // Discover agents from:
  // 1. .claude/agents/*.md (project-specific)
  // 2. ~/.agentful/agents/*.md (user-defined)
  // 3. @agentful/agent-* npm packages

  async discover(projectPath?: string): Promise<Agent[]> {
    const projectAgents = await this.loadFromDirectory(`${projectPath}/.claude/agents`)
    const userAgents = await this.loadFromDirectory('~/.agentful/agents')
    const builtinAgents = await this.loadBuiltinAgents()

    return [...projectAgents, ...userAgents, ...builtinAgents]
  }

  async loadFromDirectory(dir: string): Promise<Agent[]> {
    // Parse *.md files, extract metadata
  }
}
```

### 4.4 Agent Management UI

**Location:** Main panel - "Agents" tab

```
┌─ Agents ──────────────────────────────────────────────────────┐
│                                                              │
│ [+ Create Agent]  [Import from Gallery]                      │
│                                                              │
│ ┌─ Project Agents ─────────────────────────────────────────┐│
│ │                                                            ││
│ │ 📄 Frontend Developer                      [Edit] [Delete]││
│ │    React, TypeScript, Tailwind CSS                       ││
│ │                                                            ││
│ │ 📄 Backend Developer                       [Edit] [Delete]││
│ │    Node.js, Express, PostgreSQL                          ││
│ │                                                            ││
│ └────────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─ Built-in Agents ───────────────────────────────────────┐│
│ │                                                            ││
│ │ 🤖 Orchestrator                                          ││
│ │    Coordinates development workflow                      ││
│ │                                                            ││
│ │ 🧪 Tester                                                ││
│ │    Writes and runs tests                                 ││
│ │                                                            ││
│ └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Clicking an agent shows:**
- Full agent definition
- Edit button (opens agent editor)
- Delete button (for custom agents)
- Usage stats (how many times invoked)
- Recent conversations

### 4.5 Skills Execution UI

**Location:** Sidebar - "Skills" quick access

```
┌─ Skills ──────────────────────────────────────────────────────┐
│                                                              │
│ 🔍 [Search skills...]                                        │
│                                                              │
│ Code Review              [▶]                                 │
│ Review code for bugs and issues                              │
│                                                              │
│ Generate Tests          [▶]                                 │
│ Generate unit tests for code                                 │
│                                                              │
│ Refactor Code           [▶]                                 │
│ Improve code quality and structure                           │
│                                                              │
│ Documentation           [▶]                                 │
│ Generate JSDoc comments                                         │
│                                                              │
└────────────────────────────────────────────────────────────────┘
```

**Clicking [▶] opens a dialog:**
```
┌─ Run Skill: Code Review ─────────────────────────────────────┐
│                                                              │
│ Review code changes for bugs and security issues.            │
│                                                              │
│ Parameters:                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Code/Diff:                                              │ │
│ │ ┌────────────────────────────────────────────────────┐ │ │
│ │ │ function add(a, b) {                               │ │ │
│ │ │   return a + b                                     │ │ │
│ │ │ }                                                  │ │ │
│ │ └────────────────────────────────────────────────────┘ │ │
│ │                                                          │ │
│ │ Focus: [Security ▼]                                     │ │
│ │                                                          │ │
│ │ Language: [TypeScript ▼]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Provider: [Claude 3.5 Sonnet ▼]                              │
│                                                              │
│                [Cancel]  [Run Skill]                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Project-Based Workflow

### 5.1 Project Detection

agentful Studio automatically detects agentful projects by looking for:

1. `.agentful/` directory
2. `.claude/` directory
3. `package.json` with `@itz4blitz/agentful` dependency

```typescript
class ProjectDetector {
  async detect(workspaceFolders: vscode.WorkspaceFolder[]): Promise<ProjectInfo[]> {
    const projects: ProjectInfo[] = []

    for (const folder of workspaceFolders) {
      const agentfulDir = path.join(folder.uri.fsPath, '.agentful')
      const claudeDir = path.join(folder.uri.fsPath, '.claude')

      if (await fs.pathExists(agentfulDir) || await fs.pathExists(claudeDir)) {
        projects.push({
          path: folder.uri.fsPath,
          name: path.basename(folder.uri.fsPath),
          type: await this.detectProjectType(folder.uri.fsPath),
          hasAgents: await fs.pathExists(path.join(claudeDir, 'agents')),
          hasSkills: await fs.pathExists(path.join(claudeDir, 'skills')),
          hasProductSpec: await fs.pathExists(path.join(claudeDir, 'product')),
        })
      }
    }

    return projects
  }
}
```

### 5.2 Project-Specific Configuration

When a project is detected, agentful Studio:

1. **Loads project config** from `.agentful/providers.json`:
```json
{
  "activeProviderId": "anthropic",
  "providers": {
    "anthropic": {
      "enabled": true,
      "defaultModel": "claude-3-5-sonnet-20241022",
      "apiKeyId": "sk-ant-..."
    }
  },
  "defaults": {
    "temperature": 0.7,
    "maxTokens": 4096
  }
}
```

2. **Discovers project agents** from `.claude/agents/*.md`

3. **Loads project skills** from `.claude/skills/*/SKILL.md`

4. **Syncs MCP servers** from `.agentful/mcp-servers.json`

### 5.3 Project Status Indicator

**Sidebar shows:**
```
┌─ Active Project ─────────────────────────────────────────────┐
│                                                              │
│ 📦 agentful Studio                                           │
│    /Users/blitz/Development/agentful/packages/studio        │
│                                                              │
│ Status: ✅ agentful project detected                         │
│                                                              │
│ Agents: 3 project, 8 built-in                                │
│ Skills: 12                                                   │
│ MCP Servers: 2 running                                       │
│                                                              │
│ [Open Project Settings]                                      │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 Team/Organization Configuration

**Shared configuration** (optional, via cloud sync):

```typescript
interface OrganizationConfig {
  id: string
  name: string

  // Organization-wide providers
  providers: {
    [providerId: string]: {
      enabled: boolean
      // Note: No API keys stored here - just enabled/disabled
      defaultModel: string
    }
  }

  // Shared agents (read-only for team members)
  agents: Agent[]

  // Shared skills (read-only for team members)
  skills: Skill[]
}

class OrganizationConfigManager {
  async fetch(orgId: string): Promise<OrganizationConfig> {
    // Fetch from agentful.cloud (Clerk backend)
  }

  async sync(projectPath: string): Promise<void> {
    // Sync org config to project
  }
}
```

---

## 6. Security Considerations

### 6.1 API Key Storage

**RULES:**
1. ✅ Always use VS Code's `secretStorage` API for API keys
2. ✅ Never store API keys in `globalState`, `workspaceState`, or files
3. ✅ Reference keys by ID in configuration (not actual key value)
4. ✅ Clear secret storage when extension is uninstalled
5. ❌ Never log API keys (even in debug mode)

**Migration:**
```typescript
// Migrate existing Clerk tokens from globalState to secretStorage
async function migrateCredentials(context: vscode.ExtensionContext) {
  const oldToken = context.globalState.get<string>('agentful.clerk.token')
  if (oldToken) {
    await context.secrets.store('agentful.clerk.token', oldToken)
    await context.globalState.update('agentful.clerk.token', undefined)
  }
}
```

### 6.2 API Key Rotation

**UI Support:**
- "Rotate" button next to API key field
- Validates new key before saving
- Automatically updates all references
- Clears old key from secret storage

```typescript
async rotateApiKey(providerId: string, oldKeyId: string, newApiKey: string): Promise<void> {
  // Validate new key
  const provider = registry.get(providerId)
  const isValid = await provider.validateCredentials({ apiKey: newApiKey })

  if (!isValid) {
    throw new Error('Invalid API key')
  }

  // Store new key
  const newKeyId = await this.credentials.storeApiKey(providerId, newApiKey)

  // Update all config references
  await this.updateConfigReferences(oldKeyId, newKeyId)

  // Delete old key
  await this.credentials.deleteApiKey(oldKeyId)
}
```

### 6.3 OAuth Token Management

For providers that support OAuth (e.g., Clerk):

```typescript
class OAuthTokenManager {
  // Store OAuth tokens (with refresh token support)
  async storeToken(providerId: string, token: OAuthToken): Promise<void> {
    await this.context.secrets.store(`${providerId}.oauth`, JSON.stringify(token))
  }

  // Auto-refresh tokens before expiry
  async getValidToken(providerId: string): Promise<string | null> {
    const tokenData = await this.context.secrets.get(`${providerId}.oauth`)
    if (!tokenData) return null

    const token = JSON.parse(tokenData) as OAuthToken

    // Refresh if expiring soon (< 5 minutes)
    if (token.expiresAt - Date.now() < 300000) {
      return await this.refreshToken(providerId, token.refreshToken)
    }

    return token.accessToken
  }
}
```

### 6.4 Environment Variables

Allow environment variable references in configuration:

```typescript
interface ProviderConfig {
  apiKeyId?: string
  // Reference environment variable instead of storing key
  apiKeyEnvVar?: string // e.g., "ANTHROPIC_API_KEY"
}

async resolveCredential(config: ProviderConfig): Promise<string | undefined> {
  if (config.apiKeyId) {
    return await this.credentials.getApiKey(config.apiKeyId)
  }

  if (config.apiKeyEnvVar) {
    return process.env[config.apiKeyEnvVar]
  }

  return undefined
}
```

**Security Note:** Environment variables are less secure than `secretStorage`. Prefer `secretStorage` unless key must be shared with external tools.

### 6.5 Audit Logging

Track credential usage (for security audits):

```typescript
interface CredentialAuditLog {
  timestamp: string
  providerId: string
  action: 'create' | 'read' | 'delete' | 'rotate'
  workspacePath?: string
  success: boolean
}

class AuditLogger {
  async log(event: CredentialAuditLog): Promise<void> {
    // Store in separate secure log (not secret storage)
    await this.context.globalState.update(
      `audit.${Date.now()}`,
      redactSensitiveData(event)
    )
  }

  async exportAuditLog(): Promise<CredentialAuditLog[]> {
    // Export for security review
  }
}
```

---

## 7. Sidebar vs Main UI Responsibilities

### 7.1 Sidebar (Quick Access & Status)

**Purpose:** Always-visible status and quick actions

**Components:**
- **Active Project Card** - Show current project, detection status
- **Provider Status** - Connection status indicator (green/red/yellow)
- **Provider Quick Switch** - Toggle between providers
- **Model Selector** - Quick model selection
- **MCP Server Status** - Running servers with indicators
- **Skills Quick Access** - Most-used skills with [▶] buttons
- **Agent Status** - Active agent indicator

**Interaction:**
- Single-click actions
- No complex forms
- Status indicators only (not detailed info)
- Quick toggles and switches

### 7.2 Main Panel (Full Configuration & Execution)

**Purpose:** Detailed configuration and complex workflows

**Tabs:**
1. **Providers** - Full provider configuration
2. **Agents** - Agent management and editor
3. **Skills** - Skill browser and execution
4. **MCP Servers** - Server management
5. **Chat** - AI conversation interface (future)
6. **Project** - Project-specific settings

**Interactions:**
- Multi-step forms
- Detailed configuration panels
- Code editors (for agents/skills)
- Tree views and lists
- Complex wizards

---

## 8. Implementation Phases

### Phase 1: Core Provider Abstraction (Week 1-2)
- [ ] Define `AIProvider` interface
- [ ] Implement `ClaudeProvider`
- [ ] Implement `OpenAIProvider`
- [ ] Create `ProviderRegistry`
- [ ] Migrate credential storage to `secretStorage`

### Phase 2: Configuration UI (Week 2-3)
- [ ] Build provider configuration panel
- [ ] Implement secure credential manager
- [ ] Add configuration hierarchy (global/workspace/project)
- [ ] Create provider quick switch in sidebar

### Phase 3: MCP Server Integration (Week 3-4)
- [ ] Implement MCP server registry
- [ ] Build MCP server discovery
- [ ] Create MCP management UI
- [ ] Integrate MCP tools with agents

### Phase 4: Skills & Agents (Week 4-5)
- [ ] Build agent registry and discovery
- [ ] Create skill loader and executor
- [ ] Implement agent management UI
- [ ] Add skill execution dialog

### Phase 5: Project Workflow (Week 5-6)
- [ ] Implement project detection
- [ ] Build project-specific config loading
- [ ] Create project status indicator
- [ ] Add team/org configuration sync

### Phase 6: Testing & Polish (Week 6-7)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation

---

## 9. Extension Points

### 9.1 Custom Providers

Users can add custom providers by:

1. **Writing a provider class:**
```typescript
class CustomProvider implements AIProvider {
  id = 'custom'
  name = 'My Custom Provider'
  // ... implement interface
}
```

2. **Registering in user config:**
```json
{
  "customProviders": [
    {
      "module": "./custom-provider.js",
      "className": "CustomProvider"
    }
  ]
}
```

### 9.2 Custom MCP Servers

Users can:
- Write custom MCP servers (any language)
- Register in `.agentful/mcp-servers.json`
- Share via npm packages (`@scope/mcp-server-*`)

### 9.3 Agent Templates

Distribute agent definitions via:
- npm packages (`@agentful/agent-*`)
- GitHub repositories
- Agentful marketplace (future)

---

## 10. API Reference

### 10.1 Provider API

```typescript
// Get active provider
const provider = await providerRegistry.getActive()

// Generate completion
const response = await provider.generate({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
  maxTokens: 4096,
})

// Stream completion
for await (const chunk of provider.stream(request)) {
  console.log(chunk.content)
}
```

### 10.2 MCP Client API

```typescript
// Start MCP server
const client = await mcpRegistry.start('filesystem')

// List tools
const tools = await client.listTools()

// Call tool
const result = await client.callTool('read_file', {
  path: '/Users/blitz/Development/agentful/README.md'
})
```

### 10.3 Skill Execution API

```typescript
// Execute skill
const result = await skillExecutor.execute({
  skillId: 'code-review',
  parameters: {
    diff: '...',
    language: 'TypeScript',
    focus: 'security'
  },
  provider: 'claude',
  model: 'claude-3-5-sonnet-20241022'
})
```

---

## 11. Migration Path

### 11.1 From Current Implementation

**Current State:**
- Clerk auth using `globalState` (❌ not secure)
- Basic provider config UI (✅ exists but needs enhancement)
- No MCP server support (❌ missing)
- No agent/skills integration (❌ missing)

**Migration Steps:**
1. ✅ Keep existing `ProviderConfig.tsx` UI as base
2. ❌ Migrate Clerk tokens to `secretStorage`
3. ❌ Add provider abstraction layer
4. ❌ Implement MCP server registry
5. ❌ Build agent/skills discovery

### 11.2 Backward Compatibility

**Preserve:**
- Existing `ProviderConfig` component interface
- Current configuration structure
- User settings and preferences

**Extend:**
- Add new properties to interfaces (with defaults)
- Introduce new features as opt-in
- Provide migration scripts for credential storage

---

## 12. Future Enhancements

### 12.1 Agent Marketplace
- Browse and install community agents
- Rate and review agents
- Agent templates and scaffolds

### 12.2 Cost Tracking
- Track token usage per provider
- Estimate costs per project
- Budget alerts and limits

### 12.3 Multi-Provider Routing
- Route requests based on capability requirements
- Load balancing across providers
- Automatic fallback on errors

### 12.4 Fine-Tuning Support
- Upload custom models
- Fine-tune models on project codebase
- Deploy custom endpoints

### 12.5 Collaboration Features
- Share agent configurations via Git
- Team agent libraries
- Organization-wide standards

---

## Conclusion

This architecture provides a **flexible, secure, and extensible** foundation for agentful Studio's AI tooling integration. The provider abstraction layer enables seamless switching between AI providers, while MCP server integration and skills/agents support create a powerful ecosystem for AI-assisted development.

**Key Success Factors:**
1. **Security First** - All credentials in `secretStorage`
2. **User Experience** - Simple UI for common tasks, advanced options available
3. **Extensibility** - Easy to add new providers, servers, skills, agents
4. **Project-Aware** - Configuration at global, workspace, and project levels
5. **Performance** - Lazy loading, connection pooling, caching

The implementation is phased to deliver value incrementally while building toward the full vision.
