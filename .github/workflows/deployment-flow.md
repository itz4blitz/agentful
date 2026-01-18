# Agentful Deployment Architecture

## Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  Write Code  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Add Changes │
    │  to Git      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Commit with │
    │  Conventional│
    │  Commit Msg  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Push to     │
    │  main branch │
    └──────┬───────┘
           │
           │ ◄─── TRIGERS BOTH WORKFLOWS ───►
           │
   ┌───────┴────────┐
   │                │
   ▼                ▼
┌────────────────┐  ┌──────────────────┐
│ RELEASE        │  │ DEPLOY DOCS      │
│ WORKFLOW       │  │ WORKFLOW         │
├────────────────┤  ├──────────────────┤
│ On: push to    │  │ On: push to      │
│      main      │  │      main        │
├────────────────┤  ├──────────────────┤
│ 1. Checkout    │  │ 1. Checkout      │
│ 2. Setup Node  │  │ 2. Setup Node    │
│ 3. Install deps│  │ 3. Install deps  │
│ 4. Run         │  │ 4. Build docs    │
│    semantic-   │  │    (vocs)        │
│    release     │  │ 5. Deploy to     │
│ 5. Analyze     │  │    Cloudflare    │
│    commits     │  │    Pages         │
│ 6. Determine   │  │ 6. Update        │
│    version     │  │    agentful.app  │
│ 7. Update      │  └──────────────────┘
│    CHANGELOG   │
│ 8. Update      │
│    package.json│
│ 9. Create git  │
│    tag (v*)    │
│10. Create      │
│    GitHub      │
│    release     │
└────────┬───────┘
         │
         │ ◄─── CREATES TAG ───►
         │
         ▼
    ┌──────────────┐
    │  Git Tag     │
    │  (v0.1.0)    │
    └──────┬───────┘
           │
           │ ◄─── TRIGERS WORKFLOW ───►
           │
           ▼
┌────────────────────────┐
│ PUBLISH WORKFLOW       │
├────────────────────────┤
│ On: version tags (v*)  │
├────────────────────────┤
│ 1. Checkout            │
│ 2. Setup Node          │
│ 3. Install deps        │
│ 4. Run tests (if any)  │
│ 5. Verify package      │
│ 6. Create tarball      │
│ 7. Publish to npm      │
│ 8. Create GitHub       │
│    release             │
│ 9. Mark prerelease     │
│    if alpha/beta/rc    │
└────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        END RESULT                                            │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │  npm Package │    │  GitHub      │    │  Cloudflare  │
    │  Published   │    │  Release     │    │  Pages       │
    │              │    │  Created     │    │  Deployed    │
    │  agentful@   │    │              │    │              │
    │  v0.1.0       │    │  - Tag       │    │  agentful.   │
    │              │    │  - Changelog │    │  app         │
    │  npmjs.com/  │    │  - Notes     │    │              │
    │  agentful    │    │              │    │  docs live   │
    └──────────────┘    └──────────────┘    └──────────────┘
```

## Version Bump Logic

```
┌─────────────────────────────────────────────────────────────┐
│              SEMANTIC RELEASE VERSION ANALYSIS              │
└─────────────────────────────────────────────────────────────┘

    Commit Messages                    Version Bump
    ────────────────                   ─────────────

    "feat: add new feature"     ───►  MINOR (0.1.0 → 0.2.0)
    "fix: resolve bug"          ───►  PATCH (0.1.0 → 0.1.1)
    "feat!: breaking change"    ───►  MAJOR (0.1.0 → 1.0.0)

    "docs: update readme"       ───►  NO RELEASE
    "chore: update deps"        ───►  NO RELEASE
    "style: format code"        ───►  NO RELEASE
    "test: add tests"           ───►  NO RELEASE
    "refactor: clean up"        ───►  NO RELEASE


┌─────────────────────────────────────────────────────────────┐
│              CONVENTIONAL COMMIT FORMAT                     │
└─────────────────────────────────────────────────────────────┘

    <type>[optional scope]: <description>

    [optional body]

    [optional footer(s)]

    Examples:
    ─────────

    feat: add user authentication
    fix(api): correct login endpoint
    feat(auth)!: remove deprecated OAuth
    docs: update installation guide
    chore: upgrade dependencies


┌─────────────────────────────────────────────────────────────┐
│              VERSION BUMP DECISION TREE                     │
└─────────────────────────────────────────────────────────────┘

                  Commits Analyzed
                         │
                    ┌────┴────┐
                    │         │
              BREAKING    FEATURE
              CHANGE?     COMMIT?
                    │         │
                   Yes       Yes
                    │         │
                    ▼         ▼
                  MAJOR     MINOR
                  (1.0.0)   (0.2.0)
                    │         │
                    └────┬────┘
                         │
                        No
                         │
                         ▼
                    FIX COMMIT?
                         │
                        Yes
                         │
                         ▼
                       PATCH
                      (0.1.1)
                         │
                        No
                         │
                         ▼
                    NO RELEASE
```

## Secret Management

```
┌─────────────────────────────────────────────────────────────┐
│              GITHUB SECRETS SETUP                           │
└─────────────────────────────────────────────────────────────┘

    GitHub Repository
    └─ Settings
       └─ Secrets and variables
          └─ Actions
             ├─ NPM_TOKEN
             │  └─ Source: npmjs.com/settings/tokens
             │     Type: Automation
             │     Used by: publish.yml
             │
             ├─ CLOUDFLARE_API_TOKEN
             │  └─ Source: dash.cloudflare.com/profile/api-tokens
             │     Permissions: Cloudflare Pages Edit
             │     Used by: deploy-docs.yml
             │
             └─ CLOUDFLARE_ACCOUNT_ID
                 └─ Source: dash.cloudflare.com (right sidebar)
                    Used by: deploy-docs.yml


