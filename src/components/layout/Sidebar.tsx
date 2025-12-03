"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
    History
} from "lucide-react";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Machines", href: "/machines", icon: Gamepad2 },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Stock Check", href: "/stock-check", icon: ClipboardList },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Monitoring", href: "/monitoring", icon: Activity },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Team", href: "/team", icon: Users },
    { name: "Settings History", href: "/settings/history", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r bg-muted/40 md:block w-64 overflow-y-auto">

            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Gamepad2 className="h-6 w-6" />
                    <span className="">Claw Master</span>
                </Link>
            </div>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mt-4">
                {navItems.map((item) => {
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
