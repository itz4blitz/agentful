# Changelog

All notable changes to the agentful MCP server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-23

### Added

#### Core Infrastructure
- Initial MCP server implementation with stdio, HTTP, and SSE transport support
- Hexagonal architecture with clear separation of concerns (presentation, application, domain, infrastructure layers)
- Dependency injection container for modular, testable code
- Comprehensive error handling and validation framework
- Structured logging with configurable log levels

#### MCP Tools
- `launch_specialist` - Launch specialized agents (backend, frontend, reviewer, tester, fixer, product-analyzer, orchestrator)
  - Support for agent validation and task sanitization
  - Execution tracking with unique IDs
  - Context support for priority, dependencies, and timeout configuration
- `get_status` - Get execution status for running or completed agent tasks
  - Real-time status updates (pending, running, completed, failed)
  - Detailed output logs and error messages
  - Duration tracking and exit code reporting
- `update_progress` - Update feature/subtask completion tracking
  - Support for domain/feature/subtask hierarchy
  - Percentage-based progress tracking
  - Metadata support for files changed, tests added, notes
- `run_validation` - Run quality gates (types, tests, coverage, lint, security, dead code)
  - Selective gate execution
  - Auto-fix support via fixer agent
  - Detailed validation results with pass/fail status
- `resolve_decision` - Answer pending decisions blocking development
  - Decision lookup by ID
  - State updates for resolved decisions
  - Historical decision tracking
- `analyze_product` - Analyze product specification for completeness
  - Gap detection in product specs
  - Requirement analysis
  - Domain/feature validation

#### MCP Resources
- `agentful://product/spec` - Product specification access
  - Support for flat structure (`.claude/product/index.md`)
  - Support for hierarchical structure (`.claude/product/domains/`)
  - Markdown format with full spec content
- `agentful://state` - Runtime state access
  - Current execution phase
  - Active agent tracking
  - Pending decisions count
  - Last updated timestamp
- `agentful://completion` - Feature completion tracking
  - Overall completion percentage
  - Domain-level completion breakdown
  - Feature-level completion status
  - Subtask tracking
- `agentful://decisions` - Decision management
  - List of pending decisions
  - Historical resolved decisions
  - Decision metadata (created, resolved timestamps)
- `agentful://architecture` - Tech stack and agent information
  - Detected tech stack (language, framework, testing tools)
  - Generated domain agents
  - Agent capability matrix

#### MCP Prompts
- `start_development` - Begin autonomous product development workflow
- `review_progress` - Analyze current completion percentage and suggest next steps
- `fix_validation` - Auto-fix failing quality gates using fixer agent
- `answer_decisions` - Review and resolve all pending decisions

#### Configuration
- Environment variable support for all configuration options
- CLI argument parsing for flexible deployment
- Config file support (`.env`, `config.json`)
- Per-project configuration overrides
- Support for custom project root, state directory, and product directory paths

#### Documentation
- Comprehensive README with setup instructions for Claude Code, Kiro, Aider
- CONTRIBUTING guide with development guidelines
- Architecture documentation with diagrams
- Tool and resource API reference
- Troubleshooting guide with common issues and solutions
- Configuration examples for all supported AI tools

#### Testing
- Unit test framework with 80%+ coverage
- Integration tests for tool/resource interactions
- End-to-end tests with real MCP clients
- Mock implementations for isolated testing
- Test utilities and fixtures

#### Developer Experience
- TypeScript type definitions for better IDE support
- ESLint configuration for code quality
- Prettier integration for consistent formatting
- VS Code debugging configuration
- Hot reload in development mode

### Changed

N/A (initial release)

### Deprecated

N/A (initial release)

### Removed

N/A (initial release)

### Fixed

N/A (initial release)

### Security

- Input sanitization for all tool parameters to prevent shell injection
- Agent validation before execution
- File system access restricted to project root
- Resource access controls
- Bearer token authentication support for HTTP/SSE transports
- HTTPS enforcement for production deployments

## [Unreleased]

### Planned Features

#### Tools
- `create_agent` - Dynamically create new specialized agents
- `list_executions` - List all executions with filtering and pagination
- `cancel_execution` - Cancel a running execution
- `get_logs` - Retrieve execution logs with filtering
- `run_agent_pipeline` - Execute multi-agent workflow

#### Resources
- `agentful://executions` - Historical execution data
- `agentful://logs/{executionId}` - Execution log streaming
- `agentful://metrics` - Performance and usage metrics
- `agentful://agents` - List of available agents with metadata

#### Enhancements
- WebSocket transport for real-time bidirectional communication
- Execution result caching for faster status lookups
- Execution queue management with priority scheduling
- Parallel execution support for multiple agents
- Agent health monitoring and auto-restart
- Prometheus metrics export
- OpenTelemetry tracing integration

#### Integrations
- GitHub Actions integration for CI/CD workflows
- GitLab CI integration
- Jenkins pipeline support
- Slack notifications for execution status
- Discord webhook support
- Email notifications

---

## Version History

- **1.0.0** (2026-01-23) - Initial release with core MCP server, tools, resources, and documentation

## Links

- [GitHub Repository](https://github.com/itz4blitz/agentful)
- [Documentation](https://agentful.app)
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [Issue Tracker](https://github.com/itz4blitz/agentful/issues)
