# Deployment Guide

## Overview

Invoice-HUB uses GitHub Actions for continuous integration and deployment (CI/CD). The system is configured with automated testing, building, and deployment to staging and production environments.

## Workflow Overview

```
Code Push/PR
    ↓
Test Suite (test.yml)
├─ Lint & Format (lint.yml)
├─ Type Checking (build step)
├─ Unit Tests (Jest)
└─ Integration Tests
    ↓
Build Docker Image (build.yml)
    ↓
Deploy to Staging (deploy.yml)
    ├─ Run migrations
    ├─ Start services
    └─ Health checks
    ↓
Deploy to Production (deploy.yml - main branch only)
    ├─ Backup database
    ├─ Run migrations
    ├─ Start services
    ├─ Health checks
    └─ Rollback on failure
```

## Workflows

### 1. Test CI (`.github/workflows/test.yml`)

Runs on every push and PR to `main` or `develop` branches.

**Steps:**
1. Start PostgreSQL and Redis services (Docker)
2. Install dependencies
3. Run ESLint
4. Run TypeScript compilation
5. Run Jest tests with coverage
6. Upload coverage to Codecov
7. Comment on PR with results

**Runs on:** Ubuntu latest
**Duration:** ~3-5 minutes

### 2. Lint Check (`.github/workflows/lint.yml`)

Runs on every push and PR to `main` or `develop` branches.

**Steps:**
1. Install dependencies
2. Run ESLint
3. Check code formatting (Prettier)
4. Run TypeScript compiler

**Runs on:** Ubuntu latest
**Duration:** ~2-3 minutes

### 3. Build Docker (`.github/workflows/build.yml`)

Runs on every push to `main` or `develop` branches.

**Steps:**
1. Set up Docker Buildx
2. Log in to container registry (GHCR)
3. Extract metadata for tagging
4. Build and push Docker image
5. Cache layers for faster builds

**Runs on:** Ubuntu latest
**Duration:** ~5-10 minutes
**Push to Registry:** Only on `main` branch

### 4. Deploy (`.github/workflows/deploy.yml`)

#### Staging Deployment
- **Trigger:** Push to `develop` branch
- **Environment:** `staging`
- **Approval:** None required
- **Steps:**
  1. SSH into staging server
  2. Pull latest code
  3. Install dependencies
  4. Build TypeScript
  5. Run database migrations
  6. Restart application (PM2)
  7. Run health checks
  8. Comment on PR

#### Production Deployment
- **Trigger:** Push to `main` branch OR manual dispatch
- **Environment:** `production`
- **Approval:** Required (set in GitHub settings)
- **Protection:** Depends on `develop` branch tests passing
- **Steps:**
  1. Backup current database
  2. SSH into production server
  3. Pull latest code
  4. Install dependencies
  5. Build TypeScript
  6. Run database migrations
  7. Restart application (PM2)
  8. Run health checks
  9. Rollback on any failure
  10. Update deployment status

## Getting Started

### Prerequisites

1. GitHub repository with admin access
2. Staging and production servers with:
   - Node.js 18+
   - PostgreSQL 15+
   - Redis 7+
   - PM2 for process management
   - SSH access configured

3. SSH keys generated for CI/CD

### Initial Setup

1. **Generate SSH Keys**
   ```bash
   ssh-keygen -t ed25519 -f invoice-hub-deploy -C "GitHub CI/CD"
   ```

2. **Configure GitHub Environments**
   - Go to Settings > Environments
   - Create `staging` and `production` environments
   - Add required secrets to each environment
   - Set protection rules for production

3. **Configure Server Secrets**

   For Staging (in GitHub > Settings > Environments > staging > Secrets):
   ```
   STAGING_DEPLOY_KEY: <private SSH key>
   STAGING_DEPLOY_HOST: staging.example.com
   STAGING_DEPLOY_USER: deploy
   STAGING_DEPLOY_PATH: /var/www/invoice-hub
   ```

   For Production (in GitHub > Settings > Environments > production > Secrets):
   ```
   PRODUCTION_DEPLOY_KEY: <private SSH key>
   PRODUCTION_DEPLOY_HOST: prod.example.com
   PRODUCTION_DEPLOY_USER: deploy
   PRODUCTION_DEPLOY_PATH: /var/www/invoice-hub
   ```

