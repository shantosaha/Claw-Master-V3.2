"use client";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { db, isFirebaseInitialized } from "@/lib/firebase";
import { PendingStockCheck, SystemSnapshot } from "@/types";

const COLLECTION_NAME = "pendingStockChecks";

// Demo data for when Firebase is not initialized
let demoData: PendingStockCheck[] = [];

function getCollection() {
    if (!isFirebaseInitialized || !db) {
        throw new Error("Firebase not initialized");
    }
    return collection(db, COLLECTION_NAME);
}

/**
 * Create a new pending stock check submission
 */
async function create(
    report: PendingStockCheck["report"],
    snapshotBefore: SystemSnapshot,
    submittedBy: string,
    submittedByName: string
): Promise<PendingStockCheck> {
    if (!isFirebaseInitialized || !db) {
        // Demo mode
        const newItem: PendingStockCheck = {
            id: `demo-pending-${Date.now()}`,
            status: "pending",
            report,
            snapshotBefore,
            submittedBy,
            submittedByName,
            submittedAt: new Date(),
        };
        demoData.push(newItem);
        return newItem;
    }

    const docRef = await addDoc(getCollection(), {
        status: "pending",
        report,
        snapshotBefore,
        submittedBy,
        submittedByName,
        submittedAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        status: "pending",
        report,
        snapshotBefore,
        submittedBy,
        submittedByName,
        submittedAt: new Date(),
    };
}

/**
 * Get all pending stock checks (any status)
 */
async function getAll(): Promise<PendingStockCheck[]> {
    if (!isFirebaseInitialized || !db) {
        return demoData;
    }

    const q = query(getCollection(), orderBy("submittedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as PendingStockCheck[];
}

/**
 * Get only pending submissions (not yet reviewed)
 */
async function getPending(): Promise<PendingStockCheck[]> {
    if (!isFirebaseInitialized || !db) {
        return demoData.filter((d) => d.status === "pending");
    }

    const q = query(
        getCollection(),
        where("status", "==", "pending"),
        orderBy("submittedAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as PendingStockCheck[];
}

/**
 * Get a single pending stock check by ID
 */
async function getById(id: string): Promise<PendingStockCheck | null> {
    if (!isFirebaseInitialized || !db) {
        return demoData.find((d) => d.id === id) || null;
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as PendingStockCheck;
}

/**
 * Approve a pending submission
 * Returns the approved submission (changes should be applied separately)
 */
async function approve(
    id: string,
    reviewerId: string,
    reviewerName: string
): Promise<PendingStockCheck | null> {
    if (!isFirebaseInitialized || !db) {
        const idx = demoData.findIndex((d) => d.id === id);
        if (idx === -1) return null;
        demoData[idx] = {
            ...demoData[idx],
            status: "approved",
            reviewedBy: reviewerId,
            reviewedByName: reviewerName,
            reviewedAt: new Date(),
        };
        return demoData[idx];
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        status: "approved",
        reviewedBy: reviewerId,
        reviewedByName: reviewerName,
        reviewedAt: Timestamp.now(),
    });

    return getById(id);
}

/**
 * Discard (reject) a pending submission
 */
async function discard(
    id: string,
    reviewerId: string,
    reviewerName: string,
    reason?: string
): Promise<PendingStockCheck | null> {
    if (!isFirebaseInitialized || !db) {
        const idx = demoData.findIndex((d) => d.id === id);
        if (idx === -1) return null;
        demoData[idx] = {
            ...demoData[idx],
            status: "discarded",
            reviewedBy: reviewerId,
            reviewedByName: reviewerName,
            reviewedAt: new Date(),
            rejectionReason: reason,
            discardedAt: new Date(),
        };
        return demoData[idx];
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        status: "discarded",
        reviewedBy: reviewerId,
        reviewedByName: reviewerName,
        reviewedAt: Timestamp.now(),
        rejectionReason: reason || null,
        discardedAt: Timestamp.now(),
    });

    return getById(id);
}

/**
 * Restore an approved or discarded submission (within 12 hours of review)
 * For approved: caller should rollback changes first
 * For discarded: just restores to pending
 */
async function restore(id: string): Promise<{ success: boolean; error?: string }> {
    const submission = await getById(id);
    if (!submission) {
        return { success: false, error: "Submission not found" };
    }

    if (submission.status === "pending") {
        return { success: false, error: "Submission is already pending" };
    }

    // Check 12-hour window using reviewedAt
    const reviewedAt = submission.reviewedAt
        ? typeof submission.reviewedAt === "string"
            ? new Date(submission.reviewedAt)
            : submission.reviewedAt
        : null;

    if (!reviewedAt) {
        return { success: false, error: "Review time not recorded" };
    }

    const hoursSinceReview = (Date.now() - reviewedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReview > 12) {
        return { success: false, error: "Restore window expired (12 hours)" };
    }

    if (!isFirebaseInitialized || !db) {
        const idx = demoData.findIndex((d) => d.id === id);
        if (idx !== -1) {
            demoData[idx] = {
                ...demoData[idx],
                status: "pending",
                reviewedBy: undefined,
                reviewedByName: undefined,
                reviewedAt: undefined,
                rejectionReason: undefined,
                discardedAt: undefined,
            };
        }
        return { success: true };
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
        status: "pending",
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        rejectionReason: null,
        discardedAt: null,
    });

    return { success: true };
}

/**
 * Permanently delete a submission (admin only)
 */
async function remove(id: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
        demoData = demoData.filter((d) => d.id !== id);
        return;
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
}

/**
 * Get history (approved and discarded)
 */
async function getHistory(
    filter?: "approved" | "discarded"
): Promise<PendingStockCheck[]> {
    if (!isFirebaseInitialized || !db) {
        if (filter) {
            return demoData.filter((d) => d.status === filter);
        }
        return demoData.filter((d) => d.status !== "pending");
    }

    let q;
    if (filter) {
        q = query(
            getCollection(),
            where("status", "==", filter),
            orderBy("reviewedAt", "desc")
        );
    } else {
        q = query(
            getCollection(),
            where("status", "in", ["approved", "discarded"]),
            orderBy("submittedAt", "desc")
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as PendingStockCheck[];
}

export const pendingStockCheckService = {
    create,
    getAll,
    getPending,
    getById,
    approve,
    discard,
    restore,
    remove,
    getHistory,
};
