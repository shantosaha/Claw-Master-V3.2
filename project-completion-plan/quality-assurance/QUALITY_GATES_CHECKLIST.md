# Quality Gates Checklist - Claw Master V3

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Settings Tracker
- **Created**: December 9, 2024
- **Version**: 1.0.0

---

## 1. Phase Gate Structure

Each phase of development must pass quality gates before proceeding:

```
Phase 1 ──► Gate 1 ──► Phase 2 ──► Gate 2 ──► Phase 3 ──► Gate 3 ──► Phase 4 ──► Gate 4 ──► Launch
```

---

## 2. Gate 1: Foundation Complete

### Code Quality

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| ESLint Errors | 0 errors | `npm run lint` | ☐ |
| ESLint Warnings | < 10 warnings | `npm run lint` | ☐ |
| TypeScript Errors | 0 errors | `npm run build` | ☐ |
| Console Errors | 0 errors | Browser DevTools | ☐ |

### Testing

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Jest Configured | ✓ | `npm test` runs | ☐ |
| Unit Tests Exist | ≥ 30 tests | `npm test -- --coverage` | ☐ |
| Test Coverage | ≥ 30% statements | Coverage report | ☐ |

### Infrastructure

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Firebase Enabled | Real Firestore active | Create/read data | ☐ |
| Error Monitoring | Sentry configured | Check Sentry dashboard | ☐ |
| Environment Vars | All set in Vercel | Vercel dashboard | ☐ |

### Security

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Demo Mode Disabled | No mock auth in prod | Login flow test | ☐ |
| Security Rules Deployed | Rules in Firebase | Firebase console | ☐ |

**Gate 1 Sign-off**: _______________ Date: _______________

---

## 3. Gate 2: Core Features Complete

### Feature Completion

| Feature | Requirement | How to Verify | Status |
|---------|-------------|---------------|--------|
| Dashboard | All metrics load | Visual inspection | ☐ |
| Inventory CRUD | All operations work | Test each operation | ☐ |
| Machine CRUD | All operations work | Test each operation | ☐ |
| Orders Kanban | Drag-drop works | Visual + functional test | ☐ |
| Maintenance | Tasks manageable | Create/assign/resolve | ☐ |
| Monitoring | Live data displays | Visual inspection | ☐ |
| Team | View members | Visual inspection | ☐ |

### Testing

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Unit Tests | ≥ 100 tests | `npm test` | ☐ |
| Integration Tests | ≥ 20 tests | `npm test` | ☐ |
| Test Coverage | ≥ 50% statements | Coverage report | ☐ |

### Performance

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Page Load | < 3s LCP | Lighthouse | ☐ |
| No Memory Leaks | Stable over time | Chrome DevTools | ☐ |

**Gate 2 Sign-off**: _______________ Date: _______________

---

## 4. Gate 3: Enhanced Features Complete

### Feature Completion

| Feature | Requirement | How to Verify | Status |
|---------|-------------|---------------|--------|
| Real-time Sync | Data syncs across tabs | Open 2 tabs, modify data | ☐ |
| Team Invites | Invites send/work | Send invite, accept | ☐ |
| Role Management | Roles can be changed | Change role, verify access | ☐ |
| Notifications | Emails delivered | Trigger notification | ☐ |
| Report Export | CSV/PDF generates | Export a report | ☐ |

### Testing

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Unit Tests | ≥ 200 tests | `npm test` | ☐ |
| Integration Tests | ≥ 50 tests | `npm test` | ☐ |
| E2E Tests | ≥ 5 critical paths | `npm run test:e2e` | ☐ |
| Test Coverage | ≥ 70% statements | Coverage report | ☐ |

### Accessibility

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Keyboard Nav | All interactive elements | Tab through app | ☐ |
| Screen Reader | Major flows accessible | VoiceOver/NVDA test | ☐ |
| Color Contrast | WCAG AA | Lighthouse/axe | ☐ |

**Gate 3 Sign-off**: _______________ Date: _______________

---

## 5. Gate 4: Production Ready

### Performance

| Metric | Requirement | How to Verify | Status |
|--------|-------------|---------------|--------|
| Lighthouse Performance | ≥ 90 | Lighthouse | ☐ |
| Lighthouse Accessibility | ≥ 95 | Lighthouse | ☐ |
| Lighthouse Best Practices | ≥ 90 | Lighthouse | ☐ |
| Lighthouse SEO | ≥ 90 | Lighthouse | ☐ |
| First Contentful Paint | < 1.5s | Lighthouse | ☐ |
| Largest Contentful Paint | < 2.5s | Lighthouse | ☐ |
| Time to Interactive | < 3.5s | Lighthouse | ☐ |
| Bundle Size | < 500KB | Build output | ☐ |

