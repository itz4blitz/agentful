# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated deployment setup with GitHub Actions
- Semantic release configuration for automated versioning
- Cloudflare Pages deployment for documentation
- npm package publishing workflow
- Comprehensive deployment guide

## [0.1.0] - 2026-01-18

### Added
- Initial alpha release of Agentful
- CLI tool for autonomous product development
- 7 specialized agents (architect, backend, frontend, orchestrator, reviewer, tester, fixer)
- 4 slash commands (agentful-start, agentful-status, agentful-decide, agentful-validate)
- 2 skills (product-tracking, validation)
- Project template with CLAUDE.md and PRODUCT.md
- Documentation site built with Vocs
- Support for both flat and hierarchical product structures
- Auto-detection of product specification format
- 24/7 autonomous development capabilities

### Documentation
- Comprehensive getting started guide
- Agent documentation
- Command reference
- Configuration guide
- Workflow examples
- Troubleshooting guide

### Features
- `npx agentful init` - Initialize new Agentful project
- Automatic state tracking in `.agentful/`
- Multi-format product spec support
- Hybrid product structure (flat and hierarchical)
- Auto-detection and format adaptation
- Completion tracking at domain, feature, and subtask levels

### Known Issues
- Untested in real projects (alpha release)
- May have critical bugs
- APIs may change without notice
- Not recommended for production use

## License

MIT License - See LICENSE file for details
