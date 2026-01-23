---
name: deployment
description: Guides deployment preparation and production readiness validation
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Deployment Skill

## Pre-Deployment Checklist

Before deploying to production:

### Code Quality
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code coverage ≥80%
- [ ] No type errors
- [ ] No linter errors or warnings
- [ ] No formatting issues
- [ ] Security vulnerabilities checked

### Build & Configuration
- [ ] Production build succeeds locally
- [ ] Environment variables documented in `.env.example`
- [ ] All required secrets configured
- [ ] Database migrations ready and tested
- [ ] Migration rollback scripts prepared

### Deployment Plan
- [ ] Rollback procedure documented
- [ ] Stakeholders notified
- [ ] Monitoring and health checks configured
- [ ] Post-deployment verification steps defined

## Environment Variables

**Create `.env.example`:**
```bash
# Document all required variables
DATABASE_URL=
API_KEY=
JWT_SECRET=
NODE_ENV=production
```

**Runtime Validation:**
Validate environment variables at application startup to catch configuration errors early.

## Database Migrations

**Safe Migration Strategy:**
1. Test migrations in staging environment
2. Backup production database before migration
3. Write rollback scripts for all migrations
4. Apply migrations before or after code deployment (depending on breaking changes)
5. Monitor application after migration

## Health Checks

Implement health check endpoints:
- `/health` - Overall system health (database, cache, external services)
- `/ready` - Readiness to serve traffic
- `/alive` - Process liveness

## Rollback Procedures

**Always have a rollback plan:**
1. Know how to revert code deployment on your platform
2. Know how to rollback database migrations
3. Test rollback procedure in staging
4. Document rollback commands

## Post-Deployment Verification

After deployment:
1. Verify health checks return 200 OK
2. Test critical user workflows
3. Monitor error rates and logs for 15+ minutes
4. Verify database migrations applied correctly

## Common Deployment Platforms

Choose platform based on your stack and requirements:
- **Static sites**: Netlify, Vercel, CloudFlare Pages, GitHub Pages
- **Serverless**: AWS Lambda, Vercel Functions, Netlify Functions, CloudFlare Workers
- **Containers**: AWS ECS, Google Cloud Run, Azure Container Apps, Railway, Render
- **Virtual Machines**: AWS EC2, DigitalOcean, Linode, Hetzner
- **Kubernetes**: AWS EKS, Google GKE, Azure AKS, DigitalOcean Kubernetes

Consult your platform's documentation for specific deployment commands and configuration.

## Rules

### DO
- Run full test suite before deploying
- Validate environment configuration
- Test production build locally
- Document rollback procedure
- Monitor after deployment
- Tag releases in version control

### DON'T
- Deploy with failing tests
- Commit secrets to version control
- Deploy without rollback plan
- Skip environment validation
- Deploy breaking changes without coordination
- Deploy on Friday afternoon without monitoring capacity

## Integration

The orchestrator uses this skill when:
- User requests deployment
- Feature is complete and ready to ship
- Rollback is needed
- Environment setup required
