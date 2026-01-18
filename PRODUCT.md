# Fix Vocs Documentation Configuration

## Overview
Fix critical issues in the Vocs documentation configuration that are causing broken images, invalid config properties, and missing features.

## Current Issues
1. Deprecated config keys: `icon`, `logo`, `url`, `github`, `footer` (not valid in Vocs API)
2. Missing logo files - config references `/logo.svg`, `/logo-light.svg`, `/logo-dark.svg` but only `public/assets/agentful.jpeg` exists
3. No "Edit on GitHub" functionality (missing `editLink`)
4. Invalid `github` property (should use `socials` array)
5. No Open Graph images for social sharing (missing `ogImageUrl`)
6. Package.json says Node >=18, but Vocs requires >=22

## Requirements
- Update `vocs.config.ts` to use correct API properties
- Fix logo/icon paths to use existing assets
- Add `editLink` configuration
- Convert `github` to proper `socials` array
- Add `ogImageUrl` for social sharing
- Update package.json engines field
- Ensure all links work and images load correctly

## Success Criteria
- [ ] No deprecated config properties
- [ ] All logo/icon paths resolve to existing files
- [ ] "Edit on GitHub" button appears on docs pages
- [ ] Social links display correctly in top nav
- [ ] Open Graph images configured
- [ ] Documentation builds without warnings
- [ ] Node version requirement matches Vocs requirements
