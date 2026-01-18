# agentful

Autonomous product development kit for Claude Code. Transform any project into a 24/7 self-building system with specialized agents.

## Quick Start

```bash
# Install globally
npm install -g @itz4blitz/agentful

# Initialize in your project
agentful init

# Start Claude Code and run
/agentful "Add user authentication"
```

## Documentation

Full documentation at **[agentful.app](https://agentful.app)**

- Installation & Setup
- How It Works
- All Commands
- Configuration
- Examples

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build documentation
npm run docs:build

# Preview documentation
npm run docs:dev
```

## Project Structure

```
agentful/
├── bin/              # CLI entry point
├── lib/              # Core logic
├── template/         # Project templates
├── .claude/          # Agent definitions (for this repo)
├── docs/             # Documentation site
└── .github/          # GitHub Actions
```

## License

MIT
