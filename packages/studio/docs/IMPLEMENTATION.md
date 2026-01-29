# Implementation Quick Reference

## Type Definitions

Copy these into `/Users/blitz/Development/agentful/packages/studio/src/types/ai-providers.ts`:

```typescript
/**
 * Provider Abstraction Layer Types
 */

export interface AIProvider {
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

export interface AIModel {
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

export interface ProviderCapabilities {
  streaming: boolean
  functionCalling: boolean
  vision: boolean
  tools: boolean
  artifacts: boolean
  systemMessages: boolean
  temperature: boolean
  topP: boolean
  maxTokens: boolean
}

export interface ProviderCredentials {
  apiKey?: string
  oauthToken?: string
  baseURL?: string
  organizationId?: string
  region?: string
}

export interface GenerationRequest {
  model: string
  messages: Message[]
  temperature?: number
  topP?: number
  maxTokens?: number
  stream?: boolean
  tools?: Tool[]
  systemMessage?: string
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentBlock[]
}

export interface ContentBlock {
  type: 'text' | 'image'
  text?: string
  source?: { type: string; media_type: string; data: string }
}

export interface Tool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface GenerationResponse {
  content: string
  finishReason: 'stop' | 'length' | 'tool_use' | 'error'
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  toolCalls?: ToolCall[]
  artifacts?: Artifact[]
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface Artifact {
  type: 'code' | 'text' | 'document'
  title?: string
  content: string
  language?: string
}

export interface GenerationChunk {
  content: string
  finishReason?: string
  delta?: string
}

// MCP Types
export interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  type: 'stdio' | 'sse'
  command?: string
  args?: string[]
  url?: string
  capabilities: {
    tools: boolean
    resources: boolean
    prompts: boolean
  }
  env?: Record<string, string>
  timeout?: number
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface MCPResource {
  uri: string
  name: string
  description: string
  mimeType?: string
}

export interface MCPPrompt {
  name: string
  description: string
  arguments?: Record<string, unknown>
}

// Skill Types
export interface Skill {
  id: string
  name: string
  description: string
  category: string
  template: string
  parameters: SkillParameter[]
  outputFormat: 'text' | 'json' | 'artifact'
  requiredCapabilities: Partial<ProviderCapabilities>
}

export interface SkillParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  default?: unknown
}

// Agent Types
export interface Agent {
  id: string
  name: string
  description: string
  category: string
  instructions: string
  techStack?: string[]
  constraints?: string[]
}

// Configuration Types
export interface ProviderConfiguration {
  activeProviderId: string
  providers: {
    [providerId: string]: ProviderConfig
  }
  defaults: GenerationSettings
  workspaceOverrides?: {
    [workspacePath: string]: Partial<ProviderConfiguration>
  }
}

export interface ProviderConfig {
  enabled: boolean
  apiKeyId?: string
  oauthTokenId?: string
  defaultModel: string
  settings?: {
    baseURL?: string
    organizationId?: string
    region?: string
    version?: string
  }
}

export interface GenerationSettings {
  temperature?: number
  topP?: number
  maxTokens?: number
  stream?: boolean
  systemMessage?: string
}
```

---

## Provider Registry Implementation

Create `/Users/blitz/Development/agentful/packages/studio/src/services/ai-providers/provider-registry.ts`:

```typescript
import type { AIProvider } from '@/types/ai-providers'

export class ProviderRegistry {
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

  getEnabled(enabledProviders: Record<string, boolean>): AIProvider[] {
    return this.listAll().filter((p) => enabledProviders[p.id])
  }

  async getActive(
    activeProviderId: string,
    enabledProviders: Record<string, boolean>
  ): Promise<AIProvider | undefined> {
    const provider = this.get(activeProviderId)
    if (!provider) return undefined
    if (!enabledProviders[activeProviderId]) return undefined
    return provider
  }
}

// Singleton instance
export const providerRegistry = new ProviderRegistry()
```

---

## Secure Credential Manager

Create `/Users/blitz/Development/agentful/packages/studio/vscode/services/secure-credential-manager.ts`:

