"use client";

import { PermissionDef } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "lucide-react";

interface PermissionCodePreviewProps {
    permissionId: string;
    permissionName: string;
    targetEntity?: PermissionDef['targetEntity'];
    actionType?: PermissionDef['actionType'];
    targetField?: string;
    customAction?: string;
}

export function PermissionCodePreview({
    permissionId,
    permissionName,
    targetEntity,
    actionType,
    targetField,
    customAction
}: PermissionCodePreviewProps) {
    // Generate contextual code examples based on the permission configuration
    const generateCodeExample = () => {
        const entityName = targetEntity || 'item';
        const action = customAction || actionType || 'perform this action';
        const field = targetField ? ` the ${targetField} field of` : '';

        return `// Permission ID: ${permissionId}
// Controls: ${action} on ${entityName}${field ? ` (${targetField})` : ''}

// 1. Import useAuth hook
import { useAuth } from "@/context/AuthContext";

// 2. In your component
const { hasPermission } = useAuth();

// 3. Check permission before allowing action
if (!hasPermission('${permissionId}')) {
    return (
        <div className="text-muted-foreground">
            You don't have permission to ${action.toLowerCase()}.
        </div>
    );
}

// 4. Conditionally render UI elements
{hasPermission('${permissionId}') && (
    <Button onClick={handle${toPascalCase(permissionId)}}>
        ${permissionName}
    </Button>
)}

// 5. Disable inputs based on permission
<Input
    disabled={!hasPermission('${permissionId}')}
    ${targetField ? `name="${targetField}"` : ''}
    // ... other props
/>`;
    };

    const generateBackendExample = () => {
        return `// Server-side permission check (if needed)
// In your API route or server action:

import { getUserProfile } from "@/lib/auth";

export async function handle${toPascalCase(permissionId)}(userId: string) {
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile?.permissions?.${permissionId}) {
        throw new Error("Insufficient permissions");
    }
    
    // Proceed with the action
    // ...
}`;
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Frontend Usage</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        Copy this code to implement the permission check in your React components
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                        <code className="block">{generateCodeExample()}</code>
                    </pre>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Backend Usage (Optional)</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        Use this pattern for server-side permission validation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
                        <code className="block">{generateBackendExample()}</code>
                    </pre>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function to convert snake_case or kebab-case to PascalCase
function toPascalCase(str: string): string {
    return str
        .split(/[_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
