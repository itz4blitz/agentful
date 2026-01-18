# GitHub Actions Workflows

This directory contains automated deployment workflows for Agentful.

## Workflows

### 1. Release Workflow (`release.yml`)

**Purpose**: Automated semantic versioning and changelog generation

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**What it does**:
- Analyzes commits using conventional commit format
- Determines next version (major/minor/patch)
- Updates `CHANGELOG.md`
- Updates `package.json` version
- Creates git tag (v*)
- Creates GitHub release
- Commits changes with `[skip ci]`

**Outputs**:
- `release-published`: true/false
- `version`: new version number
- `new-release-published`: true/false

**See**: [DEPLOYMENT.md](../../DEPLOYMENT.md) for conventional commit format

---

### 2. Publish Workflow (`publish.yml`)

**Purpose**: Publish npm package

**Triggers**:
- Version tags (v0.1.0, v0.1.1, etc.)

**What it does**:
- Checks out code
- Sets up Node.js
- Installs dependencies
- Runs tests (if available)
- Verifies package
- Publishes to npm with provenance
- Creates GitHub release
- Marks prerelease if alpha/beta/rc in tag

**Required Secrets**:
- `NPM_TOKEN`: npm authentication token

**See**: [DEPLOYMENT.md](../../DEPLOYMENT.md) for secret setup

---

### 3. Deploy Documentation Workflow (`deploy-docs.yml`)

**Purpose**: Deploy documentation to Cloudflare Pages

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**What it does**:
- Checks out code
- Sets up Node.js
- Installs dependencies
- Builds documentation with vocs
- Deploys to Cloudflare Pages
- Updates agentful.app

**Required Secrets**:
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID

**See**: [DEPLOYMENT.md](../../DEPLOYMENT.md) for secret setup

---

### 4. GitHub Pages Fallback (DEPRECATED) (`deploy.yml`)

**Purpose**: Emergency fallback for GitHub Pages deployment

**Status**: DEPRECATED - Use `deploy-docs.yml` instead

**When to use**:
- Only if Cloudflare Pages is down
- For emergency situations
- Testing purposes

---

## Setup

### Quick Setup

Run the automated setup script:

```bash
bash .github/workflows/setup-deployment.sh
```

### Manual Setup

1. **Install dependencies**:
   ```bash
   npm install --save-dev \
     semantic-release \
     @semantic-release/git \
     @semantic-release/changelog \
     @semantic-release/npm \
     @semantic-release/github \
     @semantic-release/commit-analyzer \
     @semantic-release/release-notes-generator
   ```

2. **Add GitHub Secrets**:
   - `NPM_TOKEN`: https://www.npmjs.com/settings/tokens
   - `CLOUDFLARE_API_TOKEN`: https://dash.cloudflare.com/profile/api-tokens
   - `CLOUDFLARE_ACCOUNT_ID`: https://dash.cloudflare.com

3. **Configure Cloudflare Pages**:
   - Create Pages project
   - Connect to Git repository
   - Set build command: `npm run docs:build`
   - Set output directory: `docs/.vocs/dist`

4. **Test**:
   ```bash
   npm run release:dry-run
   ```

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for detailed setup instructions.

---

## Workflow Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Push to Main Branch                      │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Release     │  │  Deploy      │
│  Workflow    │  │  Docs        │
│              │  │  Workflow    │
│  • Analyze   │  │              │
│    commits   │  │  • Build     │
│  • Version   │  │    docs      │
│    bump      │  │  • Deploy    │
│  • Changelog │  │    to CF     │
│  • Tag       │  │    Pages     │
│  • Release   │  │              │
└──────┬───────┘  └──────────────┘
       │
       │ (tag created)
       ▼
┌──────────────┐
│  Publish     │
│  Workflow    │
│              │
│  • Build     │
│    package   │
│  • Publish   │
│    to npm    │
│  • GitHub    │
│    release   │
└──────────────┘
```

---

## Conventional Commits

Workflows use conventional commits to determine version bumps:

| Type | Bump | Example |
|------|------|---------|
| `feat:` | Minor | `feat: add CLI command` |
| `fix:` | Patch | `fix: resolve memory leak` |
| `feat!:` | Major | `feat!: remove deprecated API` |
| `docs:` | None | `docs: update README` |
| `chore:` | None | `chore: update deps` |

**Full format**:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Examples**:
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: correct login bug"
git commit -m "feat!: remove deprecated API"
git commit -m "docs: update installation guide"
```

---

## Testing

### Test Release Workflow

```bash
# Create test commit
git commit --allow-empty -m "feat: test feature"
git push origin main

# Check workflow status
gh run list --workflow=release.yml
gh run view [run-id] --log
```

### Test Publish Workflow

```bash
# Wait for tag from release workflow
# Then check publish workflow
gh run list --workflow=publish.yml
```

### Test Deploy Docs Workflow

```bash
# Make docs change
echo "# Test" >> docs/pages/index.mdx
git add docs/pages/index.mdx
git commit -m "docs: test deployment"
git push origin main

# Check workflow status
gh run list --workflow=deploy-docs.yml

# Verify deployment
# Visit: https://agentful.app
```

---

## Troubleshooting

### Release workflow fails

1. Check commit messages are conventional format
2. Verify `.releaserc.json` exists
3. Check workflow logs for errors

### Publish workflow fails

1. Verify `NPM_TOKEN` is set in GitHub secrets
2. Check token hasn't expired
3. Verify package name isn't taken

### Deploy docs workflow fails

1. Verify `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set
2. Check Cloudflare Pages project exists
3. Test build locally: `npm run docs:build`
4. Check output directory: `docs/.vocs/dist`

See [DEPLOYMENT.md](../../DEPLOYMENT.md#troubleshooting) for more troubleshooting tips.

---

## Configuration Files

### `.releaserc.json`

Configures semantic-release behavior:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

### `CHANGELOG.md`

Auto-generated changelog maintained by semantic-release.

---

## Permissions

Workflows require the following GitHub token permissions:

```yaml
permissions:
  contents: read          # Read code
  id-token: write         # npm provenance
  pull-requests: write    # Release comments
  deployments: write      # Cloudflare Pages
```

---

## Best Practices

1. **Always use conventional commits**
2. **Test before merging to main**
3. **Review CHANGELOG.md after releases**
4. **Monitor workflow runs**
5. **Keep dependencies updated**
6. **Use semantic-release dry-run for testing**

---

## Resources

- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Comprehensive deployment guide
- [Semantic Release](https://github.com/semantic-release/semantic-release)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Last Updated**: 2026-01-18
**Version**: 0.1.0