```typescript
import * as vscode from 'vscode'

export class SecureCredentialManager {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Store API key securely in VS Code secretStorage
   */
  async storeApiKey(providerId: string, apiKey: string): Promise<string> {
    const keyId = `${providerId}.apiKey.${Date.now()}`
    await this.context.secrets.store(keyId, apiKey)
    return keyId
  }

  /**
   * Retrieve API key from secretStorage
   */
  async getApiKey(keyId: string): Promise<string | undefined> {
    return await this.context.secrets.get(keyId)
  }

  /**
   * Delete API key from secretStorage
   */
  async deleteApiKey(keyId: string): Promise<void> {
    await this.context.secrets.delete(keyId)
  }

  /**
   * List all credential IDs for a provider
   */
  async listCredentials(providerId: string): Promise<string[]> {
    // This would require enumerating secretStorage keys
    // VS Code doesn't provide a built-in way to list all secrets
    // Alternative: Track key IDs in globalState
    const trackedKeys = this.context.globalState.get<string[]>(
      `${providerId}.trackedKeys`,
      []
    )
    return trackedKeys
  }

  /**
   * Track a credential ID for later listing
   */
  async trackCredential(providerId: string, keyId: string): Promise<void> {
    const trackedKeys = await this.listCredentials(providerId)
    trackedKeys.push(keyId)
    await this.context.globalState.update(
      `${providerId}.trackedKeys`,
      trackedKeys
    )
  }

  /**
   * Rotate API key (validate new key, replace old key)
   */
  async rotateApiKey(
    providerId: string,
    oldKeyId: string,
    newApiKey: string,
    validateFn?: (apiKey: string) => Promise<boolean>
  ): Promise<string> {
    // Validate new key if validator provided
    if (validateFn) {
      const isValid = await validateFn(newApiKey)
      if (!isValid) {
        throw new Error('Invalid API key')
      }
    }

    // Store new key
    const newKeyId = await this.storeApiKey(providerId, newApiKey)

    // Update tracking
    await this.trackCredential(providerId, newKeyId)

    // Remove old key from tracking (but don't delete from secretStorage yet)
    const trackedKeys = await this.listCredentials(providerId)
    const updatedKeys = trackedKeys.filter((k) => k !== oldKeyId)
    await this.context.globalState.update(
      `${providerId}.trackedKeys`,
      updatedKeys
    )

    // Delete old key
    await this.deleteApiKey(oldKeyId)

    return newKeyId
  }
}
```

---

## Configuration Manager

Create `/Users/blitz/Development/agentful/packages/studio/vscode/services/configuration-manager.ts`:

