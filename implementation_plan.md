# Implementation Plan - Arcade Inventory & Playfield-Settings Tracker

## Goal Description
Build a production-ready Arcade Inventory & Playfield-Settings Tracker using Next.js 15, Firebase, and Tailwind CSS. The system will manage arcade machines, stock inventory, orders, and maintenance tasks with a focus on a robust data model and premium UI/UX.

## User Review Required
> [!IMPORTANT]
> **Firebase vs. Supabase**: You asked for a "free of cost" option.
> - **Firebase (Selected)**: Generous free tier (Spark Plan), excellent for real-time updates (needed for machine status), and flexible data structure (perfect for nested "Slots").
> - **Supabase**: Also has a good free tier, but is SQL-based. Given your "Robust" model has nested data, Firebase is slightly faster to develop with. **I will proceed with Firebase unless you object.**
>
> **Tech Stack**: You asked for the "best efficient, fast and reliable" language.
> - **Selected**: **TypeScript** with **Next.js 15**. This is the industry standard for performance (Server Components), reliability (Type Safety), and scalability.

## Proposed Changes

### Project Initialization
#### [NEW] [Project Structure]
- Initialize Next.js 15 app (`npx create-next-app@latest`).
- Install dependencies: `firebase`, `lucide-react`, `clsx`, `tailwind-merge`, `shadcn-ui` components.

### External API Integration (Smart Sync)
#### [NEW] [services/apiService.ts](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/services/apiService.ts)
- **Goal**: Fetch data from `game_report` and `jotform` and merge it into Firestore.
- **Strategy**: "Upsert" (Update if exists, Insert if new) based on the `Tag` field.
- **Logic**:
    1. Fetch `game_report`.
    2. For each item, query Firestore `ArcadeMachines` where `tag == item.Tag`.
    3. If found: Update `revenue`, `status`, `playCount`.
    4. If not found: Create new Machine record.
    5. Fetch `jotform`.
    6. Match by `Tag` and update `MaintenanceLogs` or Machine counters.

### Backend & Data Layer
#### [NEW] [firebase.ts](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/lib/firebase.ts)
- Initialize Firebase App.
- Export `db`, `auth`, `storage`.

#### [NEW] [types.ts](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/types/index.ts)
- Define interfaces: `StockItem`, `ArcadeMachine`, `PlayfieldSetting`, `MaintenanceTask`, `ReorderRequest`, `AuditLog`, `User`.
- **Update**: Add `tag` (string) and `lastSyncedAt` (Date) to `ArcadeMachine`.

### Authentication
#### [NEW] [AuthContext.tsx](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/context/AuthContext.tsx)
- Implement React Context for Authentication.
- Handle Google Sign-In and Role-based access.

### Core Components
#### [NEW] [Components]
- `ui/`: shadcn/ui components (Button, Input, Card, etc.).
- `layout/`: Sidebar, Header, Mobile Navigation.
- **Optimization**: Use `next/image` for automatic compression. Implement `React.Suspense` for loading states.

## Verification Plan

### Automated Tests
- Verify build success: `npm run build`.
- Verify linting: `npm run lint`.

### Manual Verification
- **Auth**: Test Google Sign-In and role persistence.
- **API Sync**: Trigger a "Sync" and verify that `ArcadeMachines` are populated/updated from the dummy API data.
- **Performance**: Verify Lighthouse score for "Best Practices" and "Performance".
