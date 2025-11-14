# GitHub Environments Configuration

This document describes the configuration needed for CI/CD deployments.

## Staging Environment

**GitHub Environment:** `staging`

### Required Secrets
- `STAGING_DEPLOY_KEY` - SSH private key for deployment server
- `STAGING_DEPLOY_HOST` - Hostname/IP of staging server
- `STAGING_DEPLOY_USER` - SSH user for staging server
- `STAGING_DEPLOY_PATH` - Deployment path on staging server

### Environment Variables
Add these to the GitHub environment:
- `NODE_ENV=staging`
- `LOG_LEVEL=debug`

### Triggers
- Automatically deploys on push to `develop` branch
- Manual dispatch available via workflow_dispatch

## Production Environment

**GitHub Environment:** `production`

### Required Secrets
- `PRODUCTION_DEPLOY_KEY` - SSH private key for production server
- `PRODUCTION_DEPLOY_HOST` - Hostname/IP of production server
- `PRODUCTION_DEPLOY_USER` - SSH user for production server
- `PRODUCTION_DEPLOY_PATH` - Deployment path on production server

### Environment Variables
Add these to the GitHub environment:
- `NODE_ENV=production`
- `LOG_LEVEL=info`

### Triggers
- Automatically deploys on push to `main` branch (after staging passes)
- Manual dispatch available via workflow_dispatch
- Requires deployment approval (set in environment protection rules)

### Protection Rules
- Require code review before deployment
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before deployment (test, build, lint jobs)

## Setup Instructions

1. Go to Settings > Environments
2. Create "staging" environment with above secrets
3. Create "production" environment with above secrets and protection rules
4. For each environment, add required deployment keys from your servers

## Database Migrations

### Staging
Migrations run automatically during deployment:
```bash
npm run migrate
```

### Production
Same as staging - migrations run during deployment

## Secrets Management

### How to Add Secrets to GitHub

1. Go to Settings > Secrets and variables > Actions
2. Click "New repository secret"
3. Add each secret with the name and value
4. Environment-specific secrets go in the environment settings

### SSH Key Setup

Generate SSH keys for CI/CD:
```bash
ssh-keygen -t ed25519 -f invoice-hub-deploy -C "GitHub CI/CD"
```

1. Add public key to authorized_keys on server
2. Add private key as `DEPLOY_KEY` secret in GitHub

## Monitoring Deployments

1. View workflow runs in GitHub Actions tab
2. Each deployment logs to workflow console
3. Failed deployments trigger automatic rollback
4. PR comments auto-update with deployment status

## Health Checks

Each deployment runs health checks before completing:
- Staging: `https://staging.invoicehub.example.com/api/health`
- Production: `https://invoicehub.example.com/api/health`

If health checks fail, deployment is considered failed and rollback occurs.

## Backup & Restore

### Before Production Deployment
```bash
npm run backup
```

### On Deployment Failure
```bash
npm run restore
```

These commands should be customized to match your specific backup strategy (e.g., PostgreSQL dumps, S3 backups, etc.)

## Testing

All tests must pass before deployment:
- Lint checks (ESLint)
- Type checking (TypeScript)
- Unit tests (Jest)
- Integration tests (Jest)

Tests run on every push and PR before any deployment is allowed.
