# GitHub Actions Setup Guide

This project uses GitHub Actions for automated publishing to npm and documentation deployment.

## Quick Setup (Choose One)

### Option 1: OIDC Trusted Publishing (Recommended)

**No tokens needed!** No expiration, more secure.

1. Go to [npmjs.com settings](https://www.npmjs.com/settings/itz4blitz/access)
2. Under "CI/CD tokens" or "Trusted Publishers"
3. Click "Add a publisher"
4. Enter:
   - **Package name**: `@itz4blitz/agentful`
   - **GitHub organization**: `itz4blitz`
   - **Repository name**: `agentful`
   - **Workflow name**: `Release` or `*` (for all)
   - **Environment**: (leave empty)
5. Click "Add"

That's it! The workflow will automatically authenticate when it runs.

### Option 2: NPM Token (Expires in 90 days)

If you can't use OIDC, create an npm token:

1. Go to [npm access tokens](https://www.npmjs.com/settings/itz4blitz/tokens)
2. Click "Generate New Token" → "Granular Access Token"
3. Configure:
   - **Name**: `agentful-ci`
   - **Expiration**: 90 days
   - **Packages**: Select `@itz4blitz/agentful`
   - **Permissions**: Enable **Publish** and **Read**
   - **Automation**: ✅ Enable "Bypass 2FA for non-interactive workflows"
4. Click "Generate Token"
5. **Copy the token immediately** (you won't see it again!)
6. Add to GitHub:
   - Go to repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Paste the token
   - Click "Add secret"

⚠️ **Important**: Set a reminder to renew the token before 90 days!

## Workflows

### Release Workflow
- **Trigger**: Push to `main` branch
- **What it does**:
  - Runs semantic-release
  - Determines version based on conventional commits
  - Publishes to npm (using OIDC or NPM_TOKEN)
  - Creates GitHub release
  - Updates CHANGELOG.md

### Deploy Documentation Workflow
- **Trigger**: Push to `main` branch
- **What it does**:
  - Builds documentation with vocs
  - Deploys to GitHub Pages
  - No setup required!

## Verification

After setup, verify it's working:

1. Make a commit to `main` (e.g., `chore: test release`)
2. Go to **Actions** tab in GitHub
3. Watch the workflows run
4. If Release succeeds:
   - Check npm for new version
   - Check GitHub Releases
   - Check CHANGELOG.md

## Troubleshooting

### Release fails with "EINVALIDNPMTOKEN"

**Problem**: NPM_TOKEN is invalid or OIDC not configured

**Solution**:
- If using OIDC: Verify publisher is added to npm settings
- If using token: Regenerate and update NPM_TOKEN secret
- Check 2FA is set to "Authorization only" on npm

### Release fails with "ENONPMTOKEN"

**Problem**: No token configured

**Solution**:
- Either add NPM_TOKEN secret (Option 2)
- Or configure OIDC trusted publisher (Option 1)

### Semantic release doesn't publish

**Problem**: No release-worthy commits

**Solution**:
- Use conventional commit format:
  - `feat:` - new feature (triggers minor release)
  - `fix:` - bug fix (triggers patch release)
  - `chore:` - maintenance (no release unless breaking)

### Docs deployment fails

**Problem**: Usually build errors

**Solution**:
- Check the logs for specific error
- Ensure all dependencies are installed
- Try running `npm run docs:build` locally

## Workflow Features

The Release workflow:
- ✅ Supports OIDC (preferred)
- ✅ Falls back to NPM_TOKEN
- ✅ Automatic versioning
- ✅ Creates releases on npm and GitHub
- ✅ Updates CHANGELOG.md
- ✅ No manual intervention needed

Just push to `main` and everything happens automatically!
# Test OIDC trusted publishing

