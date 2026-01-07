# Task List: Arcade Inventory & Playfield-Settings Tracker

- [x] **Project Setup & Foundation**
    - [x] Initialize Next.js 15 project with TypeScript, Tailwind, shadcn/ui <!-- id: 0 -->
    - [x] Set up Firebase (Firestore, Auth, Storage) <!-- id: 1 -->
    - [x] Configure Environment Variables <!-- id: 2 -->
    - [x] Create initial directory structure (components, lib, hooks, types) <!-- id: 3 -->
    - [x] Reorganize documentation into Topic/View structure <!-- id: 999 -->

- [ ] **Authentication & User Management**
    - [x] Implement Firebase Auth (Google SSO) <!-- id: 4 -->
    - [x] Create `AuthContext` and User Provider <!-- id: 5 -->
    - [x] Create Team Management Page <!-- id: 7 -->
    - [ ] Implement Email Verification Logic <!-- id: 40 -->
    - [ ] Implement Session Timeout (30m) <!-- id: 41 -->
    - [ ] Create VerificationBanner Component <!-- id: 42 -->
    - [ ] Create SessionManager Component <!-- id: 43 -->
    - [ ] Verify RBAC Security Rules <!-- id: 6 -->

- [ ] **External API Integration (Smart Sync)**
    - [ ] Create `ApiService` for fetching `game_report` and `jotform` <!-- id: 31 -->
    - [ ] Implement "Smart Sync" logic (Match by `Tag`, Upsert Data) <!-- id: 32 -->
    - [ ] Create Background Job/Button to trigger manual sync <!-- id: 33 -->


- [/] **Core Data Model Implementation**
    - [x] Define TypeScript interfaces for all entities (StockItems, ArcadeMachines, etc.) <!-- id: 8 -->
    - [ ] Create Firestore service functions (CRUD) <!-- id: 9 -->
    - [ ] Implement Audit Logging system <!-- id: 10 -->


- [ ] **Inventory Management (StockItems)**
    - [ ] Build/Refactor Inventory Page (List, Sort, Search, Filter) <!-- id: 11 -->
    - [ ] Implement Inventory Details Page (Activity Log, History) <!-- id: 12 -->
    - [ ] Implement Add/Edit Inventory logic (Validation, Warnings) <!-- id: 13 -->
    - [ ] Implement Stock Assignment logic (to Machines) <!-- id: 14 -->

- [ ] **Machine Management (ArcadeMachines)**
    - [ ] Build/Refactor Machine Page (List, Sort, Status) <!-- id: 15 -->
    - [ ] Implement Machine Details Page (Slots, Settings, Stock) <!-- id: 16 -->
    - [ ] Implement Add/Edit Machine logic (Validation, Warnings) <!-- id: 17 -->
    - [ ] Implement "Slots" logic for multi-game machines <!-- id: 18 -->

- [ ] **Order & Reorder System**
    - [ ] Build Order Page (Sections, Drag & Drop/Layouts) <!-- id: 19 -->
    - [ ] Implement Reorder Request workflow <!-- id: 20 -->
    - [ ] Implement Order History <!-- id: 21 -->

- [ ] **Weekly Stock Check**
    - [ ] Build Stock Check Form UI <!-- id: 22 -->
    - [ ] Implement Assignment & Review workflow <!-- id: 23 -->
    - [ ] Implement Stock Update logic upon approval <!-- id: 24 -->

- [ ] **Maintenance & Settings**
    - [ ] Build Maintenance Dashboard <!-- id: 25 -->
    - [ ] Implement Playfield Settings tracking <!-- id: 26 -->

- [ ] **UI/UX Polish & Optimization**
    - [ ] Implement Global Loading States & Feedback (Optimistic UI) <!-- id: 27 -->
    - [ ] Implement "10s Countdown" Warnings for destructive actions <!-- id: 28 -->
    - [ ] Optimize Performance (Image compression, Lazy loading) <!-- id: 29 -->
    - [ ] Update Branding (Claw Icon, "Prize Patrol") <!-- id: 30 -->
    - [ ] Implement User Preferences (Layout saving) <!-- id: 34 -->