```typescript
import * as vscode from 'vscode'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { ProviderConfiguration } from '@/types/ai-providers'

export class ConfigurationManager {
  private readonly GLOBAL_CONFIG_KEY = 'agentful.providerConfig'
  private readonly WORKSPACE_CONFIG_KEY = 'agentful.workspaceProviderConfig'

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Get global configuration
   */
  async getGlobalConfig(): Promise<ProviderConfiguration> {
    const config = this.context.globalState.get<ProviderConfiguration>(
      this.GLOBAL_CONFIG_KEY
    )
    return config || this.getDefaultConfig()
  }

  /**
   * Save global configuration
   */
  async saveGlobalConfig(config: ProviderConfiguration): Promise<void> {
    await this.context.globalState.update(this.GLOBAL_CONFIG_KEY, config)
  }

  /**
   * Get workspace configuration
   */
  async getWorkspaceConfig(): Promise<Partial<ProviderConfiguration>> {
    const config = this.context.workspaceState.get<Partial<ProviderConfiguration>>(
      this.WORKSPACE_CONFIG_KEY
    )
    return config || {}
  }

  /**
   * Save workspace configuration
   */
  async saveWorkspaceConfig(
    config: Partial<ProviderConfiguration>
  ): Promise<void> {
    await this.context.workspaceState.update(this.WORKSPACE_CONFIG_KEY, config)
  }

  /**
   * Get project configuration from .agentful/providers.json
   */
  async getProjectConfig(
    workspacePath?: string
  ): Promise<Partial<ProviderConfiguration>> {
    if (!workspacePath) return {}

    try {
      const configPath = path.join(workspacePath, '.agentful', 'providers.json')
      const configContent = await fs.readFile(configPath, 'utf-8')
      return JSON.parse(configContent)
    } catch (error) {
      // File doesn't exist or is invalid
      return {}
    }
  }

  /**
   * Save project configuration to .agentful/providers.json
   */
  async saveProjectConfig(
    workspacePath: string,
    config: Partial<ProviderConfiguration>
  ): Promise<void> {
    const agentfulDir = path.join(workspacePath, '.agentful')
    await fs.mkdir(agentfulDir, { recursive: true })

    const configPath = path.join(agentfulDir, 'providers.json')
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))
  }

  /**
   * Get effective configuration (merged from all scopes)
   */
  async getEffectiveConfig(): Promise<ProviderConfiguration> {
    const workspaceFolders = vscode.workspace.workspaceFolders
    const workspacePath = workspaceFolders?.[0]?.uri.fsPath

    const global = await this.getGlobalConfig()
    const workspace = workspacePath ? await this.getWorkspaceConfig() : {}
    const project = workspacePath ? await this.getProjectConfig(workspacePath) : {}

    return this.deepMerge({}, global, workspace, project)
  }

  /**
   * Deep merge multiple objects
   */
  private deepMerge(...objs: Record<string, unknown>[]): Record<string, unknown> {
    const result = {}

    for (const obj of objs) {
      for (const [key, value] of Object.entries(obj)) {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          key in result &&
          typeof result[key] === 'object' &&
          !Array.isArray(result[key])
        ) {
          result[key] = this.deepMerge(
            result[key] as Record<string, unknown>,
            value as Record<string, unknown>
          )
        } else {
          result[key] = value
        }
      }
    }

    return result
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ProviderConfiguration {
    return {
      activeProviderId: 'anthropic',
      providers: {},
      defaults: {
        temperature: 0.7,
        maxTokens: 4096,
      },
    }
  }
}
```

---

## Webview Message Extensions

Extend `/Users/blitz/Development/agentful/packages/studio/vscode/webview/message-handler.ts`:

```typescript
// Add to existing message handler switch statement

case 'getProviderConfig':
  const config = await configManager.getEffectiveConfig()
  webview.postMessage({
    command: 'providerConfig',
    config
  })
  return

case 'saveProviderConfig':
  await configManager.saveGlobalConfig(message.config)
  webview.postMessage({
    command: 'providerConfigSaved',
    config: message.config
  })
  vscode.window.showInformationMessage('Provider configuration saved')
  return

case 'storeApiKey':
  const keyId = await credentialManager.storeApiKey(
    message.providerId,
    message.apiKey
  )
  webview.postMessage({
    command: 'apiKeyStored',
    providerId: message.providerId,
    keyId
  })
  return

case 'validateApiKey':
  const provider = providerRegistry.get(message.providerId)
  if (provider && provider.validateCredentials) {
    const isValid = await provider.validateCredentials({
      apiKey: message.apiKey
    })
    webview.postMessage({
      command: 'apiKeyValidated',
      providerId: message.providerId,
      valid: isValid
    })
  }
  return
```

---

## React Component: Provider Configuration Panel

Create `/Users/blitz/Development/agentful/packages/studio/src/components/providers/provider-config-panel.tsx`:

