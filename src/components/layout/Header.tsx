"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, CircleUser } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./Sidebar"; // Reuse sidebar content for mobile
import { useAuth } from "@/context/AuthContext";
import { ModeToggle } from "@/components/mode-toggle";

import { isFirebaseInitialized } from "@/lib/firebase";
import Link from "next/link";

export function Header() {

    const { user, logout, signInWithGoogle } = useAuth();

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 z-10 bg-background">
            {!isFirebaseInitialized && (
                <div className="hidden md:flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium border border-amber-200 mr-auto">
                    <span>Demo Mode</span>
                    <div className="h-3 w-[1px] bg-amber-300 mx-1" />
                    <Link href="https://console.firebase.google.com" target="_blank" className="underline hover:text-amber-900">
                        Connect Database
                    </Link>
                </div>
            )}


            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0 w-64">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    {/* We can reuse the Sidebar content here or create a MobileNav component */}
                    <Sidebar className="block w-full h-full border-none" />
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                <form suppressHydrationWarning>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                            suppressHydrationWarning
                        />
                    </div>
                </form>
            </div>
            <ModeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <CircleUser className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/account" className="cursor-pointer w-full">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user ? (
                        <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={signInWithGoogle}>Login</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
