# Security Implementation Plan - Claw Master V3

## Document Information
- **Project**: Claw Master V3 - Arcade Inventory & Settings Tracker
- **Created**: December 9, 2024
- **Version**: 1.0.0

---

## 1. Overview

### Current Security State

| Area | Status | Risk Level |
|------|--------|------------|
| Authentication | 🟡 Basic | Medium |
| Authorization | ✅ Good | Low |
| Input Validation | 🟡 Partial | Medium |
| Data Protection | ✅ Good | Low |
| Rate Limiting | ❌ Missing | High |
| Audit Logging | 🟡 Partial | Medium |
| CSRF Protection | ✅ Firebase | Low |

### Target Security State

All critical security controls implemented, ready for production with:
- Complete authentication flow
- Comprehensive input validation
- Rate limiting on all endpoints
- Full audit trail
- Security monitoring

---

## 2. Authentication Security

### 2.1 Current Implementation

```typescript
// AuthContext.tsx - Current flow
const signInWithGoogle = async () => {
  if (!isFirebaseInitialized) {
    alert("Demo Mode: You are already logged in as Admin.");
    return;  // ⚠️ Demo bypass - MUST be removed in production
  }
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
```

### 2.2 Required Improvements

#### Email Verification

**Implementation**:

```typescript
// After Google Sign-In, verify email
const handleSignIn = async () => {
  const result = await signInWithPopup(auth, provider);
  
  if (!result.user.emailVerified) {
    await sendEmailVerification(result.user);
    // Show verification required UI
    setVerificationPending(true);
    return;
  }
  
  // Proceed with login
  await loadUserProfile(result.user);
};

// Verification check component
const EmailVerificationGate = ({ children }) => {
  const { user } = useAuth();
  
  if (user && !user.emailVerified) {
    return <VerificationRequiredScreen />;
  }
  
  return children;
};
```

#### Session Management

**Implementation**:

```typescript
// Add session timeout handling
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  
  const resetTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      logout();
      toast.warning("Session expired. Please log in again.");
    }, SESSION_TIMEOUT);
  };
  
  // Reset on user activity
  window.addEventListener('mousemove', resetTimeout);
  window.addEventListener('keydown', resetTimeout);
  
  resetTimeout();
  
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('mousemove', resetTimeout);
    window.removeEventListener('keydown', resetTimeout);
  };
}, [logout]);
```

#### Two-Factor Authentication

**Implementation** (using Firebase Multi-Factor Auth):

```typescript
// Enable 2FA
const enableTwoFactor = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user');
  
  // Get TOTP secret
  const multiFactorSession = await multiFactor(user).getSession();
  const totpSecret = await TotpSecret.generateSecret(multiFactorSession);
  
  // Generate QR code
  const qrCodeUrl = totpSecret.generateQrCodeUrl(
    user.email!,
    'Claw Master'
  );
  
  return { qrCodeUrl, secret: totpSecret };
};

// Verify and finalize enrollment
const verifyTwoFactor = async (verificationCode: string, secret: TotpSecret) => {
  const credential = TotpMultiFactorGenerator.assertionForEnrollment(
    secret,
    verificationCode
  );
  
  await multiFactor(auth.currentUser!).enroll(credential, 'TOTP');
};
```

---

## 3. Authorization

### 3.1 Current Implementation

Firestore security rules:

```javascript
// firestore.rules - Current
function isStaff() {
  return isAuthenticated() && 
    (getUserData().role in ['staff', 'manager', 'admin', 'tech', 'crew']);
}

function isAdmin() {
  return hasRole('admin');
}
```

### 3.2 Required Improvements

#### Enhanced Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Validate user data
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidRole(role) {
      return role in ['crew', 'tech', 'manager', 'admin'];
    }
    
    // Rate limiting helper (pseudo-code, implement with Firebase Functions)
    function isWithinRateLimit() {
      return true; // Implement with Cloud Functions
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if request.auth.uid == userId && 
                   isValidEmail(request.resource.data.email) &&
                   request.resource.data.role == 'crew'; // Default role only
      allow update: if (request.auth.uid == userId && 
                    !request.resource.data.keys().hasAny(['role'])) ||
                    isAdmin();
      allow delete: if isAdmin();
    }
    
    // Stock Items - with field validation
    match /stockItems/{itemId} {
      allow read: if isAuthenticated();
      
      allow create: if isStaff() && 
                   request.resource.data.name.size() > 0 &&
                   request.resource.data.name.size() <= 200 &&
                   request.resource.data.category.size() > 0;
      
      allow update: if isStaff() &&
                   request.resource.data.name.size() <= 200;
      
      allow delete: if isAdmin();
    }
    
    // Audit logs - immutable
    match /auditLogs/{logId} {
      allow read: if isAuthenticated();
      allow create: if isStaff() &&
                   request.resource.data.keys().hasAll(['action', 'entityType', 'entityId', 'userId', 'timestamp']);
      allow update, delete: if false;
    }
  }
}
```

#### Client-Side Permission Checks

```typescript
// src/lib/permissions.ts
import { Role } from '@/types';

