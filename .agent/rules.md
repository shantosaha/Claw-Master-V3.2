# Project Rules & Universal Instructions

## Data Mapping & Identifiers

### Machine Identification
- **Properties:** Machines have both a `tag` and an `assetTag`.
- **Primary Identifier:** The `tag` field is the unique identifier for all data mapping and logic.
- **API Mapping:** All external APIs (Game Report, JotForm, Revenue API) use `tag` to identify machines.
- **Matching Rule:** Always match `machine.tag` with `apiData.tag`. Do **not** use `assetTag` for matching unless explicitly instructed for a specific edge case.
- **Type Safety:** Always convert both sides to strings for comparison (`String(machine.tag) === String(apiData.tag)`) to handle mixed number/string types from different APIs.

## Tech Stack & Standards
- **Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS + Vanilla CSS where needed.
- **State Management:** React Hooks (useState, useEffect, useMemo).
- **API Communication:** Use the services in `src/services/` (e.g., `gameReportApiService.ts`) rather than direct fetch calls in components.

## Communication & Style
- **Problem Solving:** Do not apologize for errors; simply fix them and explain the change.
- **UI/UX:** Prioritize visual aesthetics in UI updates. Use modern, dark-themed, premium designs with smooth transitions and clear typography.
- **Logic:** Prefer clarity and reliability over brevity.

## API Integration Rules

### JotForm API
- **Date Filtering:** When calling the JotForm API (via `serviceReportService` or `/api/jotform/`), **always** include the current date as the `date` parameter by default (`YYYY-MM-DD`), unless a specific date or range has been explicitly requested by the user or logic.
- **Local Time Rule:** Always use local time formatting (e.g., `date-fns` `format(date, "yyyy-MM-dd")`) instead of `.toISOString()` to ensure the date matches the user's current day, even in the early morning.
- **Production Compliance:** Only the `date` parameter is supported for filtering. Do not attempt to use `startdate`, `enddate`, or other query parameters.
