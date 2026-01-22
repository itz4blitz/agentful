# Shareable Configuration Example

This example demonstrates how to use agentful's shareable configuration feature.

## Scenario

You're a tech lead who has set up the perfect agentful configuration for your team's Next.js + TypeScript + Prisma stack. You want to share this configuration so all team members can quickly get started with the same setup.

## Step 1: Create Your Configuration

Visit the [agentful configurator](https://agentful.app/configure) and set up your desired configuration:

**Configuration Details:**
- **Project Type:** Existing
- **Language:** TypeScript
- **Frontend:** Next.js
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Testing:** Vitest
- **Agents:** Orchestrator, Backend, Frontend, Tester, Reviewer
- **Skills:** Product Tracking, Validation
- **Hooks:** Health Check, TypeScript Validation
- **Quality Gates:** Types, Tests, Coverage

## Step 2: Share Your Configuration

1. Click the **"Share"** button in the Command Generator
2. Wait for the configuration to be saved
3. A modal appears with:
   - Shareable URL: `https://agentful.app/c/abc12345`
   - Install command: `npx @itz4blitz/agentful init --config=abc12345`
   - QR code for mobile sharing

## Step 3: Distribute to Team

Share the configuration with your team via:

### Slack/Discord Message:
```
Hey team! I've set up our standard agentful configuration.

Install it with:
npx @itz4blitz/agentful init --config=abc12345

Or visit: https://agentful.app/c/abc12345
```

### README.md:
```markdown
## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up agentful:
   ```bash
   npx @itz4blitz/agentful init --config=abc12345
   ```
4. Start Claude Code: `claude`
```

### Documentation:
```markdown
## Onboarding

New developers should install our standard agentful setup:

\`\`\`bash
npx @itz4blitz/agentful init --config=abc12345
\`\`\`

This configures:
- 5 specialized agents (Orchestrator, Backend, Frontend, Tester, Reviewer)
- Product tracking and validation skills
- TypeScript validation and health check hooks
- Quality gates for types, tests, and coverage
```

## Step 4: Team Members Install

Your team members can install the configuration with a single command:

```bash
cd my-project
npx @itz4blitz/agentful init --config=abc12345
```

This will:
1. Fetch the configuration from the server
2. Validate the configuration
3. Install all specified agents, skills, and hooks
4. Set up quality gates
5. Create necessary directories and files

## Step 5: Preview Before Installing

Team members can visit the URL to preview the configuration before installing:

https://agentful.app/c/abc12345

This page shows:
- Configuration summary
- Tech stack details
- Complete list of agents, skills, hooks, and gates
- Installation command
- View count (how many people have viewed this config)

## Advanced Usage

### Override Specific Options

You can start with a shared config and override specific options:

```bash
# Use shared config but add the architect agent
npx @itz4blitz/agentful init --config=abc12345 --agents=orchestrator,backend,frontend,tester,reviewer,architect

# Use shared config but remove some skills
npx @itz4blitz/agentful init --config=abc12345 --skills=product-tracking
```

### Check Configuration Details

Use curl to inspect the configuration programmatically:

```bash
curl https://agentful.app/api/get-config/abc12345 | jq
```

Response:
```json
{
  "id": "abc12345",
  "config": {
    "projectType": "existing",
    "language": "typescript",
    "frontend": "nextjs",
    "backend": "nextjs-api",
    "database": "postgresql",
    "orm": "prisma",
    "testing": "vitest",
    "agents": ["orchestrator", "backend", "frontend", "tester", "reviewer"],
    "skills": ["product-tracking", "validation"],
    "hooks": ["health-check", "typescript-validation"],
    "gates": ["types", "tests", "coverage"]
  },
  "metadata": {
    "created_at": "2026-01-21T12:00:00.000Z",
    "views": 42
  }
}
```

## Common Use Cases

### 1. Team Standard Setup
Share your team's standard configuration in onboarding docs.

### 2. Project Templates
Create configurations for different project types:
- Minimal setup for prototypes
- Full-stack for production apps
- Enterprise setup for large projects

### 3. Tutorial/Workshop
Share a specific configuration for a tutorial or workshop participants.

### 4. Open Source Projects
Include a shareable config in your README for contributors.

### 5. Consulting/Freelancing
Share your preferred setup with clients quickly.

## Tips

1. **Test Before Sharing:** Always test the configuration yourself before sharing with others.

2. **Update Documentation:** When you create a new shared config, update your team docs with the new ID.

3. **Version in Comments:** Add a comment with the config ID in your project:
   ```javascript
   // agentful config: abc12345
   // Last updated: 2026-01-21
   ```

4. **Backup Important Configs:** Save the URL/ID of important configurations in your password manager or docs.

5. **Create Multiple Variants:** Share different configs for different scenarios:
   - Development: Full agents + skills
   - CI/CD: Minimal agents
   - New Contributors: Guided setup

## Troubleshooting

### Configuration Not Found
- Check if the ID is correct (8 characters, hexadecimal)
- Configuration may have expired (1 year TTL)
- Create a new configuration and update links

### Installation Fails
- Ensure you have internet connection
- Try using the full URL instead of just the ID
- Check if the configuration is valid by visiting the viewer page

### Rate Limit Exceeded
- You've created more than 10 configurations in the last hour
- Wait for the rate limit to reset
- Contact support if you need higher limits

## Next Steps

After installing a shared configuration:

1. Edit `.claude/product/index.md` to describe your project
2. Start Claude Code: `claude`
3. Run `/agentful-start` to begin development
4. Customize agents as needed

## Learn More

- [Shareable Configs Documentation](../SHAREABLE_CONFIGS.md)
- [API Reference](../api/README.md)
- [Configurator](https://agentful.app/configure)
