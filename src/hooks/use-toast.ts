// Simplified mock of use-toast
import * as React from "react"

export function useToast() {
    return {
        toast: ({ title, description, variant }: { title: string; description: string; variant?: "default" | "destructive" }) => {
            console.log(`Toast: ${title} - ${description} (${variant})`);
            // In a real app, this would dispatch to a toast context
        },
    }
}
