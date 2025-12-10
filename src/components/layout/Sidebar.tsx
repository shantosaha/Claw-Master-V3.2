"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import {
    LayoutDashboard,
    Package,
    Gamepad2,
    ShoppingCart,
    Users,
    Settings,
    ClipboardList,
    Wrench,
    BarChart3,
    Activity,
    History,
    LucideIcon
} from "lucide-react";

// Define nav item type with optional role restrictions
interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    roles?: UserProfile['role'][]; // If undefined, accessible to all authenticated users
}

const navItems: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Machines", href: "/machines", icon: Gamepad2 },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Stock Check", href: "/stock-check", icon: ClipboardList },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Monitoring", href: "/monitoring", icon: Activity },
    { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ['admin', 'manager'] },
    { name: "Team", href: "/team", icon: Users, roles: ['admin', 'manager'] },
    { name: "Settings History", href: "/settings/history", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    open?: boolean;
}

export function Sidebar({ open }: SidebarProps) {
    const pathname = usePathname();
    const { userProfile } = useAuth();

    // Filter nav items based on user role
    const filteredNavItems = navItems.filter(item => {
        // If no role restriction, show to everyone
        if (!item.roles) return true;
        // If user has no profile, hide restricted items
        if (!userProfile) return false;
        // Check if user's role is in the allowed roles
        return item.roles.includes(userProfile.role);
    });

    return (
        <div className={cn(
            "hidden border-r bg-muted/40 md:block w-64 overflow-y-auto",
            open && "fixed inset-y-0 left-0 z-50 md:relative md:z-auto block"
        )}>

            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Gamepad2 className="h-6 w-6" />
                    <span className="">Claw Master</span>
                </Link>
            </div>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                isActive
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