```typescript
"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, RotateCw } from "lucide-react"

interface ProviderConfigPanelProps {
  onConfigChange?: (config: ProviderConfiguration) => void
}

export function ProviderConfigPanel({ onConfigChange }: ProviderConfigPanelProps) {
  const [config, setConfig] = React.useState<ProviderConfiguration | null>(null)
  const [validating, setValidating] = React.useState(false)
  const [validationStatus, setValidationStatus] = React.useState<Record<string, boolean>>({})

  // Load config from extension
  React.useEffect(() => {
    vscode.postMessage({ command: 'getProviderConfig' })

    const handleMessage = (event: MessageEvent) => {
      switch (event.data.command) {
        case 'providerConfig':
          setConfig(event.data.config)
          break
        case 'apiKeyValidated':
          setValidationStatus(prev => ({
            ...prev,
            [event.data.providerId]: event.data.valid
          }))
          setValidating(false)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleSave = async () => {
    if (!config) return

    vscode.postMessage({
      command: 'saveProviderConfig',
      config
    })
  }

  const handleValidateKey = async (providerId: string) => {
    setValidating(true)
    vscode.postMessage({
      command: 'validateApiKey',
      providerId,
      apiKey: config?.providers[providerId]?.apiKey
    })
  }

  const handleRotateKey = async (providerId: string) => {
    const newKey = prompt('Enter new API key:')
    if (!newKey) return

    vscode.postMessage({
      command: 'rotateApiKey',
      providerId,
      oldKeyId: config?.providers[providerId]?.apiKeyId,
      newApiKey: newKey
    })
  }

  if (!config) {
    return <div>Loading configuration...</div>
  }

  const activeProvider = config.providers[config.activeProviderId]

  return (
    <div className="space-y-6">
      {/* Provider Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Active Provider</CardTitle>
          <CardDescription>
            Select the AI provider to use for completions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={config.activeProviderId}
            onValueChange={(value) =>
              setConfig({ ...config, activeProviderId: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(config.providers).map(([id, provider]) => (
                <SelectItem key={id} value={id}>
                  {provider.enabled ? '✓' : '✗'} {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Active Provider Configuration */}
      {activeProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{config.activeProviderId} Configuration</span>
              {validationStatus[config.activeProviderId] === true && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              {validationStatus[config.activeProviderId] === false && (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Failed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure your {config.activeProviderId} settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  value={activeProvider.apiKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      providers: {
                        ...config.providers,
                        [config.activeProviderId]: {
                          ...activeProvider,
                          apiKey: e.target.value
                        }
                      }
                    })
                  }
                  placeholder="Enter your API key"
                />
                <Button
                  variant="outline"
                  onClick={() => handleValidateKey(config.activeProviderId)}
                  disabled={validating || !activeProvider.apiKey}
                >
                  {validating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRotateKey(config.activeProviderId)}
                  title="Rotate API key"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={activeProvider.defaultModel}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    providers: {
                      ...config.providers,
                      [config.activeProviderId]: {
                        ...activeProvider,
                        defaultModel: value
                      }
                    }
                  })
                }
              >
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Load models from provider registry */}
                  <SelectItem value="claude-3-5-sonnet-20241022">
                    Claude 3.5 Sonnet
                  </SelectItem>
                  <SelectItem value="claude-3-opus-20240229">
                    Claude 3 Opus
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full">
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## Migration Script

Create `/Users/blitz/Development/agentful/packages/studio/vscode/migration/migrate-credentials.ts`:

```typescript
import * as vscode from 'vscode'

/**
 * Migrate existing credentials from globalState to secretStorage
 * Run this once on extension activation
 */
