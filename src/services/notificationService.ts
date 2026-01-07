"use client";

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import { db, isFirebaseInitialized } from "@/lib/firebase";
import { AppNotification } from "@/types";

const COLLECTION_NAME = "notifications";

// Demo data for when Firebase is not initialized
let demoNotifications: AppNotification[] = [];

function getCollection() {
    if (!isFirebaseInitialized || !db) {
        throw new Error("Firebase not initialized");
    }
    return collection(db, COLLECTION_NAME);
}

/**
 * Create a new notification
 */
async function create(
    userId: string,
    type: AppNotification["type"],
    title: string,
    message: string,
    data?: AppNotification["data"]
): Promise<AppNotification> {
    const notification: Omit<AppNotification, "id"> = {
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date(),
    };

    if (!isFirebaseInitialized || !db) {
        const newNotif: AppNotification = {
            id: `demo-notif-${Date.now()}`,
            ...notification,
        };
        demoNotifications.unshift(newNotif);
        return newNotif;
    }

    const docRef = await addDoc(getCollection(), {
        ...notification,
        createdAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...notification,
    };
}

/**
 * Get all notifications for a user
 */
async function getForUser(userId: string): Promise<AppNotification[]> {
    if (!isFirebaseInitialized || !db) {
        return demoNotifications.filter((n) => n.userId === userId);
    }

    const q = query(
        getCollection(),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as AppNotification[];
}

/**
 * Get unread count for a user
 */
async function getUnreadCount(userId: string): Promise<number> {
    if (!isFirebaseInitialized || !db) {
        return demoNotifications.filter((n) => n.userId === userId && !n.read).length;
    }

    const q = query(
        getCollection(),
        where("userId", "==", userId),
        where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
}

/**
 * Mark a single notification as read
 */
async function markAsRead(id: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
        const idx = demoNotifications.findIndex((n) => n.id === id);
        if (idx !== -1) {
            demoNotifications[idx].read = true;
        }
        return;
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { read: true });
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
        demoNotifications = demoNotifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n
        );
        return;
    }

    const q = query(
        getCollection(),
        where("userId", "==", userId),
        where("read", "==", false)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
}

/**
 * Send notification to all users with a specific permission
 * Used to notify all approvers when a new submission comes in
 */
async function notifyApprovers(
    title: string,
    message: string,
    data?: AppNotification["data"]
): Promise<void> {
    // This would need to query users with stockCheckApprove permission
    // For now, we'll handle this in the component by getting approvers list
    console.log("notifyApprovers called:", { title, message, data });
}

export const notificationService = {
    create,
    getForUser,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    notifyApprovers,
};
