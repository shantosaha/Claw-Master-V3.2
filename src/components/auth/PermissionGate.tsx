"use client";

import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface PermissionGateProps {
    permission: string;
    children: ReactNode;
    fallback?: ReactNode;
    mode?: 'hide' | 'disable' | 'show-message';
    fallbackMessage?: string;
}

/**
 * PermissionGate - Conditionally render content based on user permissions
 * 
 * @example
 * // Hide button if user doesn't have permission
 * <PermissionGate permission="edit_machine_name">
 *   <Button>Edit Name</Button>
 * </PermissionGate>
 * 
 * @example
 * // Disable button if user doesn't have permission
 * <PermissionGate permission="edit_machine_name" mode="disable">
 *   <Button>Edit Name</Button>
 * </PermissionGate>
 * 
 * @example
 * // Show custom message if user doesn't have permission
 * <PermissionGate 
 *   permission="edit_machine_name" 
 *   mode="show-message"
 *   fallbackMessage="You need permission to edit machine names"
 * >
 *   <Button>Edit Name</Button>
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    children,
    fallback,
    mode = 'hide',
    fallbackMessage = 'You do not have permission to perform this action.'
}: PermissionGateProps) {
    const { hasPermission } = useAuth();

    const hasAccess = hasPermission(permission);

    // User has permission - render children normally
    if (hasAccess) {
        return <>{children}</>;
    }

    // User doesn't have permission - handle based on mode
    switch (mode) {
        case 'hide':
            // Don't render anything (or render custom fallback)
            return fallback ? <>{fallback}</> : null;

        case 'disable':
            // Render children but disabled
            // Clone children and add disabled prop if it's a valid element
            if (typeof children === 'object' && children !== null && 'type' in children) {
                return (
                    <div className="relative">
                        <div className="pointer-events-none opacity-50">
                            {children}
                        </div>
                    </div>
                );
            }
            return <>{children}</>;

        case 'show-message':
            // Show a message instead
            return (
                <div className="text-sm text-muted-foreground italic">
                    {fallbackMessage}
                </div>
            );

        default:
            return null;
    }
}

/**
 * Hook version for more complex permission logic
 * 
 * @example
 * const canEdit = usePermission('edit_machine_name');
 * 
 * if (!canEdit) {
 *   return <div>No access</div>;
 * }
 */
export function usePermission(permission: string): boolean {
    const { hasPermission } = useAuth();
    return hasPermission(permission);
}
