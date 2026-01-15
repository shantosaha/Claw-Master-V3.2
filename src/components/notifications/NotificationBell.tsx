"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { notificationService } from "@/services";
import { AppNotification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const notifs = await notificationService.getForUser(user.uid);
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n) => !n.read).length);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(loadNotifications, 300000);
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        try {
            await notificationService.markAllAsRead(user.uid);
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getNotificationIcon = (type: AppNotification["type"]) => {
        switch (type) {
            case "stock_check_approved":
                return <Check className="h-4 w-4 text-green-500" />;
            case "stock_check_rejected":
                return <X className="h-4 w-4 text-red-500" />;
            case "stock_check_pending":
                return <Bell className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getNotificationLink = (notif: AppNotification): string | null => {
        if (notif.data?.link) return notif.data.link;
        if (notif.data?.submissionId) return "/stock-check?tab=pending";
        return null;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {loading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.slice(0, 20).map((notif) => {
                                const link = getNotificationLink(notif);
                                const content = (
                                    <div
                                        className={`flex gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${!notif.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                                            }`}
                                        onClick={() => {
                                            if (!notif.read) handleMarkAsRead(notif.id);
                                            if (link) setOpen(false);
                                        }}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {formatDistanceToNow(
                                                    typeof notif.createdAt === "string"
                                                        ? new Date(notif.createdAt)
                                                        : notif.createdAt,
                                                    { addSuffix: true }
                                                )}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                );

                                return link ? (
                                    <Link key={notif.id} href={link}>
                                        {content}
                                    </Link>
                                ) : (
                                    <div key={notif.id}>{content}</div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                asChild
                            >
                                <Link href="/notifications">View all notifications</Link>
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
