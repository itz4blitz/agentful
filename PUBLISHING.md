# Publishing Agentful to npm

> **⚠️ WARNING: This is an ALPHA release (0.1.0)**
>
> This software has NOT been tested in real projects yet. It should be considered experimental and unstable. Use at your own risk!

This guide explains how to publish Agentful to npm so users can install it with `npx agentful init`.

## Prerequisites

1. **npm account**: Create one at https://npmjs.com/signup
2. **Node.js 18+**: Required for ES modules
3. **Package is ready**: ✅ All files configured correctly

## Quick Publish

```bash
# 1. Login to npm
npm login

# 2. Publish (from project root)
npm publish

# 3. Verify it's available
npm view agentful
```

That's it! Users can now run: `npx agentful init`

## What Gets Published

The npm package includes:

```
agentful-1.0.0.tgz (32KB)
├── bin/
│   └── cli.js (18KB) - CLI tool
├── template/
│   ├── CLAUDE.md (6KB) - Project instructions template
│   └── PRODUCT.md (3KB) - Product spec template
├── .claude/
│   ├── agents/ (7 domain agents)
│   │   ├── architect.md
│   │   ├── backend.md
│   │   ├── fixer.md
│   │   ├── frontend.md
│   │   ├── orchestrator.md
│   │   ├── reviewer.md
│   │   └── tester.md
│   ├── commands/ (4 slash commands)
│   │   ├── agentful-decide.md
│   │   ├── agentful-start.md
│   │   ├── agentful-status.md
│   │   └── agentful-validate.md
│   ├── skills/ (2 skills)
│   │   ├── product-tracking/SKILL.md
│   │   └── validation/SKILL.md
│   └── settings.json
├── README.md (7KB)
└── LICENSE (1KB)
```

**Total**: 20 files, 110KB unpacked

## Testing Before Publish

### 1. Test the tarball locally

```bash
# Create package
npm pack

# Test installation in temp directory
cd /tmp
mkdir test-agentful
cd test-agentful

# Install from local tarball
npm install ../agentful-1.0.0.tgz

# Test CLI
npx agentful --help
npx agentful --version
```

### 2. Test with a real project

```bash
# Create test project
mkdir my-test-project
cd my-test-project

# Initialize Agentful
npx agentful init

# Verify files created
ls -la .claude/
ls -la .agentful/
cat PRODUCT.md
```

## Version Management

### Current Version: 0.1.0 (Alpha)

This is an **alpha release** meaning:
- ⚠️ **Untested in real projects**
- ⚠️ **May have critical bugs**
- ⚠️ **APIs may change without notice**
- ⚠️ **Not recommended for production use**

For updates, use semantic versioning:

```bash
# Patch release (bug fixes)
npm version patch  # 0.1.0 → 0.1.1

# Minor release (new features, backward compatible)
npm version minor  # 0.1.0 → 0.2.0

# Major release (breaking changes)
npm version major  # 0.1.0 → 1.0.0 (stable!)

# Then publish
npm publish
```

### Recommended Release Path

1. **0.1.0** (Current) - Alpha, untested
2. **0.2.0** - Beta, tested by early adopters
3. **0.3.0** - Release candidate, mostly stable
4. **1.0.0** - Stable, production-ready

## Publishing Checklist

- [x] package.json has correct name, version, description
- [x] bin/cli.js is executable (chmod +x)
- [x] All required files in "files" array
- [x] README.md is comprehensive
- [x] LICENSE is included (MIT)
- [x] Engine requirement set: Node >= 18.0.0
- [x] No sensitive data in package
- [x] CLI works with `node bin/cli.js`
- [x] `npm pack --dry-run` looks correct
- [x] Tested local installation

## npm Registry URLs

- **Public npm registry**: https://www.npmjs.com/package/agentful
- **Package URL**: https://npmjs.com/package/agentful
- **Tarball URL**: https://registry.npmjs.org/agentful/-/agentful-1.0.0.tgz

## After Publishing

### 1. Verify installation

```bash
# Users can now run:
npx agentful init
npx agentful generate
npx agentful status
```

### 2. Check package page

Visit: https://npmjs.com/package/agentful

### 3. Monitor downloads

```bash
npm view agentful
npm dist-info ls agentful
```

## Organization Publishing (Optional)

If publishing under npm organization:

```json
{
  "name": "@yourorg/agentful",
  "publishConfig": {
    "access": "public"
  }
}
```

Then:
```bash
npm publish --access public
```

## Troubleshooting

### Error: "403 Forbidden"

**Cause**: Package name already taken or not logged in

**Fix**:
```bash
# Check if name is taken
npm view agentful

# If taken, choose different name
# Update package.json "name" field

# Or login
npm login
npm publish
```

### Error: "402 Payment Required"

**Cause**: Publishing scoped package without public access

**Fix**:
```bash
npm publish --access public
```

### Error: "EINVALIDTYPE"

**Cause**: Invalid package.json

**Fix**:
```bash
# Validate package.json
npm init --validate

# Check for syntax errors
cat package.json
```

## Automated Publishing (CI/CD)

### GitHub Actions Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup GitHub Secret

1. Go to repo Settings → Secrets and variables → Actions
2. Add `NPM_TOKEN`
3. Create token at https://npmjs.com/settings/tokens
4. Paste token as secret value

### Publish with tag

```bash
# Create version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will auto-publish
```

## Unpublishing (Emergency Only)

⚠️ **WARNING**: Only unpublish within 72 hours and if critical bug

```bash
# Unpublish entire package
npm unpublish agentful --force

# Or deprecate (safer)
npm deprecate agentful "Critical bug, use v1.0.1 instead"
```

## User Installation Commands

After publishing, users can:

```bash
# One-time initialization
npx agentful init

# Or install globally (optional)
npm install -g @itz4blitz/agentful
agentful init
```

## Verification Checklist

After publishing, verify:

- [ ] Package page loads: https://npmjs.com/package/@itz4blitz/agentful
- [ ] `npx agentful --help` works
- [ ] `npx agentful init` creates files correctly
- [ ] `npx agentful generate` detects tech stack
- [ ] README displays on npm page
- [ ] Version is correct

## Maintenance

### Update dependencies

```bash
# Update package.json version
npm version minor

# Publish
npm publish
```

### Yank a version (if broken)

```bash
npm deprecate agentful@1.0.0 "Broken version, use 1.0.1"
```

## Summary

**Current Status**: ✅ **READY TO PUBLISH (AS ALPHA)**

⚠️ **This is an EXPERIMENTAL release**
- Package size: 32KB (compressed)
- Unpacked size: 110KB
- Total files: 20
- Dependencies: 0 runtime deps (devDependencies only)
- Node required: >=18.0.0
- License: MIT
- **Stability: Alpha (untested)**

**One command to publish**:
```bash
npm login && npm publish
```

**Users will run**:
```bash
npx agentful init
```

**Expected to publish**: `agentful@0.1.0`

Done! 🎉

---

## Post-Publish Checklist

After publishing 0.1.0:

- [ ] Verify installation works: `npx agentful --help`
- [ ] Test on sample projects (different tech stacks)
- [ ] Collect bug reports and feedback
- [ ] Fix critical bugs → Release 0.1.1
- [ ] Once tested → Release 0.2.0 (Beta)
- [ ] Production-ready → Release 1.0.0
