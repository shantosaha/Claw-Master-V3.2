# Custom Permissions - Implementation Guide

## Overview
Custom permissions are now **fully functional** in the Claw Master application. This guide shows you how to create and implement custom permissions.

## How It Works

### 1. Create a Custom Permission
1. Navigate to **Team** page → **Permissions** tab
2. Click **"Add Permission"**
3. Fill in the form:
   - **Name**: Human-readable name (e.g., "Edit Machine Notes")
   - **Description**: What the permission allows
   - **Target Entity**: What it controls (Machine, Inventory, etc.)
   - **Action Type**: The action (Create, Read, Update, Delete, etc.)
   - **Target Field** (optional): Specific field being controlled
4. Review the **Live Code Preview** - it shows exactly how to implement the permission
5. Click **"Create Permission"**

### 2. Implement the Permission

You have **two options** for implementing permissions:

#### Option A: Using `<PermissionGate>` Component (Recommended)

```tsx
import { PermissionGate } from "@/components/auth/PermissionGate";

// Hide element if user doesn't have permission
<PermissionGate permission="edit_machine_notes">
  <Button onClick={handleEdit}>Edit Notes</Button>
</PermissionGate>

// Show disabled version
<PermissionGate permission="edit_machine_notes" mode="disable">
  <Button onClick={handleEdit}>Edit Notes</Button>
</PermissionGate>

// Show custom message
<PermissionGate 
  permission="edit_machine_notes" 
  mode="show-message"
  fallbackMessage="You need permission to edit notes"
>
  <Button onClick={handleEdit}>Edit Notes</Button>
</PermissionGate>

// Custom fallback UI
<PermissionGate 
  permission="edit_machine_notes"
  fallback={<div>Contact admin for access</div>}
>
  <Button onClick={handleEdit}>Edit Notes</Button>
</PermissionGate>
```

#### Option B: Using `usePermission()` Hook

```tsx
import { usePermission } from "@/components/auth/PermissionGate";

function MyComponent() {
  const canEditNotes = usePermission('edit_machine_notes');

  if (!canEditNotes) {
    return <div>No access</div>;
  }

  return <Button onClick={handleEdit}>Edit Notes</Button>;
}
```

#### Option C: Using `hasPermission()` from AuthContext

```tsx
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { hasPermission } = useAuth();

  return (
    <>
      {hasPermission('edit_machine_notes') && (
        <Button onClick={handleEdit}>Edit Notes</Button>
      )}
    </>
  );
}
```

## Real Working Example

The **Machine Settings Panel** (`src/components/machines/SettingsPanel.tsx`) now uses permission gates:

- Users **with** `editMachines` permission can edit settings
- Users **without** permission see a locked state with read-only values

### Test It:
1. Go to any machine detail page
2. Click the **"Settings"** tab
3. If you have `editMachines` permission, you can edit
4. If not, you'll see a lock icon and message

## Assigning Permissions to Users

### Via Roles:
1. Go to **Team** → **Role Settings**
2. Create or edit a role
3. Toggle the permissions you want for that role
4. Assign users to that role

### Via Direct Assignment:
1. Go to **Team** → **Members** tab
2. Click on a user
3. Toggle individual permissions

## Best Practices

1. **Use PermissionGate for UI elements** - It's the cleanest approach
2. **Use hasPermission() for complex logic** - When you need conditional rendering
3. **Always provide feedback** - Show users why they can't access something
4. **Test with different roles** - Verify permissions work as expected
5. **Document custom permissions** - The code preview helps, but add comments too

## Permission Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `hide` | Element not rendered | Buttons, menu items |
| `disable` | Element shown but disabled | Form inputs, actions |
| `show-message` | Shows custom message | Informational areas |
| `fallback` | Custom fallback UI | Complex scenarios |

## Examples of Custom Permissions

Here are some useful custom permissions you might create:

- **Edit Machine Name** - Controls editing machine names
- **Delete Stock Items** - Controls deleting inventory
- **Approve Maintenance** - Controls maintenance approval
- **Export Revenue Data** - Controls revenue exports
- **Configure Payout Rates** - Controls payout settings
- **Manage User Roles** - Controls role management

## Troubleshooting

**Permission not working?**
- Check the permission ID matches exactly (case-sensitive)
- Verify the user has the permission in their role or profile
- Check browser console for errors

**User can't see feature?**
- Verify permission is assigned to their role
- Check if they're using the correct permission ID
- Ensure PermissionGate is wrapping the correct element

## Summary

✅ **Create** custom permissions in the Team page
✅ **Implement** using PermissionGate, usePermission, or hasPermission
✅ **Assign** permissions via roles or direct user assignment
✅ **Test** with different user roles to verify behavior

Permissions are now **truly functional** and will block/allow actions based on user access! 🎉
