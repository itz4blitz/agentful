# agentful Studio - AI Tooling Integration

## Overview

This directory contains the complete product architecture for **provider-agnostic AI tooling integration** in agentful Studio. The architecture enables seamless integration with multiple AI providers (Claude, OpenAI, Gemini, etc.), MCP servers, custom agents, and skills while maintaining a clean abstraction layer and enterprise-grade security.

---

## 📚 Documentation

### 1. [ARCHITECTURE.md](./ARCHITECTURE.md) - **Start Here**
Complete product architecture document covering:
- **Provider Abstraction Layer** - Unified interface for all AI providers
- **Configuration Management** - Global, workspace, and project-scoped settings
- **MCP Server Integration** - Model Context Protocol server discovery and management
- **Skills & Agents** - Custom agent and skill integration patterns
- **Project-Based Workflow** - Project detection and configuration
- **Security Considerations** - Secure credential storage with VS Code's `secretStorage` API
- **Sidebar vs Main UI** - Clear separation of quick access vs full configuration
- **Implementation Phases** - 6-week rollout plan
- **Extension Points** - Custom providers, servers, agents

### 2. [DIAGRAMS.md](./DIAGRAMS.md)
Visual architecture diagrams including:
- System Architecture Overview
- Provider Abstraction Layer
- Configuration Hierarchy
- Secure Credential Storage Flow
- MCP Server Integration
- Skills & Agents Workflow
- Project Detection & Loading
- Security Architecture

### 3. [IMPLEMENTATION.md](./IMPLEMENTATION.md) - **Quick Reference**
Code snippets and implementation guides:
- Type definitions (copy-paste ready)
- Provider Registry implementation
- Secure Credential Manager with `secretStorage`
- Configuration Manager with hierarchy
- Webview message extensions
- React components for configuration UI
- Migration script from `globalState` to `secretStorage`
- Testing examples
- Quick start checklist

---

## 🎯 Key Features

### Provider Agnostic Design
```typescript
// Switch between providers with a single line change
config.activeProviderId = 'openai' // Was 'anthropic'

// All providers implement the same interface
const response = await provider.generate({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7
})
```

### Secure by Default
- ✅ All API keys stored in VS Code's `secretStorage` (OS keychain encrypted)
- ✅ Configuration contains only key IDs, not actual keys
- ✅ Automatic migration from insecure `globalState`
- ✅ API key rotation support with validation
- ✅ Audit logging for security compliance

### MCP Server Integration
```typescript
// Discover and start MCP servers
const client = await mcpRegistry.start('filesystem')

// Call MCP tools from agents
const result = await client.callTool('read_file', {
  path: '/Users/blitz/Development/agentful/README.md'
})
```

### Custom Agents & Skills
```typescript
// Discover agents from .claude/agents/*.md
const agents = await agentRegistry.discover()

// Execute skills with parameters
const result = await skillExecutor.execute({
  skillId: 'code-review',
  parameters: {
    diff: '...',
    focus: 'security'
  }
})
```

### Project-Aware Configuration
```typescript
// Configuration hierarchy (highest priority wins)
const effectiveConfig = mergeConfigs({
  global:    { temperature: 0.7 },           // User defaults
  workspace: { activeProviderId: 'openai' }, // Team override
  project:   { maxTokens: 8192 }             // Project-specific
})
```

---

## 🏗️ Architecture Highlights

### 1. Provider Abstraction Layer

All AI providers implement a unified interface:

```typescript
interface AIProvider {
  id: string
  name: string
  models: AIModel[]
  capabilities: ProviderCapabilities

  initialize(credentials): Promise<void>
  generate(request): Promise<GenerationResponse>
  stream?(request): AsyncGenerator<GenerationChunk>
  validateCredentials?(credentials): Promise<boolean>
}
```

**Benefits:**
- No lock-in to any single provider
- Easy to add new providers
- Provider-specific features exposed via `capabilities`
- Consistent API across all providers

