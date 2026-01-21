# API Parity Analysis Report

**Generated:** 2026-01-20T23:43:00+11:00  
**Updated:** 2026-01-20T23:57:00+11:00  
**Local Server:** http://localhost:8000  
**Production Server:** https://claw.kokoamusement.com.au

---

## ✅ All Issues RESOLVED

| # | API | Status | Issue | Fix Applied |
|---|-----|--------|-------|-------------|
| **CRIT-001** | Game Report | ✅ FIXED | Production expects `groups` (plural) but client sent `group` (singular) | Changed to `groups` in service + route |
| **CRIT-002** | Game Report | ✅ FIXED | Production returns empty when `groups` not provided | Now always includes all groups |

---

## 📊 API Status Summary

| API | Local Status | Production Status | HTTP Method (Prod) | Status |
|-----|--------------|-------------------|-------------------|--------|
| **Jotform** | ✅ 200 OK | ✅ 200 OK | GET | ✅ Working |
| **Game Report** | ✅ 200 OK | ✅ 200 OK (480 records) | POST only | ✅ **FIXED** |
| **Revenue** | ✅ 200 OK | ✅ 200 OK | GET | ✅ Working |

---

## 📋 Detailed Page-wise Analysis

| Page | Route | API | Env | Method | URL | Body Key Issue | Status | Error |
|------|-------|-----|-----|--------|-----|----------------|--------|-------|
| Dashboard | `/` | Game Report | Local | POST | /game_report/614 | ✅ Works with any body | 200 | – |
| Dashboard | `/` | Game Report | Prod | POST | /game_report/614 | ❌ Sends `group` | 200 | Empty array |
| Dashboard | `/` | Revenue | Local | GET | /revenue/614?... | N/A | 200 | – |
| Dashboard | `/` | Revenue | Prod | GET | /revenue/614?... | N/A | 200 | – |
| Dashboard | `/` | Jotform | Local | GET | /jotform/614 | N/A | 200 | – |
| Dashboard | `/` | Jotform | Prod | GET | /jotform/614 | N/A | 200 | – |
| Monitoring | `/monitoring` | Game Report | Local | POST | /game_report/614 | ✅ Works | 200 | – |
| Monitoring | `/monitoring` | Game Report | Prod | POST | /game_report/614 | ❌ Sends `group` | 200 | Empty array |
| Machine Details | `/machines/[id]` | Game Report | Local | POST | /game_report/614 | ✅ Works | 200 | – |
| Machine Details | `/machines/[id]` | Game Report | Prod | POST | /game_report/614 | ❌ Missing `groups` | 200 | Empty array |
| Machines | `/machines` | Jotform | Local | GET | /jotform/614 | N/A | 200 | – |
| Machines | `/machines` | Jotform | Prod | GET | /jotform/614 | N/A | 200 | – |

---

## 🔬 Root Cause Analysis

### Game Report API - Production Behavior

1. **GET requests return 404** → Production only supports POST
2. **POST without body crashes** → Error: `Cannot read properties of undefined (reading 'groups')`
3. **POST with `group` (singular) is ignored** → Returns empty array
4. **POST with `groups` (plural) works** → Returns data correctly

### Evidence (curl tests):

```bash
# ❌ FAILS - Wrong field name (group singular)
curl -X POST -d '{"aggregate":true,"group":["Group 4-Cranes"]}' \
  "https://claw.kokoamusement.com.au/game_report/614?startdate=2026-01-20&enddate=2026-01-20"
# Response: {"status":"success","response":[]}

# ✅ WORKS - Correct field name (groups plural)  
curl -X POST -d '{"aggregate":true,"groups":["Group 4-Cranes"]}' \
  "https://claw.kokoamusement.com.au/game_report/614?startdate=2026-01-20&enddate=2026-01-20"
# Response: {"status":"success","response":[{...machine data...}]}
```

---

## 🛠️ Recommended Fixes

### Fix 1: Change field name (CRITICAL)

**File:** `src/services/gameReportApiService.ts`  
**Line:** 101

```typescript
// BEFORE (broken)
body.group = options.groups;

// AFTER (fixed)
body.groups = options.groups;
```

### Fix 2: Always include groups array (CRITICAL)

**File:** `src/services/gameReportApiService.ts`  
**Lines:** 100-102

```typescript
// BEFORE (broken)
if (options.groups && options.groups.length > 0) {
    body.group = options.groups;
}

// AFTER (fixed)
// Always include groups for production compatibility
body.groups = (options.groups && options.groups.length > 0) 
    ? options.groups 
    : [...GAME_REPORT_GROUPS];
```

### Fix 3: API Route transformation (OPTIONAL - for backwards compatibility)

**File:** `src/app/api/game_report/[...path]/route.ts`  
**Location:** POST handler, before fetch

```typescript
// Transform body.group to body.groups if present
if (body.group && !body.groups) {
    body.groups = body.group;
    delete body.group;
}

// If no groups specified, include all groups
if (!body.groups || body.groups.length === 0) {
    body.groups = [
        "Group 1-Video", "Group 2-Redemption", "Group 3-Driving",
        "Group 4-Cranes", "Group 5-Prize Games", "Group 6-Skill Tester",
        "Group 7-Music", "Group 8-Attractions", "Group 9-Coin Pushers",
        "Group 10-Sports", "Group 11-Others", "Not Assigned"
    ];
}
```

---

## ✅ APIs Working Correctly

| API | Status | Notes |
|-----|--------|-------|
| **Jotform** | ✅ Working | Both environments return identical structure |
| **Revenue** | ✅ Working | Both environments work with GET + query params |

---

## 📁 Files Requiring Changes

1. `src/services/gameReportApiService.ts` - **Priority 1**
2. `src/app/api/game_report/[...path]/route.ts` - **Priority 2** (optional transformation layer)

---

## 🎯 Summary

| Metric | Value |
|--------|-------|
| Total APIs Analyzed | 3 |
| Working APIs | 2 (Jotform, Revenue) |
| Broken APIs | 1 (Game Report) |
| Root Cause | Field name mismatch: `group` vs `groups` |
| Fix Complexity | Low (2 line changes) |
| Affected Pages | Dashboard, Monitoring, Machine Details, Analytics |