export const PERMISSIONS = {
  inventory: {
    view: ['crew', 'tech', 'manager', 'admin'],
    create: ['tech', 'manager', 'admin'],
    edit: ['tech', 'manager', 'admin'],
    delete: ['admin'],
  },
  machines: {
    view: ['crew', 'tech', 'manager', 'admin'],
    create: ['manager', 'admin'],
    edit: ['tech', 'manager', 'admin'],
    delete: ['admin'],
  },
  analytics: {
    view: ['manager', 'admin'],
  },
  team: {
    view: ['manager', 'admin'],
    manage: ['admin'],
  },
  settings: {
    view: ['admin'],
    edit: ['admin'],
  },
} as const;

export const hasPermission = (
  userRole: Role, 
  resource: keyof typeof PERMISSIONS, 
  action: string
): boolean => {
  const resourcePerms = PERMISSIONS[resource];
  const actionPerms = resourcePerms[action as keyof typeof resourcePerms];
  return actionPerms?.includes(userRole) ?? false;
};

// Hook for components
export const usePermission = (resource: string, action: string) => {
  const { userProfile } = useAuth();
  if (!userProfile) return false;
  return hasPermission(userProfile.role, resource as any, action);
};
```

---

## 4. Input Validation

### 4.1 Current Implementation

Using Zod for client-side validation:

```typescript
// Current pattern
const stockItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  // ...
});
```

### 4.2 Required Improvements

#### Enhanced Validation Schemas

```typescript
// src/lib/validation/stockItem.ts
import { z } from 'zod';

// Sanitization helpers
const sanitizeString = (val: string) => 
  val.trim()
     .replace(/[<>]/g, '') // Remove HTML chars
     .slice(0, 500); // Max length

export const stockItemSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name too long')
    .transform(sanitizeString),
  
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category too long')
    .transform(sanitizeString),
  
  sku: z.string()
    .max(50, 'SKU too long')
    .regex(/^[A-Za-z0-9-_]*$/, 'SKU contains invalid characters')
    .optional(),
  
  description: z.string()
    .max(2000, 'Description too long')
    .transform(sanitizeString)
    .optional(),
  
  lowStockThreshold: z.number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(10000, 'Value too large'),
  
  cost: z.number()
    .min(0, 'Cannot be negative')
    .max(1000000, 'Value too large')
    .optional(),
  
  locations: z.array(z.object({
    name: z.string().min(1).max(100).transform(sanitizeString),
    quantity: z.number().int().min(0).max(100000),
  })).min(1, 'At least one location required'),
});

export type StockItemInput = z.infer<typeof stockItemSchema>;
```

#### API Route Validation (if using API routes)

```typescript
// src/app/api/stock/route.ts (example if using API routes)
import { NextRequest, NextResponse } from 'next/server';
import { stockItemSchema } from '@/lib/validation/stockItem';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validated = stockItemSchema.parse(body);
    
    // Process validated data
    // ...
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 5. Rate Limiting

### 5.1 Implementation Options

#### Option A: Firebase Cloud Functions

```typescript
// functions/src/rateLimit.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export const rateLimitMiddleware = async (
  context: functions.https.CallableContext
) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Not authenticated');
  }
  
  const uid = context.auth.uid;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  const userRateLimitRef = admin.firestore()
    .collection('rateLimits')
    .doc(uid);
  
  const doc = await userRateLimitRef.get();
  const data = doc.data();
  
  if (data) {
    const validRequests = data.requests.filter(
      (ts: number) => ts > windowStart
    );
    
    if (validRequests.length >= MAX_REQUESTS) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Please try again later.'
      );
    }
    
    await userRateLimitRef.update({
      requests: [...validRequests, now],
    });
  } else {
    await userRateLimitRef.set({
      requests: [now],
    });
  }
};
```

#### Option B: Client-Side Rate Limiting (Basic)

```typescript
// src/lib/rateLimit.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;
  
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    if (timestamps.length >= this.maxRequests) {
      return false;
    }
    
    timestamps.push(now);
    this.requests.set(key, timestamps);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Usage in service
export const stockService = {
  async add(data: any) {
    if (!rateLimiter.isAllowed('stock.add')) {
      throw new Error('Rate limit exceeded');
    }
    // proceed with operation
  }
};
```

---

## 6. Audit Logging

### 6.1 Enhanced Audit Service

