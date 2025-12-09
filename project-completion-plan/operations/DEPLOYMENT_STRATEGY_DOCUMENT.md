# Deployment Strategy Document - Claw Master V3

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Settings Tracker
- **Created**: December 9, 2024
- **Version**: 1.0.0

---

## 1. Deployment Overview

### Target Platform

| Component | Service | Tier |
|-----------|---------|------|
| Frontend/Backend | Vercel | Pro (~$20/month) |
| Database | Firebase Firestore | Blaze (Pay-as-you-go) |
| Authentication | Firebase Auth | Free tier |
| Storage | Firebase Storage | Blaze (Pay-as-you-go) |
| Email | SendGrid/Resend | Free tier initially |
| Error Monitoring | Sentry | Free tier initially |

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000 | Local development |
| Staging | staging.clawmaster.app | Pre-production testing |
| Production | app.clawmaster.app | Live production |

---

## 2. Infrastructure Setup

### 2.1 Vercel Configuration

#### Project Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Set project settings
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
```

#### vercel.json Configuration

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["syd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 2.2 Firebase Configuration

#### Production Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init

# Select:
# - Firestore
# - Hosting (optional, using Vercel)
# - Storage
# - Functions (if needed)

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

#### Production Security Rules

`firestore.rules`:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ... production rules (see SECURITY_IMPLEMENTATION_PLAN.md)
  }
}
```

### 2.3 Domain Configuration

#### DNS Settings

```
Type    Name    Value                   TTL
A       @       76.76.21.21            300
CNAME   www     cname.vercel-dns.com   300
CNAME   staging cname.vercel-dns.com   300
```

#### Vercel Domain Setup

```bash
vercel domains add clawmaster.app
vercel domains add staging.clawmaster.app
```

---

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run build --dry-run || npx tsc --noEmit
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install -g vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Staging
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install -g vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Production
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }})
          echo "deployment_url=$url" >> $GITHUB_OUTPUT
      
      - name: Notify on Success
        if: success()
        run: |
          echo "Deployed to ${{ steps.deploy.outputs.deployment_url }}"

  e2e-test:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          BASE_URL: https://staging.clawmaster.app
```

### 3.2 Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* | fix/* | hotfix/*
```

| Branch | Deploys To | Trigger |
|--------|------------|---------|
| `main` | Production | Push/merge |
| `develop` | Staging | Push/merge |
| `feature/*` | Preview | Pull request |

---

## 4. Pre-Deployment Checklist

### 4.1 Code Quality

- [ ] All ESLint errors fixed
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Code coverage meets threshold (80%)

### 4.2 Configuration

- [ ] Environment variables set in Vercel
- [ ] Firebase security rules deployed
- [ ] Firebase indexes defined
- [ ] Domain configured and verified

### 4.3 Security

- [ ] Demo mode disabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Error monitoring configured

### 4.4 Performance

- [ ] Lighthouse score > 80
- [ ] Bundle size < 500KB
- [ ] Images optimized
- [ ] Caching configured

### 4.5 Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] User documentation available
- [ ] Deployment runbook ready

---

## 5. Deployment Runbook

### 5.1 Standard Deployment

```bash
# 1. Ensure on develop branch with latest changes
git checkout develop
git pull origin develop

# 2. Run tests locally
npm test
npm run lint
npm run build

# 3. Create release branch (if major release)
git checkout -b release/v1.0.0

# 4. Merge to main
git checkout main
git merge release/v1.0.0

# 5. Push to trigger deployment
git push origin main

# 6. Monitor deployment
# - Check Vercel dashboard
# - Check Sentry for errors
# - Verify in browser

# 7. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 5.2 Hotfix Deployment

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# 2. Make fix and test
# ... fix code ...
npm test

# 3. Merge to main
git checkout main
git merge hotfix/critical-fix
git push origin main

# 4. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### 5.3 Rollback Procedure

```bash
# Option 1: Vercel Dashboard
# - Go to Vercel project
# - Click "Deployments"
# - Find previous working deployment
# - Click "..." → "Promote to Production"

# Option 2: Git Revert
git checkout main
git revert HEAD
git push origin main

# Option 3: Manual Redeploy
vercel --prod --force
```

---

## 6. Monitoring & Alerting

### 6.1 Sentry Setup

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 6.2 Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 6.3 Alert Configuration

| Alert | Threshold | Channel |
|-------|-----------|---------|
| Error Rate | > 1% | Email + Slack |
| Response Time | > 3s | Email |
| Deployment Failed | Any | Slack |
| Uptime | < 99.9% | Email + SMS |

---

## 7. Backup & Recovery

### 7.1 Firebase Backup

```bash
# Export Firestore data
gcloud firestore export gs://backup-bucket/firestore-backup

# Schedule daily backups
# (Configure in Google Cloud Scheduler)
```

### 7.2 Recovery Procedure

```bash
# Import from backup
gcloud firestore import gs://backup-bucket/firestore-backup

# Verify data integrity
# - Check collection counts
# - Verify recent documents
# - Test application functionality
```

---

## 8. Cost Estimation

### Monthly Costs (Estimated)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Vercel | Pro | $20 |
| Firebase | Blaze | $50-200 |
| SendGrid | Free/Essentials | $0-20 |
| Sentry | Free/Team | $0-26 |
| Domain | Annual | ~$15/yr |
| **Total** | | **$70-266/month** |

### Scaling Costs

| Users | Firebase Est. | Vercel Est. | Total |
|-------|---------------|-------------|-------|
| 1-100 | $50 | $20 | $70 |
| 100-1000 | $100 | $20 | $120 |
| 1000-5000 | $200 | $50 | $250 |
| 5000+ | $500+ | $100+ | Contact |

---

## 9. Go-Live Checklist

### D-7 (One Week Before)

- [ ] Staging environment tested thoroughly
- [ ] All features verified by QA
- [ ] Documentation complete
- [ ] Support team briefed
- [ ] Backup procedures tested

### D-1 (Day Before)

- [ ] Final code freeze
- [ ] Final staging deployment
- [ ] Smoke tests pass
- [ ] Monitoring configured
- [ ] Team on standby

### D-Day (Launch Day)

- [ ] Deploy to production
- [ ] Verify deployment succeeded
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Announce launch
- [ ] Monitor for 4 hours

### D+1 (Day After)

- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Address any issues
- [ ] Collect initial feedback

---

## 10. Post-Deployment Monitoring

### First 24 Hours

- [ ] Error rate < 0.1%
- [ ] Response time < 1s (P95)
- [ ] No critical bugs reported
- [ ] All features accessible

### First Week

- [ ] User adoption metrics
- [ ] Performance trends
- [ ] Error patterns
- [ ] User feedback review

### Ongoing

- [ ] Weekly performance reports
- [ ] Monthly cost review
- [ ] Quarterly security audit
