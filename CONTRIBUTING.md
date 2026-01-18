# Contributing to agentful

Thank you for your interest in contributing to agentful!

## 🎯 How to Contribute

### Reporting Issues

- Search existing issues first
- Use the issue templates
- Include: steps to reproduce, expected behavior, actual behavior
- Add screenshots if applicable

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push and create a PR

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/agentful.git
cd agentful

# Install dependencies (if we add any)
npm install

# Test CLI locally
node bin/cli.js --help
```

## 📁 Project Structure

```
agentful/
├── .claude/              # agentful configuration (the actual product)
│   ├── agents/          # Specialist agents
│   ├── commands/        # Slash commands
│   ├── skills/          # Domain skills
│   └── settings.json    # Hooks and permissions
├── bin/                 # CLI tool
├── template/            # Template files for new projects
├── docs/                # Documentation site
└── README.md            # Main readme
```

## 🧪 Testing

When adding new agents or commands:

1. Test in a fresh project
2. Verify all quality gates pass
3. Test with different tech stacks
4. Document in README.md

## 📝 Documentation

Keep documentation in sync with code:
- Update README.md for user-facing changes
- Add inline comments in agent files
- Update docs/ site for major features

## 🎨 Code Style

- Use clear, descriptive names
- Write for clarity first, cleverness second
- Comment complex logic
- Follow existing patterns

## 🤝 Community Guidelines

- Be respectful and constructive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy

## 📧 Contact

- GitHub Issues: For bugs and feature requests
- Discussions: For questions and ideas

---

Thank you for contributing! 🎉