### 2. Configuration Hierarchy

Three levels of configuration (merged at runtime):

1. **Global Settings** (User-level, `globalState`)
   - Default provider, API keys, default models

2. **Workspace Settings** (Workspace-level, `workspaceState`)
   - Team-specific providers, project defaults

3. **Project Settings** (Project-level, `.agentful/providers.json`)
   - Project-specific models, cost allocation

**Benefits:**
- Flexible configuration at any scope
- Workspace overrides for teams
- Project-specific settings without git conflicts (gitignored)

### 3. Secure Credential Storage

**Before (Insecure):**
```typescript
// ❌ API keys in globalState (plain text)
await context.globalState.update('anthropic.apiKey', 'sk-ant-...')
```

**After (Secure):**
```typescript
// ✅ API keys in secretStorage (OS keychain encrypted)
const keyId = await credentialManager.storeApiKey('anthropic', 'sk-ant-...')
// Store only key ID in config
config.providers.anthropic.apiKeyId = keyId
```

**Benefits:**
- Keys encrypted by OS keychain (Keychain, Credential Locker)
- Keys isolated per VS Code instance
- Automatic cleanup on uninstall
- Audit logging without exposing sensitive data

### 4. MCP Server Integration

**What are MCP servers?**
External services that provide tools, resources, and prompts to AI agents.

**Examples:**
- `filesystem` - Read/write files
- `github` - Query GitHub repositories
- `supermemory` - Knowledge base search

**Integration:**
```json
// .agentful/mcp-servers.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@agentful/mcp-server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/blitz/Development"
      }
    }
  }
}
```

**Benefits:**
- Agents can call external tools
- Community can contribute servers
- Project-specific tooling

### 5. Skills & Agents

**Skills** - Reusable prompt templates with parameters:
```markdown
# Code Review Skill

Review code for bugs and security issues.

## Parameters
- `diff` - Code changes (required)
- `focus` - Areas to focus on (optional)

## Output
JSON with issues, suggestions, summary
```

**Agents** - Custom AI agent definitions:
```markdown
# Frontend Developer Agent

You are a senior frontend developer specializing in React and TypeScript.

## Responsibilities
- Build React components
- Follow project standards
- Write tests

## Tech Stack
- React 19
- TypeScript 5.9
```

**Benefits:**
- Shareable prompts and agent instructions
- Version controlled in Git
- Project-specific agents
- Community agent marketplace (future)

---

## 🚀 Getting Started

### For Users

1. **Configure AI Providers:**
   - Open agentful Studio
   - Go to "Providers" tab
   - Enter API keys (stored securely)
   - Select default model

2. **Add MCP Servers:**
   - Edit `.agentful/mcp-servers.json`
   - Or install via npm: `npm install @agentful/mcp-server-filesystem`

3. **Create Custom Agents:**
   - Add `.claude/agents/my-agent.md`
   - Define agent instructions
   - Agent auto-discovered on reload

4. **Run Skills:**
   - Select skill from sidebar
   - Fill in parameters
   - Choose provider/model
   - Execute

### For Developers

1. **Read Architecture:**
   - Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Review [DIAGRAMS.md](./DIAGRAMS.md) for visual context

2. **Implement Types:**
   - Copy types from [IMPLEMENTATION.md](./IMPLEMENTATION.md)
   - Add to `src/types/ai-providers.ts`

3. **Build Services:**
   - `ProviderRegistry` - Manage provider implementations
   - `SecureCredentialManager` - Handle API keys securely
   - `ConfigurationManager` - Load/save config hierarchy

4. **Create UI Components:**
   - Provider configuration panel
   - MCP server management UI
   - Agent editor
   - Skill execution dialog

5. **Test:**
   - Unit tests for services
   - Integration tests for credential storage
   - E2E tests for full workflows

---

## 📋 Implementation Roadmap

