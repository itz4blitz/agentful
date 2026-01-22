---
name: deployment
description: Guides deployment preparation, platform integration, and production readiness validation
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Deployment Skill

## Responsibilities

### 1. Pre-deployment Validation

- **Quality Gates**: Check all tests pass, linting succeeds, no TypeScript errors
- **Environment Configuration**: Verify all required environment variables are documented and configured
- **Build Validation**: Ensure production build succeeds without errors or warnings
- **Database Readiness**: Confirm migrations are ready, tested, and have rollback plans
- **Security Audit**: Verify no secrets in code, dependencies have no critical vulnerabilities
- **Performance Baseline**: Check bundle sizes, performance budgets, and resource usage

### 2. Platform Integration

- **Vercel**: Serverless deployments, edge functions, preview environments
- **AWS**: Lambda functions, ECS containers, EC2 instances, S3 static hosting
- **Netlify**: Static sites, serverless functions, form handling
- **Railway/Render**: Full-stack applications, databases, automatic deployments
- **Docker**: Containerization for any platform, multi-stage builds, orchestration
- **Custom VPS**: Direct server deployments, reverse proxy setup, process management

### 3. Environment Management

- **Variable Validation**: Ensure all required environment variables are present
- **Secrets Management**: Use platform-native secrets (Vercel Secrets, AWS Secrets Manager, etc.)
- **Multi-Environment Strategy**: Separate dev, staging, and production configurations
- **Configuration Templates**: Provide `.env.example` files with all required variables
- **Type Safety**: Validate environment variable types and formats at startup

### 4. Rollback Procedures

- **Backup Strategies**: Database backups, previous deployment snapshots, git tags
- **Quick Rollback**: Platform-specific commands to revert to previous version
- **Database Rollback**: Migration down scripts, point-in-time recovery procedures
- **Health Checks**: Automated checks after deployment to verify system health
- **Incident Response**: Documented procedures for handling deployment failures

## Workflow

### Pre-Deployment Checklist

Execute this checklist before every production deployment:

```markdown
## Code Quality
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code coverage ≥80%
- [ ] No Type errors
- [ ] No errors or warnings
- [ ] No formatting issues
- [ ] Security vulnerabilities checked

## Build & Performance
- [ ] Production build succeeds locally
- [ ] Production build tested and verified
- [ ] Bundle size within budget
- [ ] No console warnings in production build
- [ ] Assets optimized (images, fonts, etc.)

## Database & Data
- [ ] Database migrations ready and tested
- [ ] Migration rollback scripts prepared
- [ ] Data backups completed
- [ ] Seed data prepared (if needed)

## Configuration
- [ ] Environment variables documented in `.env.example`
- [ ] All required secrets configured in platform
- [ ] API keys and credentials rotated (if needed)
- [ ] CORS and security headers configured

## Documentation & Planning
- [ ] Deployment plan documented
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Monitoring and alerts configured
- [ ] Post-deployment verification steps documented
```

### Platform-Specific Deployment Guides

#### Vercel Deployment

**Initial Setup:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

**Environment Variables:**

```bash
# Add environment variable for production
vercel env add DATABASE_URL production

# Add for preview environments
vercel env add DATABASE_URL preview

# Add for development
vercel env add DATABASE_URL development

# Pull environment variables to local
vercel env pull
```

**Deployment:**

```bash
# Deploy to preview environment (automatic URL)
vercel

# Deploy to production
vercel --prod

# Deploy with custom build command
vercel --build-env NODE_ENV=production

# Check deployment status
vercel inspect [deployment-url]
```

**Configuration (`vercel.json`):**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Rollback:**

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]
```

#### AWS Deployment

**Lambda + API Gateway (Serverless Framework):**

```bash
# Install Serverless Framework
npm install -g serverless

# Configure AWS credentials
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET

# Deploy to staging
serverless deploy --stage staging

# Deploy to production
serverless deploy --stage production

# Deploy single function (faster)
serverless deploy function --function functionName --stage production

# View logs
serverless logs --function functionName --stage production --tail

# Rollback to previous deployment
serverless rollback --timestamp 1234567890 --stage production
```

**Configuration (`serverless.yml`):**

```yaml
service: my-service

provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:DATABASE_URL}

  # IAM permissions
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
          Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/*"

functions:
  api:
    handler: dist/handler.main
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-dotenv-plugin
```

**Lambda + API Gateway (AWS SAM):**

```bash
# Install AWS SAM CLI
brew install aws-sam-cli  # macOS
# or download from AWS website

# Build application
sam build

# Deploy with guided prompts
sam deploy --guided

# Deploy to production stack
sam deploy --stack-name my-app-production --config-env production

# View logs
sam logs --stack-name my-app-production --tail

# Rollback (delete current and redeploy previous)
aws cloudformation delete-stack --stack-name my-app-production
# Then redeploy previous version
```

**ECS Deployment:**

```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com
docker build -t my-app .
docker tag my-app:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/my-app:latest
docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/my-app:latest

# Update ECS service
aws ecs update-service --cluster my-cluster --service my-service --force-new-deployment

# Rollback: Update task definition to previous revision
aws ecs update-service --cluster my-cluster --service my-service --task-definition my-task:PREVIOUS_REVISION
```

#### Netlify Deployment

**Setup:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Link existing site
netlify link
```

**Environment Variables:**

```bash
# Add environment variable
netlify env:set DATABASE_URL "your-value" --context production

# Import from .env file
netlify env:import .env

# List all variables
netlify env:list
```

**Deployment:**

```bash
# Deploy to draft URL
netlify deploy

# Deploy to production
netlify deploy --prod

# Deploy specific directory
netlify deploy --dir=dist --prod
```

**Configuration (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
  NPM_VERSION = "10"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[context.production]
  environment = { NODE_ENV = "production" }

[context.deploy-preview]
  command = "npm run build:preview"
```

**Rollback:**

```bash
# View deployment history
netlify deploy:list

# Rollback to specific deploy
netlify rollback --deploy-id [deploy-id]
```

#### Railway Deployment

**Setup:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project
railway link
```

**Environment Variables:**

```bash
# Add variable
railway variables set DATABASE_URL="your-value"

# Add from file
railway variables set -f .env
```

**Deployment:**

```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service backend

# View logs
railway logs

# Open deployed application
railway open
```

**Configuration (`railway.json`):**

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Docker Deployment (Platform-Agnostic)

**Multi-Stage Production Dockerfile:**

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]
```

**Docker Compose (Multi-Service):**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
```

**Docker Commands:**

```bash
# Build production image
docker build -t my-app:latest .

# Run container
docker run -d -p 3000:3000 --env-file .env.production my-app:latest

# Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale service
docker-compose up -d --scale app=3

# Stop and remove
docker-compose down

# Stop and remove with volumes
docker-compose down -v
```

### Environment Variable Management

**Create `.env.example` Template:**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API Keys
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Application
NODE_ENV=production
PORT=3000
APP_URL=https://myapp.com

# Feature Flags
ENABLE_FEATURE_X=true
ENABLE_ANALYTICS=true
```

**Runtime Validation:**

```typescript
// env.ts - Type-safe environment validation
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // API Keys
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string(),

  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).default('3000'),
  APP_URL: z.string().url(),

  // Feature Flags
  ENABLE_FEATURE_X: z.string().transform(val => val === 'true'),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error);
    process.exit(1);
  }
}

// Usage in app startup
const env = validateEnv();
```

**Loading Environment Variables:**

```typescript
// Load dotenv early in application
import 'dotenv/config';
import { validateEnv } from './env';

// Validate before starting server
const env = validateEnv();

// Use typed env throughout app
console.log(`Starting server on port ${env.PORT}`);
```

### Database Migration Strategy

**Pre-Deployment Migration Workflow:**

```markdown
## 1. Development Phase
- Create migration files locally
- Test migrations in development database
- Write rollback/down migrations
- Document breaking changes

## 2. Staging Phase
- Deploy migration to staging environment
- Run migration: `npm run migrate:staging`
- Verify data integrity
- Test application with migrated schema
- Test rollback: `npm run migrate:rollback:staging`
- Re-run migration to confirm repeatability

## 3. Production Phase (Non-Breaking Changes)
- Automated migration during deployment
- Health checks after migration
- Monitor application for errors
- Rollback plan ready

## 4. Production Phase (Breaking Changes)
- Coordinate maintenance window
- Backup database before migration
- Run migration manually: `npm run migrate:production`
- Verify migration success
- Deploy application code
- Monitor closely for issues
```

**Migration Commands (Prisma Example):**

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add-user-role

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DEV ONLY!)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Rollback (requires custom script)
# Create migrations/rollback.ts with down migrations
```

**Migration Commands (TypeORM Example):**

```bash
# Generate migration from entities
npm run typeorm migration:generate -- -n AddUserRole

# Run pending migrations
npm run typeorm migration:run

# Rollback last migration
npm run typeorm migration:revert

# Show migration status
npm run typeorm migration:show
```

**Safe Migration Patterns:**

```markdown
## Adding Columns (Non-Breaking)
1. Add column as nullable
2. Deploy application code
3. Backfill data if needed
4. Make column non-nullable (optional)

## Renaming Columns (Breaking)
1. Add new column
2. Dual-write to both columns
3. Backfill old → new
4. Switch reads to new column
5. Remove old column

## Removing Columns (Breaking)
1. Stop writing to column
2. Deploy code that doesn't reference column
3. Remove column in later migration

## Schema Changes
Always test with production data volume/complexity
```

### Deployment Health Checks

**Health Check Endpoint:**

```typescript
// routes/health.ts
import { Router } from 'express';
import { db } from '../db';
import { redis } from '../cache';

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown',
    },
  };

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.checks.database = 'ok';
  } catch (error) {
    checks.status = 'error';
    checks.checks.database = 'error';
  }

  // Redis check
  try {
    await redis.ping();
    checks.checks.redis = 'ok';
  } catch (error) {
    checks.status = 'error';
    checks.checks.redis = 'error';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
  };

  checks.checks.memory = memUsageMB.heapUsed < 512 ? 'ok' : 'warning';

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// Readiness check (for Kubernetes)
router.get('/ready', async (req, res) => {
  // Check if app is ready to serve traffic
  try {
    await db.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Liveness check (for Kubernetes)
router.get('/alive', (req, res) => {
  // Simple check that process is running
  res.status(200).json({ alive: true });
});

export default router;
```

**Post-Deployment Verification Script:**

```bash
#!/bin/bash
# verify-deployment.sh

DEPLOYMENT_URL=$1
MAX_RETRIES=30
RETRY_DELAY=10

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "Usage: ./verify-deployment.sh <deployment-url>"
  exit 1
fi

echo "🔍 Verifying deployment at $DEPLOYMENT_URL"

# Wait for deployment to be accessible
for i in $(seq 1 $MAX_RETRIES); do
  echo "⏳ Attempt $i/$MAX_RETRIES..."

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/health")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed!"

    # Run additional checks
    echo "🔍 Running smoke tests..."

    # Check critical endpoints
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/status")
    if [ "$API_STATUS" != "200" ]; then
      echo "❌ API status check failed (HTTP $API_STATUS)"
      exit 1
    fi

    echo "✅ All checks passed!"
    echo "🚀 Deployment verified successfully!"
    exit 0
  fi

  echo "⚠️  Health check returned HTTP $HTTP_CODE, retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done

echo "❌ Deployment verification failed after $MAX_RETRIES attempts"
exit 1
```

### Rollback Procedures

**Quick Rollback Guide by Platform:**

```markdown
## Vercel
vercel promote [previous-deployment-url]

## AWS Lambda (Serverless)
serverless rollback --timestamp [timestamp] --stage production

## AWS ECS
aws ecs update-service --cluster my-cluster --service my-service --task-definition my-task:[previous-revision]

## Netlify
netlify rollback --deploy-id [deploy-id]

## Railway
# Redeploy previous commit
git revert HEAD
railway up

## Docker
docker tag my-app:v1.2.3 my-app:latest
docker push my-app:latest
# Then restart service

## Kubernetes
kubectl rollout undo deployment/my-app
kubectl rollout status deployment/my-app
```

**Database Rollback:**

```markdown
## Prisma
# Manual rollback - no built-in command
# Apply down migrations manually or restore from backup

## TypeORM
npm run typeorm migration:revert

## Sequelize
npx sequelize-cli db:migrate:undo

## PostgreSQL Point-in-Time Recovery
# Stop application
# Restore from backup
pg_restore -d myapp backup.sql
# Or use point-in-time recovery if configured
```

**Rollback Decision Matrix:**

```markdown
| Issue Severity | Action |
|---------------|--------|
| Critical bug affecting all users | Immediate rollback |
| Data corruption | Immediate rollback + restore backup |
| Performance degradation (>2x slower) | Rollback if no quick fix |
| Minor UI bug | Hot-fix forward, no rollback |
| Config error | Update config, no rollback |
| Database migration failure | Rollback migration + code |
```

## Rules

### ALWAYS Do These

1. **Validate environment** before deploying - run full pre-deployment checklist
2. **Test production build locally** - catch build issues before deployment
3. **Document rollback procedure** - know how to revert before deploying
4. **Validate environment variables** - use type-safe validation (Zod, etc.)
5. **Run migrations in staging first** - test with production-like data
6. **Use health checks** - automated verification after deployment
7. **Tag releases in git** - `git tag v1.2.3` for easy rollback reference
8. **Monitor after deployment** - watch logs and metrics for 15+ minutes
9. **Use multi-stage Docker builds** - minimize image size and attack surface
10. **Implement zero-downtime deployments** - blue-green or rolling updates

### NEVER Do These

1. **Deploy with failing tests** - fix tests or disable temporarily with justification
2. **Commit secrets to version control** - use environment variables or secret management
3. **Deploy without rollback plan** - always know how to revert
4. **Skip environment validation** - catch config errors before deployment
5. **Deploy breaking migrations without coordination** - plan maintenance windows
6. **Deploy on Friday afternoon** - give time to monitor and respond to issues
7. **Deploy multiple large changes together** - increases blast radius of failures
8. **Ignore deployment warnings** - investigate and resolve before proceeding
9. **Use `--force` flags without understanding** - can cause irreversible damage
10. **Deploy without notifying stakeholders** - coordinate with team and users

### Best Practices

1. **Immutable Infrastructure** - treat servers as disposable, never SSH to patch
2. **Infrastructure as Code** - version control all infrastructure configuration
3. **Automate Everything** - CI/CD pipelines, health checks, rollbacks
4. **Progressive Rollouts** - canary deployments, feature flags, gradual traffic shifts
5. **Monitoring and Alerting** - set up before deploying, not after issues arise
6. **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
7. **Rate Limiting** - protect APIs from abuse and DDoS
8. **Graceful Shutdown** - handle SIGTERM, close connections, finish in-flight requests
9. **Backup Before Major Changes** - database, config, application state
10. **Document Incidents** - post-mortem for failures, update procedures

## Integration

### With Other Skills

- **Quality Assurance**: Deployment depends on all tests passing (unit, integration, e2e)
- **Code Review**: Deployment follows successful review and approval
- **Security**: Validates secrets management, security headers, vulnerability scanning
- **Performance**: Checks bundle sizes, performance budgets, resource limits
- **Database**: Coordinates migration strategy, backup procedures, rollback plans

### With Orchestrator

The orchestrator calls this skill when:
- User requests deployment: "deploy to production"
- Feature is complete and tested: "this is ready to ship"
- Rollback is needed: "revert the last deployment"
- Environment setup: "configure production environment"

### Handoff Points

**To Deployment:**
- All code merged to main branch
- All tests passing in CI
- Code review approved
- Environment variables documented

**From Deployment:**
- Deployment URL and status
- Health check results
- Any issues encountered
- Rollback procedure if needed

## Examples

### Example 1: Full Production Deployment (Vercel)

```markdown
User: "Deploy the new authentication feature to production"

Deployment Skill Actions:

1. **Pre-Deployment Validation**
   - ✅ Check tests: `npm test` - All passing
   - ✅ Check TypeScript: `tsc --noEmit` - No errors
   - ✅ Check linting: `npm run lint` - All passing
   - ✅ Security audit: `npm audit` - No critical vulnerabilities
   - ✅ Build: `npm run build` - Success

2. **Environment Check**
   - ✅ Verify all env vars in Vercel dashboard
   - ✅ Confirm DATABASE_URL, JWT_SECRET, API keys configured

3. **Deploy**
   - Run: `vercel --prod`
   - Output: Deployed to https://myapp.com (deployment-abc123)

4. **Post-Deployment Verification**
   - ✅ Health check: GET https://myapp.com/health - 200 OK
   - ✅ Auth endpoint: POST https://myapp.com/api/auth/login - 200 OK
   - ✅ Monitor logs for 15 minutes - No errors

5. **Document**
   - Git tag: `git tag v1.2.0 && git push --tags`
   - Rollback command: `vercel promote [previous-url]`
   - Notify team: "✅ Auth feature deployed to production"
```

### Example 2: Database Migration Deployment (Railway)

```markdown
User: "Deploy the database schema changes for user roles"

Deployment Skill Actions:

1. **Migration Preparation**
   - Review migration file: `migrations/20260120_add_user_roles.sql`
   - Verify rollback script exists: `migrations/20260120_add_user_roles_down.sql`

2. **Staging Validation**
   - Deploy to staging: `railway up --service backend --environment staging`
   - Run migration: `railway run npm run migrate:deploy`
   - Test application with new schema
   - Verify data integrity
   - Test rollback: `railway run npm run migrate:rollback`
   - Re-run migration to confirm repeatability

3. **Production Backup**
   - Backup database: Railway auto-backup confirmed
   - Export recent data: `railway run pg_dump > backup-20260120.sql`

4. **Production Deployment**
   - Deploy code: `railway up --service backend --environment production`
   - Run migration: `railway run npm run migrate:deploy --environment production`
   - Verify migration: Check logs for success

5. **Verification**
   - ✅ Health check: All systems operational
   - ✅ Test role assignment: API working correctly
   - ✅ Monitor for errors: 15 minutes, no issues

6. **Document**
   - Rollback procedure: Revert migration + redeploy previous code
   - Migration notes: Added `role` column, backfilled existing users as 'user'
```

### Example 3: Rollback Failed Deployment

```markdown
User: "The latest deployment is causing errors, roll it back"

Deployment Skill Actions:

1. **Assess Impact**
   - Check error rates: 15% of requests failing
   - Review logs: Database connection timeout errors
   - Severity: High - immediate rollback needed

2. **Execute Rollback (Vercel)**
   - List deployments: `vercel ls`
   - Identify previous stable: deployment-xyz789 (1 hour ago)
   - Promote previous: `vercel promote deployment-xyz789`
   - Verify: Deployment promoted to production

3. **Verify Rollback**
   - ✅ Health check: https://myapp.com/health - 200 OK
   - ✅ Error rates: Returned to normal (0.1%)
   - ✅ Monitor logs: No connection errors

4. **Post-Incident**
   - Notify team: "Rolled back to v1.1.9 due to DB connection issues"
   - Create incident report: Document error, rollback, root cause
   - Action items: Fix database connection pool settings
   - Test fix in staging before re-deploying
```

## Troubleshooting

### Common Deployment Issues

**Build Failures:**
```markdown
Symptom: Build fails in platform but succeeds locally
Causes:
- Environment differences (Node version, dependencies)
- Missing environment variables during build
- Platform-specific build constraints (memory, time)

Solutions:
- Match Node version: Specify in package.json engines field
- Check build logs for specific errors
- Increase build resources if available
- Use platform-specific build configuration
```

**Environment Variable Issues:**
```markdown
Symptom: App crashes or behaves incorrectly after deployment
Causes:
- Missing required environment variables
- Incorrect variable values
- Variables not loaded at startup

Solutions:
- Validate env vars at startup (use Zod or similar)
- Check platform dashboard for variable configuration
- Verify variable values (staging vs production URLs, etc.)
- Use .env.example as reference checklist
```

**Database Connection Failures:**
```markdown
Symptom: Cannot connect to database after deployment
Causes:
- Incorrect DATABASE_URL
- Database not accessible from deployment platform
- Connection pool exhausted
- SSL/TLS configuration issues

Solutions:
- Verify DATABASE_URL format and credentials
- Check database firewall rules (whitelist deployment IPs)
- Adjust connection pool settings
- Enable SSL for production databases
- Test connection with database client
```

**Performance Degradation:**
```markdown
Symptom: Application slower after deployment
Causes:
- Database query performance (missing indexes)
- Increased load without horizontal scaling
- Cold start issues (serverless)
- Bundle size increased

Solutions:
- Add database indexes for slow queries
- Scale horizontally (more instances)
- Use provisioned concurrency (Lambda)
- Optimize bundle size, code splitting
- Enable caching layers
```

## Summary

The deployment skill ensures:
- **Quality Gates**: Only deploy tested, validated code
- **Platform Expertise**: Support for major platforms (Vercel, AWS, Docker, etc.)
- **Environment Safety**: Proper secrets management, multi-environment strategies
- **Rollback Readiness**: Always have a plan to revert changes
- **Health Verification**: Automated checks after every deployment
- **Best Practices**: Zero-downtime, immutable infrastructure, progressive rollouts

Always prioritize stability and user experience over speed of deployment.