export async function migrateCredentials(context: vscode.ExtensionContext): Promise<void> {
  const MIGRATION_VERSION_KEY = 'agentful.credentialMigrationVersion'
  const CURRENT_VERSION = 1

  const currentVersion = context.globalState.get<number>(MIGRATION_VERSION_KEY, 0)

  if (currentVersion >= CURRENT_VERSION) {
    // Already migrated
    return
  }

  console.log('Migrating credentials to secretStorage...')

  try {
    // Migrate Clerk tokens
    const oldToken = context.globalState.get<string>('agentful.clerk.token')
    const oldUserId = context.globalState.get<string>('agentful.clerk.userId')
    const oldExpires = context.globalState.get<number>('agentful.clerk.token.expires')

    if (oldToken) {
      await context.secrets.store('agentful.clerk.token', oldToken)
      await context.globalState.update('agentful.clerk.token', undefined)
      console.log('Migrated Clerk token')
    }

    if (oldUserId) {
      await context.secrets.store('agentful.clerk.userId', oldUserId)
      await context.globalState.update('agentful.clerk.userId', undefined)
      console.log('Migrated Clerk user ID')
    }

    if (oldExpires) {
      await context.secrets.store('agentful.clerk.token.expires', oldExpires.toString())
      await context.globalState.update('agentful.clerk.token.expires', undefined)
      console.log('Migrated Clerk token expiration')
    }

    // Update migration version
    await context.globalState.update(MIGRATION_VERSION_KEY, CURRENT_VERSION)

    console.log('Credential migration complete')
  } catch (error) {
    console.error('Credential migration failed:', error)
    throw error
  }
}
```

Call this in `extension.ts` activate function:

```typescript
export async function activate(context: vscode.ExtensionContext) {
  console.log('agentful Studio is now active!')

  // Migrate credentials to secure storage
  await migrateCredentials(context)

  // ... rest of activation
}
```

---

## Testing the Implementation

### Unit Tests

```typescript
// src/services/ai-providers/__tests__/provider-registry.test.ts
import { describe, it, expect } from 'vitest'
import { ProviderRegistry } from '../provider-registry'
import type { AIProvider } from '@/types/ai-providers'

describe('ProviderRegistry', () => {
  it('should register and retrieve providers', () => {
    const registry = new ProviderRegistry()
    const mockProvider: AIProvider = {
      id: 'test',
      name: 'Test Provider',
      icon: 'test',
      description: 'Test',
      website: 'https://test.com',
      requiresAuth: true,
      authType: 'apiKey',
      models: [],
      capabilities: {
        streaming: false,
        functionCalling: false,
        vision: false,
        tools: false,
        artifacts: false,
        systemMessages: false,
        temperature: false,
        topP: false,
        maxTokens: false,
      },
      initialize: async () => {},
      generate: async () => ({
        content: 'test',
        finishReason: 'stop',
      }),
    }

    registry.register(mockProvider)

    expect(registry.get('test')).toBe(mockProvider)
    expect(registry.listAll()).toHaveLength(1)
  })
})
```

### Integration Tests

```typescript
// vscode/services/__tests__/secure-credential-manager.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SecureCredentialManager } from '../secure-credential-manager'

describe('SecureCredentialManager', () => {
  let mockContext: any

  beforeEach(() => {
    mockContext = {
      secrets: {
        store: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      },
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
      },
    }
  })

  it('should store API key securely', async () => {
    const manager = new SecureCredentialManager(mockContext)

    mockContext.secrets.get.mockResolvedValue(undefined)

    const keyId = await manager.storeApiKey('anthropic', 'sk-test-key')

    expect(mockContext.secrets.store).toHaveBeenCalledWith(
      expect.stringContaining('anthropic.apiKey.'),
      'sk-test-key'
    )
    expect(keyId).toContain('anthropic.apiKey.')
  })
})
```

---

## Quick Start Checklist

- [ ] Create type definitions in `src/types/ai-providers.ts`
- [ ] Implement `ProviderRegistry`
- [ ] Implement `SecureCredentialManager` with `secretStorage`
- [ ] Implement `ConfigurationManager` with hierarchy
- [ ] Extend webview message handler
- [ ] Build `ProviderConfigPanel` React component
- [ ] Run credential migration script
- [ ] Test API key storage and retrieval
- [ ] Test provider switching
- [ ] Test configuration persistence
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update documentation

---

## Next Steps

1. **Implement Claude Provider** - First concrete provider implementation
2. **Build MCP Server Registry** - Enable MCP server discovery and management
3. **Create Agent Registry** - Load and manage custom agents
4. **Build Skill Executor** - Run skills with parameterized prompts
5. **Project Detection** - Auto-detect agentful projects
6. **UI Polish** - Refine sidebar and main panel layouts
7. **Security Audit** - Review credential handling and storage
8. **Performance Testing** - Test with large projects and many agents/skills

---

**See Also:**
- `/Users/blitz/Development/agentful/packages/studio/docs/ARCHITECTURE.md` - Full architecture documentation
- `/Users/blitz/Development/agentful/packages/studio/docs/DIAGRAMS.md` - Visual diagrams
