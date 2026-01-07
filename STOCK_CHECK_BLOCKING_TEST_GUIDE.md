# Stock Check Submission Blocking - Testing Guide

## Overview
The stock check submission blocking mechanism is now fully implemented with comprehensive logging. The system supports three modes:

1. **Allow Multiple Submissions** (Default) - No blocking
2. **Block Until Resolved** - Only one pending submission allowed at a time
3. **Block for Duration** - Block new submissions for X minutes after each submission

## What Was Fixed

### 1. Critical Timing Issue
**Problem**: `recordSubmission()` was being called asynchronously AFTER the form reset, allowing rapid clicks to bypass the blocking check.

**Solution**: Moved `recordSubmission()` to execute **synchronously** immediately after creating the pending submission and BEFORE resetting the form.

### 2. Added Comprehensive Logging
All blocking-related operations now log to the console:
- `[StockCheck]` - Form-level checks
- `[AppSettings]` - Service-level blocking logic

### 3. Created Settings UI
Added `StockCheckSettingsCard` component that appears at the top of the Stock Check page (admin only).

## How to Test

### Step 1: Navigate to Settings Page
1. Click on your user profile or navigate to `/settings`
2. You should see a "Stock Check" tab in the settings tabs list
3. **Note**: This tab only appears if you have the `stockCheckSettings` permission (admins have this by default)

### Step 2: Configure Blocking
Click on the "Stock Check" tab to see the submission rules configuration:

#### Option A: Test "Block for Duration"
1. Select "Block for Duration"
2. Enter a duration (e.g., `1` minute for quick testing, or `5` for realistic testing)
3. Click "Save Settings"

#### Option B: Test "Block Until Resolved"
1. Select "Block Until Resolved"
2. Click "Save Settings"

### Step 3: Submit a Stock Check
1. Check at least one machine or verify one item
2. Click "Submit for Review"
3. **Watch the console** - you should see:
   ```
   [StockCheck] Checking if submission is blocked...
   [AppSettings] Checking block status with settings: {...}
   [AppSettings] Mode: block_for_duration (or block_until_resolved)
   [StockCheck] ✓ Submission allowed
   [StockCheck] Submission timestamp recorded successfully
   ```

### Step 4: Try to Submit Again Immediately
1. Quickly check another machine
2. Try to submit again
3. **Expected behavior**:
   - **For "Block for Duration"**: You should see a toast error: "Submission Blocked - Submissions blocked until [time]"
   - **For "Block Until Resolved"**: You should see: "Queue Blocked - Please resolve pending submissions before creating a new one"
4. **Console should show**:
   ```
   [StockCheck] Checking if submission is blocked...
   [AppSettings] Checking block status with settings: {...}
   [AppSettings] Duration check: {isBlocked: true, ...}
   [StockCheck] Submission BLOCKED: Submissions blocked until...
   ```

### Step 5: Verify Unblocking

#### For "Block for Duration":
- Wait for the specified duration to pass
- Try submitting again
- Should succeed with no blocking message

#### For "Block Until Resolved":
- Go to the "Pending" tab
- Approve or discard the pending submission
- Return to the "Check" tab
- Try submitting again
- Should succeed

## Troubleshooting

### If blocking still doesn't work:

1. **Check the console logs** - Look for the `[StockCheck]` and `[AppSettings]` messages
2. **Verify settings are saved** - Refresh the page and check if your settings persist
3. **Check demo mode** - If Firebase is not initialized, settings are stored in memory only
4. **Clear browser cache** - Sometimes old code is cached

### Common Issues:

**"Stock Check tab doesn't appear in Settings"**
- Only users with the `stockCheckSettings` permission can see this tab
- Admins have this permission by default
- Check your user role and permissions in the Team settings

**"Settings card doesn't appear"**
- Settings have been moved to the dedicated Settings page (`/settings`)
- Look for the "Stock Check" tab in the settings page

**"Blocking doesn't work in demo mode"**
- Demo mode uses in-memory storage. Settings will reset on page refresh.
- For persistent blocking, configure Firebase.

**"Console shows 'allow_multiple'"**
- The default mode is "allow_multiple". You need to change it in the settings card.

## Technical Details

### Blocking Flow:
1. User clicks "Submit for Review"
2. `handleSubmit` checks `if (submitting) return;` (race condition guard)
3. Calls `appSettingsService.isSubmissionBlocked()`
4. If `block_for_duration`: Compares current time with `lastSubmissionAt + blockDurationMinutes`
5. If `block_until_resolved`: Checks if any pending submissions exist
6. If blocked: Shows error toast and returns early
7. If allowed: Creates submission, records timestamp, resets form

### Key Files Modified:
- `StockCheckForm.tsx` - Added blocking checks and logging
- `appSettingsService.ts` - Added logging to blocking logic
- `StockCheckSettingsCard.tsx` - New settings UI component

## Next Steps

If you want to make blocking more strict:
1. Set `block_for_duration` to 30-60 minutes for production use
2. Consider using `block_until_resolved` to ensure quality control
3. Monitor the console logs to understand submission patterns
