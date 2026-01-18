# GitHub Actions Setup Guide

This repository requires GitHub Actions workflows to function properly. Follow these steps to set up the necessary secrets and configurations.

## Required GitHub Secrets

### 1. NPM_TOKEN (Required for Publishing)

The `Release` workflow needs an NPM token to publish packages to the npm registry.

#### Creating an NPM Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click on your profile picture → **Access Tokens**
3. Click **Generate New Token** → **Automation** (or **Granular Access Token**)
4. Set expiration (90 days maximum for automation tokens)
5. Select the `@itz4blitz/agentful` package or enable for all packages
6. Set permissions: **Publish** (required)
7. Click **Generate Token**
8. **Copy the token immediately** - you won't be able to see it again!

#### Adding NPM_TOKEN to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the npm token you created
6. Click **Add secret**

#### Token Expiration

⚠️ **Important**: NPM automation tokens expire after 90 days maximum. You'll need to:
- Set a reminder to regenerate the token before it expires
- Update the `NPM_TOKEN` secret in GitHub with the new token
- Consider setting up a calendar reminder for 85 days

## Workflow Permissions

The workflows have been configured with the following permissions:

### Release Workflow (.github/workflows/release.yml)
- `contents: write` - To push tags and create releases
- `pull-requests: write` - To create release PRs
- `id-token: write` - For OIDC authentication

### Deploy Documentation Workflow (.github/workflows/gh-pages.yml)
- `contents: read` - To read repository contents
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For OIDC authentication

## Workflows

### Release Workflow
- **Trigger**: Push to `main` branch
- **What it does**:
  - Runs semantic-release
  - Determines version based on commits
  - Publishes package to npm (if NPM_TOKEN is set)
  - Creates GitHub release
  - Updates CHANGELOG.md

### Deploy Documentation Workflow
- **Trigger**: Push to `main` branch
- **What it does**:
  - Builds documentation using vocs
  - Deploys to GitHub Pages
  - No additional setup required

## Troubleshooting

### Release Workflow Fails with "ENONPMTOKEN"
**Problem**: NPM_TOKEN secret is not set or is empty

**Solution**:
1. Follow the steps above to create and add NPM_TOKEN
2. Ensure you pasted the token correctly
3. Check the token hasn't expired

### Release Workflow Fails with "EGITNOPERMISSION"
**Problem**: Workflow doesn't have permission to push to repository

**Solution**:
- Ensure workflow has `contents: write` permission (already configured)
- Check that GitHub Actions is enabled in repository settings

### Deploy Documentation Fails with "No such file or directory"
**Problem**: Docs build output path is incorrect

**Solution**:
- This should be fixed in the latest commit
- Ensure `docs/dist` is being uploaded (not `docs/.vocs/dist`)

## Verification

After setting up secrets, verify workflows are working:

1. Push a commit to `main` branch
2. Go to **Actions** tab in GitHub
3. Check that both workflows run successfully
4. For Release workflow:
   - First run might not publish if there are no release-worthy commits
   - Check logs to ensure NPM_TOKEN is being used
5. For Deploy Documentation:
   - Check that https://itz4blitz.github.io/agentful/ updates

## Manual Publishing

If automatic publishing doesn't work, you can publish manually:

```bash
# Build the package
npm run build

# Publish to npm (manually enter token when prompted)
npm publish --access public --token <YOUR_NPM_TOKEN>
```

## Support

If you encounter issues:
1. Check the Actions logs for detailed error messages
2. Verify all secrets are set correctly
3. Ensure your NPM token has the correct permissions
4. Check that workflows have the required permissions
