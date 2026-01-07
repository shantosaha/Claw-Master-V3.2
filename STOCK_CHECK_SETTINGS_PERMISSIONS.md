# Stock Check Settings - Permission-Based Access

## Summary of Changes

The Stock Check submission settings have been moved to a dedicated location with proper permission controls.

## What Changed

### 1. **New Location: Settings Page**
- Stock Check settings are now in `/settings` under a dedicated "Stock Check" tab
- Removed the settings card from the Stock Check page itself
- Cleaner separation of concerns: Stock Check page for operations, Settings page for configuration

### 2. **Permission-Based Access**
- Only users with the `stockCheckSettings` permission can see and modify these settings
- The "Stock Check" tab in Settings is hidden for users without this permission
- Admins have this permission by default

### 3. **New Components Created**
- `StockCheckSettingsForm.tsx` - Reusable form component for the settings
- Integrated into the existing Settings page architecture

## Permission System

### Who Can Access Stock Check Settings?

The `stockCheckSettings` permission controls access to the Stock Check configuration. This permission is defined in the user's profile:

```typescript
permissions: {
    stockCheckSettings?: boolean;  // Can configure queue settings
}
```

### Default Permissions by Role:
- **Admin**: ✅ Has `stockCheckSettings` permission
- **Manager**: Check role configuration
- **Supervisor**: Check role configuration
- **Tech/Crew**: ❌ No access by default

### How to Grant Permission:
1. Navigate to `/team` (Team Management)
2. Find the user or role you want to modify
3. Enable the "Configure Stock Check Settings" permission
4. Save changes

## User Experience

### For Admins/Authorized Users:
1. Navigate to Settings (`/settings`)
2. Click on the "Stock Check" tab
3. Configure submission rules:
   - **Allow Multiple Submissions** - No restrictions
   - **Block Until Resolved** - One pending submission at a time
   - **Block for Duration** - Time-based blocking (1-1440 minutes)
4. Changes are saved and apply immediately to all users

### For Regular Users:
- The "Stock Check" tab won't appear in Settings
- They can still submit stock checks (if they have `stockCheckSubmit` permission)
- They are subject to the blocking rules configured by admins

## Files Modified

### Created:
- `/src/components/stock-check/StockCheckSettingsForm.tsx` - Settings form component

### Modified:
- `/src/app/settings/page.tsx` - Added Stock Check tab with permission check
- `/src/components/stock-check/StockCheckForm.tsx` - Removed embedded settings card
- `/STOCK_CHECK_BLOCKING_TEST_GUIDE.md` - Updated with new location

### Removed:
- `/src/components/stock-check/StockCheckSettingsCard.tsx` - Replaced by form component

## Technical Implementation

### Permission Check in Settings Page:
```tsx
const { canConfigureStockCheckSettings } = useAuth();

// Tab trigger
{canConfigureStockCheckSettings() && (
    <TabsTrigger value="stock-check">Stock Check</TabsTrigger>
)}

// Tab content
{canConfigureStockCheckSettings() && (
    <TabsContent value="stock-check">
        <StockCheckSettingsForm />
    </TabsContent>
)}
```

### Permission Check in AuthContext:
```tsx
const canConfigureStockCheckSettings = (): boolean => {
    return hasPermission('stockCheckSettings');
};
```

## Testing

1. **As Admin**:
   - Go to `/settings`
   - You should see "Stock Check" tab
   - Configure settings and save
   - Test blocking on Stock Check page

2. **As Regular User**:
   - Go to `/settings`
   - "Stock Check" tab should NOT appear
   - You can still use Stock Check page normally
   - Blocking rules apply based on admin configuration

3. **Permission Testing**:
   - Create a custom role with `stockCheckSettings` permission
   - Assign to a user
   - Verify they can see and modify settings

## Benefits

✅ **Better Organization**: Settings are in a dedicated, expected location
✅ **Permission Control**: Only authorized users can modify critical settings
✅ **Cleaner UI**: Stock Check page focuses on operations, not configuration
✅ **Scalable**: Easy to add more stock check settings in the future
✅ **Consistent**: Follows the same pattern as other app settings

## Next Steps

If you want to customize who can access these settings:
1. Go to `/team` or `/settings` (depending on your role management UI)
2. Edit roles or individual user permissions
3. Toggle the "Configure Stock Check Settings" permission
4. Users will immediately see/lose access to the Stock Check tab