### Phase 1: Core Provider Abstraction (Week 1-2)
- [ ] Define `AIProvider` interface
- [ ] Implement `ClaudeProvider` (first provider)
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
- [ ] Documentation review

---

## 🔒 Security Best Practices

### Credential Storage
✅ **DO:**
- Use VS Code's `secretStorage` API for all API keys
- Store only key IDs in configuration files
- Implement API key rotation with validation
- Log credential access (without exposing keys)
- Clear credentials on extension uninstall

❌ **DON'T:**
- Store API keys in `globalState` or `workspaceState`
- Log API keys in console output (even in debug mode)
- Include API keys in error messages
- Store API keys in files (even `.gitignore`d files)

### Audit Logging
Log all credential operations without exposing sensitive data:

```typescript
{
  timestamp: "2024-01-15T10:30:00Z",
  providerId: "anthropic",
  action: "create",
  workspacePath: "/Users/blitz/Development/agentful",
  success: true
  // ❌ Never include actual API keys
}
```

---

## 🧪 Testing

### Unit Tests
```bash
# Test provider registry
npm test -- provider-registry.test.ts

# Test credential manager
npm test -- secure-credential-manager.test.ts

# Test configuration manager
npm test -- configuration-manager.test.ts
```

### Integration Tests
```bash
# Test secretStorage integration
npm test -- credential-storage-integration.test.ts

# Test MCP server lifecycle
npm test -- mcp-server-lifecycle.test.ts
```

### E2E Tests
```bash
# Test full provider configuration flow
npm run test:e2e -- provider-config.spec.ts

# Test MCP server management
npm run test:e2e -- mcp-management.spec.ts
```

---

## 📖 Additional Resources

### Internal Documentation
- `/Users/blitz/Development/agentful/packages/studio/TESTING.md` - Extension testing guide
- `/Users/blitz/Development/agentful/packages/studio/THEME_SYSTEM.md` - Theme architecture
- `/Users/blitz/Development/agentful/CLAUDE.md` - Overall agentful framework docs

### External References
- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code secretStorage API](https://code.visualstudio.com/api/extension-capabilities/virtual-docs#extension-host-virtual-workspace)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Google Gemini API](https://ai.google.dev/docs)

---

## 🤝 Contributing

When implementing new features:

1. **Follow the architecture** - All providers should implement `AIProvider` interface
2. **Security first** - Always use `secretStorage` for credentials
3. **Test thoroughly** - Unit tests for services, E2E tests for workflows
4. **Document changes** - Update relevant docs in this directory
5. **Backward compatible** - Don't break existing configurations

---

## 📝 Changelog

### v0.0.1 (Current)
- ✅ Basic provider configuration UI (`ProviderConfig.tsx`)
- ✅ Clerk authentication integration
- ❌ API keys stored in `globalState` (insecure - needs migration)
- ❌ No MCP server support
- ❌ No agent/skills integration

### v0.1.0 (Planned - Phase 1-2)
- ✅ Provider abstraction layer
- ✅ Secure credential storage with `secretStorage`
- ✅ Configuration hierarchy (global/workspace/project)
- ✅ Claude and OpenAI provider implementations
- ✅ Migration from `globalState` to `secretStorage`

### v0.2.0 (Planned - Phase 3-4)
- ✅ MCP server integration
- ✅ Agent registry and discovery
- ✅ Skill execution
- ✅ Agent management UI

### v0.3.0 (Planned - Phase 5-6)
- ✅ Project detection
- ✅ Project-specific configuration
- ✅ Team/org configuration sync
- ✅ Full feature parity with architecture

---

## 📞 Support

For questions or issues:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design
2. Check [IMPLEMENTATION.md](./IMPLEMENTATION.md) for code examples
3. Review [DIAGRAMS.md](./DIAGRAMS.md) for visual context
4. Open an issue on GitHub

---

**Status:** 🚧 In Development (Architecture Phase)

**Last Updated:** 2025-01-28

**Maintainer:** @itz4blitz