┌─────────────────────────────────────────────────────────────┐
│              WORKFLOW PERMISSIONS                           │
└─────────────────────────────────────────────────────────────┘

    GITHUB_TOKEN (Auto-provided)
    ├─ contents: read       # Read repository
    ├─ id-token: write      # npm provenance
    ├─ pull-requests: write # Release comments
    └─ deployments: write   # Cloudflare Pages
```

## File Flow

```
┌─────────────────────────────────────────────────────────────┐
│              FILE MODIFICATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

    Push to main
         │
         ▼
    ┌────────────────┐
    │  .releaserc    │  (Config file - read only)
    │  .json         │
    └────────────────┘
         │
         ▼
    ┌────────────────┐
    │  package.json  │  ◄── Version updated
    │  CHANGELOG.md  │  ◄── Changelog updated
    └────────────────┘
         │
         ▼
    ┌────────────────┐
    │  Git Tag       │  ◄── Created (v0.1.0)
    │  (v*)          │
    └────────────────┘
         │
         ▼
    ┌────────────────┐
    │  GitHub Release│  ◄── Created with notes
    └────────────────┘
         │
         ▼
    ┌────────────────┐
    │  npm Registry  │  ◄── Package published
    └────────────────┘


┌─────────────────────────────────────────────────────────────┐
│              DOCUMENTATION BUILD FLOW                       │
└─────────────────────────────────────────────────────────────┘

    docs/
    ├─ pages/
    │  └─ *.mdx        (Source files)
    ├─ index.html
    └─ vocs.config.ts  (Config)
         │
         ▼
    ┌────────────────┐
    │  npm run       │
    │  docs:build    │
    └────────────────┘
         │
         ▼
    ┌────────────────┐
    │  vocs build    │  (Vocs static site generator)
    └────────────────┘
         │
         ▼
    docs/.vocs/dist/    (Build output)
         │
         ▼
    ┌────────────────┐
    │  Cloudflare    │
    │  Pages Action  │
    └────────────────┘
         │
         ▼
    ┌────────────────┐
    │  agentful.app  │  (Live site)
    └────────────────┘
```

## Release Timeline

```
Time:  0s          30s          60s          90s          120s
       │            │            │            │            │
       ▼            ▼            ▼            ▼            ▼
    ┌─────┐      ┌─────┐      ┌─────┐      ┌─────┐      ┌─────┐
Push │     │      │     │      │     │      │     │      │     │
to   │     │      │     │      │     │      │     │      │     │
main └──┬──┘      └──┬──┘      └──┬──┘      └──┬──┘      └──┬──┘
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ RELEASE     │   │            │            │            │
    │ WORKFLOW    │   │            │            │            │
    │ STARTS      │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ DEPLOY DOCS │   │            │            │            │
    │ WORKFLOW    │   │            │            │            │
    │ STARTS      │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Analyze     │   │            │            │            │
    │ commits     │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Build docs  │   │            │            │            │
    │ (vocs)      │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Determine   │   │            │            │            │
    │ version     │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Update      │   │            │            │            │
    │ CHANGELOG   │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Deploy to   │   │            │            │            │
    │ Cloudflare  │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Create git  │   │            │            │            │
    │ tag (v*)    │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
    ┌────▼────────┐   │            │            │            │
    │ Deploy      │   │            │            │            │
    │ complete    │   │            │            │            │
    └────┬────────┘   │            │            │            │
         │            │            │            │            │
         └────┬───────┘──┬─────────┘            │            │
              │         │                      │            │
              ▼         ▼                      │            │
         ┌─────┐   ┌─────┐                     │            │
         │ Tag │   │ Docs│                     │            │
         │pushed│   │live │                     │            │
         └──┬──┘   └─────┘                     │            │
            │                                  │            │
            │ ◄─── TRIGGERS ───►              │            │
            │                                  │            │
            ▼                                  ▼            ▼
       ┌─────────┐                       ┌─────────┐   ┌─────────┐
       │ PUBLISH │                       │ ALL     │   │ npm     │
       │ WORKFLOW│                       │ WORKFLOWS│   │ package │
       │ STARTS  │                       │ COMPLETE│   │ live    │
       └────┬────┘                       └─────────┘   └─────────┘
            │
       ┌────▼────────┐
       │ Publish to  │
       │ npm         │
       └────┬────────┘
            │
       ┌────▼────────┐
       │ GitHub      │
       │ release     │
       │ created     │
       └─────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICE INTEGRATIONS                  │
└─────────────────────────────────────────────────────────────┘

    GitHub Repository
    ┌─────────────────────────────────────┐
    │  ┌─────────────────────────────────┐│
    │  │  GitHub Actions                 ││
    │  │  ├─ Release Workflow            ││
    │  │  ├─ Publish Workflow            ││
    │  │  └─ Deploy Docs Workflow        ││
    │  └─────────────────────────────────┘│
    │                                     │
    │  ├─ Git Tags                        │
    │  ├─ GitHub Releases                 │
    │  └─ Status Badges                   │
    └─────────────────────────────────────┘
                  │
                  │
         ┌────────┼────────┐
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌─────────┐
    │  npm    │      │Cloudflare│
    │ Registry│      │  Pages   │
    │         │      │          │
    │ Package:│      │ Project: │
    │ agentful│      │ agentful │
    └─────────┘      └─────────┘
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌─────────┐
    │ npx     │      │ https:// │
    │ agentful│      │ agentful │
    │ init    │      │ .app     │
    └─────────┘      └─────────┘
```

---

**Last Updated**: 2026-01-18
**Version**: 0.1.0
