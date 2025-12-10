"use client";

import Link from "next/link";
import { ChevronRight, Home, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: LucideIcon;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
    showHome?: boolean;
    separator?: "chevron" | "slash";
}

/**
 * Breadcrumb navigation component for showing page hierarchy
 */
export function Breadcrumb({
    items,
    className,
    showHome = true,
    separator = "chevron"
}: BreadcrumbProps) {
    const allItems: BreadcrumbItem[] = showHome
        ? [{ label: "Home", href: "/", icon: Home }, ...items]
        : items;

    const SeparatorIcon = separator === "chevron"
        ? () => <ChevronRight className="h-4 w-4 text-muted-foreground mx-2 flex-shrink-0" />
        : () => <span className="text-muted-foreground mx-2">/</span>;

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex items-center text-sm", className)}
        >
            <ol className="flex items-center flex-wrap">
                {allItems.map((item, index) => {
                    const isLast = index === allItems.length - 1;
                    const Icon = item.icon;

                    return (
                        <li key={item.label} className="flex items-center">
                            {index > 0 && <SeparatorIcon />}

                            {isLast ? (
                                <span
                                    className="font-medium text-foreground flex items-center"
                                    aria-current="page"
                                >
                                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                                    {item.label}
                                </span>
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                                >
                                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-muted-foreground flex items-center">
                                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

// Helper hook to generate breadcrumb items from pathname
export function useBreadcrumbs(pathname: string, overrides?: Record<string, string>) {
    const segments = pathname.split('/').filter(Boolean);

    const labelMap: Record<string, string> = {
        inventory: "Inventory",
        machines: "Machines",
        orders: "Orders",
        maintenance: "Maintenance",
        analytics: "Analytics",
        settings: "Settings",
        team: "Team",
        monitoring: "Monitoring",
        account: "Account",
        history: "History",
        "stock-check": "Stock Check",
        ...overrides,
    };

    const items: BreadcrumbItem[] = segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/');
        const isId = /^[a-zA-Z0-9]{20,}$/.test(segment); // Firestore IDs are typically 20+ chars

        return {
            label: isId ? "Details" : (labelMap[segment] || segment),
            href: index < segments.length - 1 ? href : undefined,
        };
    });

    return items;
}

export default Breadcrumb;