```typescript
// src/services/auditService.ts
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditEntry {
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';
  entityType: 'stock' | 'machine' | 'order' | 'maintenance' | 'user' | 'settings';
  entityId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  oldValue?: any;
  newValue?: any;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
}

export const auditService = {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        ...entry,
        timestamp: serverTimestamp(),
        // Sanitize sensitive data
        oldValue: this.sanitizeForLog(entry.oldValue),
        newValue: this.sanitizeForLog(entry.newValue),
      });
    } catch (error) {
      console.error('Audit log failed:', error);
      // Don't throw - audit logging should not break flow
    }
  },
  
  sanitizeForLog(value: any): any {
    if (!value) return value;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = { ...value };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  },
  
  // Helper for CRUD operations
  async logCrud<T extends { id: string }>(
    action: 'create' | 'update' | 'delete',
    entityType: AuditEntry['entityType'],
    entity: T,
    user: { uid: string; email: string; role: string },
    oldEntity?: T
  ): Promise<void> {
    await this.log({
      action,
      entityType,
      entityId: entity.id,
      userId: user.uid,
      userEmail: user.email,
      userRole: user.role,
      oldValue: action === 'update' || action === 'delete' ? oldEntity : undefined,
      newValue: action === 'create' || action === 'update' ? entity : undefined,
    });
  },
};
```

### 6.2 Integration with Services

```typescript
// Example: StockService with audit logging
export const createAuditedStockService = (user: User) => ({
  async add(data: Omit<StockItem, 'id'>) {
    const id = await stockService.add(data);
    
    await auditService.logCrud('create', 'stock', 
      { id, ...data } as StockItem,
      { uid: user.uid, email: user.email!, role: user.role }
    );
    
    return id;
  },
  
  async update(id: string, data: Partial<StockItem>) {
    const oldItem = await stockService.getById(id);
    await stockService.update(id, data);
    
    await auditService.logCrud('update', 'stock',
      { id, ...data } as StockItem,
      { uid: user.uid, email: user.email!, role: user.role },
      oldItem
    );
  },
  
  async delete(id: string) {
    const oldItem = await stockService.getById(id);
    await stockService.delete(id);
    
    await auditService.logCrud('delete', 'stock',
      oldItem!,
      { uid: user.uid, email: user.email!, role: user.role }
    );
  },
});
```

---

## 7. Security Headers

### 7.1 Next.js Configuration

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.firebaseapp.com;
      style-src 'self' 'unsafe-inline' fonts.googleapis.com;
      font-src 'self' fonts.gstatic.com;
      img-src 'self' data: blob: *.googleusercontent.com firebasestorage.googleapis.com;
      connect-src 'self' *.googleapis.com *.firebaseio.com;
      frame-ancestors 'none';
    `.replace(/\n/g, ' ')
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

---

## 8. Secrets Management

### 8.1 Environment Variables

```bash
# .env.local (never commit)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

# Server-only secrets (for API routes/functions)
FIREBASE_ADMIN_KEY=xxx
SENDGRID_API_KEY=xxx
SENTRY_DSN=xxx
```

### 8.2 Vercel Environment Configuration

```bash
# Production secrets in Vercel Dashboard
vercel env add FIREBASE_ADMIN_KEY production
vercel env add SENDGRID_API_KEY production
```

---

## 9. Security Checklist

### Pre-Launch Security Requirements

- [ ] **Authentication**
  - [ ] Remove demo mode from production
  - [ ] Implement email verification
  - [ ] Add session timeout
  - [ ] Implement proper logout

- [ ] **Authorization**
  - [ ] Review all Firestore rules
  - [ ] Test role-based access for each feature
  - [ ] Implement admin-only routes

- [ ] **Input Validation**
  - [ ] All forms use Zod validation
  - [ ] Server-side validation on critical operations
  - [ ] Input length limits enforced

- [ ] **Rate Limiting**
  - [ ] Implement rate limiting
  - [ ] Test rate limit behavior
  - [ ] Add rate limit headers

- [ ] **Audit Logging**
  - [ ] All CRUD operations logged
  - [ ] Login/logout events logged
  - [ ] Sensitive actions logged

- [ ] **Security Headers**
  - [ ] CSP configured
  - [ ] HSTS enabled
  - [ ] X-Frame-Options set

- [ ] **Secrets**
  - [ ] No secrets in code
  - [ ] Secrets in environment variables
  - [ ] Production secrets in Vercel

---

## 10. Implementation Timeline

| Week | Tasks |
|------|-------|
| 1 | Email verification, session timeout |
| 2 | Rate limiting, enhanced Firestore rules |
| 3 | Audit logging completion |
| 4 | Security headers, secrets management |
| 5 | Security testing, penetration testing |
| 6 | Fix vulnerabilities, final audit |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| OWASP Top 10 Coverage | 100% |
| Security Headers Grade | A+ (securityheaders.com) |
| Penetration Test Issues | 0 critical, 0 high |
| Audit Log Coverage | 100% of mutations |
| Auth Flow Coverage | 100% of entry points |
