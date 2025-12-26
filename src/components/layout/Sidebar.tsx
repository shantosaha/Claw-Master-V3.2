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
    LucideIcon,
    ChevronLeft,
    ChevronRight,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    collapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ open, collapsed, onToggle }: SidebarProps) {
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
            "hidden border-r bg-muted/40 md:flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden",
            collapsed ? "w-16" : "w-64",
            open && "fixed inset-y-0 left-0 z-50 md:relative md:z-auto flex"
        )}>

            <div className={cn(
                "flex h-14 items-center border-b px-4 lg:h-[60px] transition-all duration-300 shrink-0",
                collapsed ? "justify-center px-0 font-bold" : "px-6"
            )}>
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Gamepad2 className="h-6 w-6 shrink-0 text-primary" />
                    {!collapsed && <span className="truncate">Claw Master</span>}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                <nav className={cn(
                    "grid items-start px-2 text-sm font-medium transition-all duration-300",
                    collapsed ? "px-1" : "lg:px-4"
                )}>
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.name : ""}
                                className={cn(
                                    "flex items-center rounded-lg px-3 py-2 transition-all hover:text-primary mb-1",
                                    collapsed ? "justify-center gap-0" : "gap-3",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span className="truncate">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar Toggle Button at the bottom */}
            <div className={cn(
                "mt-auto border-t p-2 transition-all duration-300",
                collapsed ? "flex justify-center" : "px-4"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className={cn(
                        "w-full flex items-center transition-all duration-300",
                        collapsed ? "justify-center" : "justify-start gap-3 px-2"
                    )}
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

