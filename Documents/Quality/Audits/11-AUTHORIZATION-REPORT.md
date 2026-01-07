# Authorization & Permissions Report - Claw Master V3

## Document Information
- **Category**: Authorization & Permissions Testing
- **Audit Date**: December 9, 2024
- **Status**: Complete

---

## 1. Overview

This report covers the authorization audit of the Claw Master V3 application, examining role-based access control, protected routes, and permission enforcement.

---

## 2. Scope & Feature List

### Authorization Areas
- Role definitions
- Protected routes
- Feature permissions
- Firestore security rules
- Client-side enforcement
- Server-side enforcement

---

## 3. Locations

| Component | File Location |
|-----------|---------------|
| Auth Context | `src/context/AuthContext.tsx` |
| Protected Route | `src/components/auth/ProtectedRoute.tsx` |
| Firestore Rules | `firestore.rules` |

---

## 4. Expected Behaviour

- Roles clearly defined (admin, manager, tech, crew)
- Protected routes redirect unauthorized users
- Features restricted based on role
- Firestore rules enforce data access
- Consistent permission checking

---

## 5. Actual Behaviour

### 5.1 Role Definitions ✅

| Role | Level | Description |
|------|-------|-------------|
| admin | Highest | Full access, manage users |
| manager | High | View analytics, manage team |
| tech | Medium | Manage machines, maintenance |
| crew | Basic | Basic inventory access |

### 5.2 hasRole Function ✅

```typescript
// AuthContext.tsx
const hasRole = useCallback((roles: UserProfile['role'] | UserProfile['role'][]) => {
    if (!userProfile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userProfile.role);
}, [userProfile]);
```

### 5.3 Protected Routes ✅

| Route | Protection | Allowed Roles |
|-------|------------|---------------|
| `/team` | ProtectedRoute | admin, manager |
| `/analytics` | Custom check | admin, manager |
| Other routes | None | All authenticated |

### 5.4 ProtectedRoute Component

```typescript
// ProtectedRoute.tsx
export function ProtectedRoute({ 
    children, 
    allowedRoles 
}: { 
    children: React.ReactNode; 
    allowedRoles: UserProfile['role'][] 
}) {
    const { userProfile, loading } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    
    if (!userProfile || !allowedRoles.includes(userProfile.role)) {
        return <AccessDenied />;
    }
    
    return <>{children}</>;
}
```

### 5.5 Analytics Page Protection

```typescript
// analytics/page.tsx
const ALLOWED_ROLES = ['admin', 'manager'];

if (!authLoading && !hasRole(ALLOWED_ROLES)) {
    router.push("/");
}
```

---

## 6. Firestore Security Rules ✅

### Users Collection
```javascript
match /users/{userId} {
    allow read: if isAuthenticated();
    allow write: if request.auth.uid == userId || isAdmin();
}
```
- ✅ Users can read all user profiles
- ✅ Users can only edit their own profile
- ✅ Admins can edit any profile

### Stock Items Collection
```javascript
match /stockItems/{itemId} {
    allow read: if isAuthenticated();
    allow write: if isStaff();
}
```
- ✅ All authenticated users can read
- ✅ Staff+ can write

### Machines Collection
```javascript
match /machines/{machineId} {
    allow read: if isAuthenticated();
    allow write: if isStaff();
}
```
- ✅ All authenticated users can read
- ✅ Staff+ can write

### Audit Logs
```javascript
match /auditLogs/{logId} {
    allow read: if isAuthenticated();
    allow create: if isStaff();
    allow update, delete: if false;
}
```
- ✅ All can read
- ✅ Staff+ can create
- ✅ **Immutable** - cannot update or delete

---

## 7. Permission Matrix

| Feature | Crew | Tech | Manager | Admin |
|---------|------|------|---------|-------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Inventory | ✅ | ✅ | ✅ | ✅ |
| Edit Inventory | ✅ | ✅ | ✅ | ✅ |
| View Machines | ✅ | ✅ | ✅ | ✅ |
| Edit Machines | ✅ | ✅ | ✅ | ✅ |
| View Orders | ✅ | ✅ | ✅ | ✅ |
| Edit Orders | ✅ | ✅ | ✅ | ✅ |
| View Maintenance | ✅ | ✅ | ✅ | ✅ |
| Edit Maintenance | ✅ | ✅ | ✅ | ✅ |
| **View Analytics** | ❌ | ❌ | ✅ | ✅ |
| **View Team** | ❌ | ❌ | ✅ | ✅ |
| **Manage Users** | ❌ | ❌ | ❌ | ✅ |

---

## 8. Client vs Server Enforcement

| Check | Client-Side | Server-Side |
|-------|-------------|-------------|
| Route access | ✅ | N/A |
| Feature visibility | ✅ | N/A |
| Data read | Limited | ✅ Firestore |
| Data write | Limited | ✅ Firestore |

---

## 9. Partially Working ⚠️

| Issue | Impact | Notes |
|-------|--------|-------|
| Role change requires logout | Low | Profile cached until refresh |
| No role management UI | Medium | Can't change roles from app |
| Sidebar shows all items | Low | Even to unauthorized users |

---

## 10. Root Cause Analysis

### Sidebar Shows All Items
- **Cause**: Navigation items not filtered by role
- **Impact**: Users see links to pages they can't access
- **Resolution**: Filter navItems based on role

### No Role Management UI
- **Cause**: Admin panel not implemented
- **Impact**: Must change roles in Firestore directly
- **Resolution**: Add role editing to Team page

---

## 11. Proposed Solutions

| Issue | Solution | Effort |
|-------|----------|--------|
| Filter sidebar | Check hasRole for each item | Low |
| Admin role management | Add edit role feature | Medium |
| Real-time role updates | Re-fetch profile on focus | Low |

### Sidebar Filtering Example
```typescript
const navItems = [
    { name: "Dashboard", href: "/", roles: ['all'] },
    { name: "Analytics", href: "/analytics", roles: ['admin', 'manager'] },
    { name: "Team", href: "/team", roles: ['admin', 'manager'] },
    // ...
].filter(item => item.roles.includes('all') || hasRole(item.roles));
```

---

## 12. Fix Priority

| Priority | Issue Count |
|----------|-------------|
| Critical | 0 |
| High | 1 (Sidebar filtering) |
| Medium | 2 |
| Low | 0 |

---

## 13. Retest Requirements

- [ ] Test each role can access allowed pages
- [ ] Verify unauthorized redirects work
- [ ] Test Firestore rules with Firebase emulator
- [ ] Verify role changes take effect
- [ ] Check sidebar filtering after implementation
