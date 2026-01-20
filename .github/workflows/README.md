# GitHub Actions Workflows

Automated CI/CD for agentful.

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `release.yml` | Push to main (code changes) | Semantic versioning, npm publish, GitHub release |
| `gh-pages.yml` | Push to main (docs changes) | Deploy documentation to GitHub Pages |
| `pr.yml` | Pull requests to main | Validate PRs before merge |

## Flow Diagram

```
Push to main
    │
    ├─── docs/** changed? ──► gh-pages.yml ──► Deploy to agentful.app
    │
    └─── code changed? ──► release.yml
                              │
                              ├─► Analyze commits (feat:/fix:/etc)
                              ├─► Bump version
                              ├─► Update CHANGELOG.md
                              ├─► Update version.json
                              ├─► Publish to npm
                              ├─► Create GitHub release
                              └─► Discord notification

Pull Request to main
    │
    └─► pr.yml ──► Build validation ──► Must pass before merge
```

## Scenario Behaviors

| Scenario | release.yml | gh-pages.yml | pr.yml |
|----------|-------------|--------------|--------|
| Push: docs only | Skipped | Runs | - |
| Push: code with `feat:` | Runs (minor bump) | Skipped | - |
| Push: code with `fix:` | Runs (patch bump) | Skipped | - |
| Push: code with `chore:` | Runs (no release) | Skipped | - |
| Push: docs + code | Both run | Both run | - |
| PR opened | - | - | Runs |
| `[skip ci]` commit | Skipped | Skipped | - |

## Required Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `NPM_TOKEN` | release.yml | Publish to npm |
| `DISCORD_WEBHOOK_URL` | All workflows | Notifications |
| `GITHUB_TOKEN` | All workflows | Auto-provided |

## Conventional Commits

| Type | Version Bump | Example |
|------|--------------|---------|
| `feat:` | Minor (0.1.0 → 0.2.0) | `feat: add new command` |
| `fix:` | Patch (0.1.0 → 0.1.1) | `fix: resolve bug` |
| `feat!:` | Major (0.1.0 → 1.0.0) | `feat!: breaking change` |
| `docs:` | None | `docs: update README` |
| `chore:` | None | `chore: update deps` |
| `ci:` | None | `ci: fix workflow` |

## Testing

```bash
# Dry run release
npm run release:dry-run

# Check workflow runs
gh run list

# View specific run
gh run view <run-id> --log
```

## Troubleshooting

**Release not triggered?**
- Check commit message uses conventional format
- Verify push wasn't to docs-only paths

**npm publish failed?**
- Verify `NPM_TOKEN` secret is set and valid
- Check package name isn't taken

**Docs not deploying?**
- Verify changes are in `docs/**` or `vocs.config.ts`
- Check build locally: `npm run docs:build`

---

Last updated: 2026-01-20