### Security

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Security Headers | A+ grade | securityheaders.com | ☐ |
| HTTPS Only | Enforced | Try HTTP access | ☐ |
| No Vulnerabilities | 0 critical/high | `npm audit` | ☐ |
| Pen Test Passed | No critical findings | Security audit report | ☐ |

### Testing

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Test Coverage | ≥ 80% statements | Coverage report | ☐ |
| E2E Tests | ≥ 10 paths | `npm run test:e2e` | ☐ |
| All Tests Pass | 100% | CI pipeline | ☐ |
| Manual Regression | Completed | QA sign-off | ☐ |

### Documentation

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| User Docs | Complete | Review docs | ☐ |
| API Docs | Complete | Review docs | ☐ |
| Deployment Docs | Complete | Review docs | ☐ |
| Runbook | Complete | Review docs | ☐ |

### Legal

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Privacy Policy | Published | Check URL | ☐ |
| Terms of Service | Published | Check URL | ☐ |
| Cookie Consent | Implemented | Visual check | ☐ |

### Operations

| Check | Requirement | How to Verify | Status |
|-------|-------------|---------------|--------|
| Monitoring | Configured | Check dashboards | ☐ |
| Alerting | Configured | Trigger test alert | ☐ |
| Backup | Verified | Restore test | ☐ |
| Rollback | Tested | Perform rollback | ☐ |

**Gate 4 Sign-off**: _______________ Date: _______________

---

## 6. Launch Authorization

### Final Checks

| Check | Owner | Verified | Status |
|-------|-------|----------|--------|
| All gates passed | Tech Lead | ☐ | ☐ |
| Stakeholder approval | Product Owner | ☐ | ☐ |
| Support team ready | Support Lead | ☐ | ☐ |
| Marketing ready | Marketing Lead | ☐ | ☐ |
| Go-live plan reviewed | All | ☐ | ☐ |

### Authorization

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | | | |
| Product Owner | | | |
| Project Manager | | | |

---

## 7. Post-Launch Gates

### L+1 Day

| Check | Requirement | Status |
|-------|-------------|--------|
| Error rate | < 0.1% | ☐ |
| Response time | < 1s P95 | ☐ |
| No critical bugs | 0 critical | ☐ |
| Uptime | > 99.9% | ☐ |

### L+7 Days

| Check | Requirement | Status |
|-------|-------------|--------|
| User adoption | ≥ target | ☐ |
| Error rate | < 0.05% | ☐ |
| User feedback | Addressed | ☐ |
| Performance stable | ≤ baseline | ☐ |

### L+30 Days

| Check | Requirement | Status |
|-------|-------------|--------|
| KPIs met | ≥ targets | ☐ |
| No regressions | Stable | ☐ |
| Costs within budget | ≤ budget | ☐ |
| Security audit | Passed | ☐ |

---

## 8. Gate Failure Procedures

### If Gate Fails

1. **Document** - Record what failed and why
2. **Analyze** - Root cause analysis
3. **Plan** - Create remediation plan
4. **Execute** - Fix the issues
5. **Re-test** - Verify fixes
6. **Re-evaluate** - Re-run gate checks

### Escalation Path

| Severity | Action | Timeline |
|----------|--------|----------|
| Minor | Fix and re-test | 1-2 days |
| Major | Remediation plan | 3-5 days |
| Critical | Stop release, fix | Immediate |

---

## 9. Automation

### Automated Gate Checks

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main, develop]

jobs:
  gate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type Check
        run: npx tsc --noEmit
      
      - name: Test
        run: npm test -- --coverage
      
      - name: Coverage Check
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.statements.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
      
      - name: Build
        run: npm run build
      
      - name: Bundle Size Check
        run: |
          SIZE=$(du -k .next/static | tail -1 | cut -f1)
          if [ $SIZE -gt 500000 ]; then
            echo "Bundle size ${SIZE}KB exceeds 500MB"
            exit 1
          fi
```

---

## 10. Appendix: Test Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.ts

# Run E2E tests
npm run test:e2e

# Run Lighthouse
npx lighthouse https://staging.clawmaster.app --output=html --output-path=./lighthouse-report.html

# Check security headers
curl -I https://staging.clawmaster.app

# Check bundle size
npm run build && du -sh .next/static
```