4. **Add Public Keys to Servers**
   ```bash
   cat invoice-hub-deploy.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

5. **Set Up Application on Servers**
   ```bash
   mkdir -p /var/www/invoice-hub
   cd /var/www/invoice-hub
   git clone https://github.com/jomardyan/Invoice-HUB.git .
   npm install
   ```

6. **Configure Environment Files**
   Create `.env` on each server:
   ```env
   NODE_ENV=staging|production
   DATABASE_URL=postgres://user:pass@localhost:5432/invoice_hub
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ENCRYPTION_KEY=your-encryption-key-32-chars
   # ... other environment variables
   ```

7. **Set Up PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name invoice-hub
   pm2 startup
   pm2 save
   ```

## Manual Deployment

### Deploy Staging

```bash
cd /var/www/invoice-hub
git pull origin develop
npm install
npm run build
npm run migrate
pm2 restart invoice-hub
```

### Deploy Production

```bash
# Backup
npm run backup

# Deploy
cd /var/www/invoice-hub
git pull origin main
npm install
npm run build
npm run migrate
pm2 restart invoice-hub

# If rollback needed
npm run restore
```

## Viewing Deployments

1. **GitHub Actions Tab**
   - View workflow runs
   - See logs for each step
   - Check test coverage

2. **Deployment Details**
   - Go to Code > Deployments
   - View deployment history
   - See deployment status

3. **Health Checks**
   - Staging: `https://staging.example.com/api/health`
   - Production: `https://prod.example.com/api/health`

## Troubleshooting

### Tests Failing
1. Check test output in GitHub Actions logs
2. Run locally: `npm test`
3. Check database and Redis connections
4. Review test coverage report

### Deployment Failing
1. Check SSH connectivity to server
2. Verify secrets are correctly configured
3. Check server logs: `pm2 logs invoice-hub`
4. Review disk space and memory
5. Check database connection

### Docker Build Failing
1. Check Dockerfile syntax
2. Verify base image availability
3. Check for build context issues
4. Review Docker build logs

### Health Checks Failing
1. Verify application is running: `pm2 status`
2. Check application logs: `pm2 logs invoice-hub`
3. Verify port is accessible
4. Check database and Redis connections

## Advanced Configuration

### Custom Deployment Scripts

Edit `npm run backup` and `npm run restore` in `package.json`:

```json
"backup": "pg_dump $DATABASE_URL > backup.sql && tar -czf backup.tar.gz backup.sql dist/",
"restore": "tar -xzf backup.tar.gz && psql $DATABASE_URL < backup.sql"
```

### Environment-Specific Variables

Store in GitHub environment variables:
- Settings > Environments > environment name > Variables
- Add custom variables for each environment
- Reference in workflows as `${{ vars.VARIABLE_NAME }}`

### Approval Gates

For production:
1. Settings > Environments > production
2. Deployment branches > Create deployment branch rule
3. Select "Protected branches only"
4. Check "Require reviewers" with appropriate team

## Performance Optimization

### Caching
- npm dependencies cached based on package-lock.json
- Docker layers cached for faster builds

### Parallel Jobs
- Lint and tests run in parallel
- Docker build can run while deployment checks pass

### Database Migrations
- Migrations run before application restart
- Zero-downtime deployments recommended for large migrations

## Monitoring & Alerts

Setup notifications in GitHub:
1. Settings > Notifications
2. Enable email for workflow runs
3. Or use custom webhooks for Slack/Teams integration

## Rollback Procedure

### Automatic Rollback
Production deployment automatically rolls back on:
- Failed health checks
- Database migration errors
- Application startup failure

### Manual Rollback

```bash
# SSH into production server
cd /var/www/invoice-hub

# Revert to previous version
git revert HEAD
npm run build
npm run migrate
pm2 restart invoice-hub
```

## Security Considerations

1. **SSH Keys**
   - Use ed25519 keys (stronger than RSA)
   - Rotate keys regularly
   - Never commit keys to repository

2. **Secrets Management**
   - Use GitHub encrypted secrets
   - Never log sensitive data
   - Rotate API keys regularly

3. **Access Control**
   - Require approvals for production
   - Use branch protection rules
   - Audit deployment logs

4. **Network Security**
   - Use SSH for all deployments
   - Firewall restrict deployment server access
   - Use VPN if available

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Docker and GitHub Actions](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
