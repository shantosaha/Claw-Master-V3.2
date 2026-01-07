# Authentication Implementation Plan

## Goal Description
Enhance the authentication system by implementing **Email Verification** and **Session Timeout** security controls. These are identified as high-priority gaps in the `SECURITY_IMPLEMENTATION_PLAN.md`.

## User Review Required
> [!NOTE]
> **Email Service**: For the "Team Invite" feature, a backend email service (like SendGrid + Firebase Functions) is required. This plan focuses on **Client-Side** security controls (Verification enforcement & Session management) which can be done without new backend infrastructure first.

## Proposed Changes

### Authentication Logic

#### [MODIFY] [AuthContext.tsx](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/src/context/AuthContext.tsx)
- Add `emailVerified` checking in `signInWithGoogle`.
- Add `checkVerification` function to re-check status.
- Add `sessionTimeout` logic (auto-logout after inactivity).

### UI Components

#### [NEW] [VerificationBanner.tsx](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/src/components/auth/VerificationBanner.tsx)
- A dismissible (or persistent) banner showing "Please verify your email".
- Button to "Resend Verification Email".

#### [NEW] [SessionManager.tsx](file:///Users/frankenstein/Documents/Work/Claw Mater/Claw-Master-V3/src/components/auth/SessionManager.tsx)
- A background component that tracks mouse/keyboard activity.
- Logs out user if inactive for 30 minutes.
- Shows a "Warning" modal 1 minute before timeout.

## Verification Plan

### Manual Verification
1.  **Email Verification**:
    - Sign in with a new Google Account (or mock user).
    - If `emailVerified` is false, verify the banner appears.
    - Click "Resend Email" and verify the Firebase Auth function is called.
2.  **Session Timeout**:
    - Log in.
    - Set the timeout constant to 10 seconds (temporary dev change).
    - Wait >10s without moving mouse.
    - Verify user is logged out and redirected to login.
