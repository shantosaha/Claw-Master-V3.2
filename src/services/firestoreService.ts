import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    DocumentData,
    QueryConstraint,
    serverTimestamp
} from "firebase/firestore";
import { db, isFirebaseInitialized } from "@/lib/firebase";
import { DEMO_MACHINES, DEMO_STOCK, DEMO_ORDERS, DEMO_MAINTENANCE } from "@/lib/demoData";

export const createFirestoreService = <T extends DocumentData>(collectionName: string) => {
    // Helper to get collection ref safely
    const getCollectionRef = () => {
        if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
        return collection(db, collectionName);
    };

    const getDemoData = (): T[] => {
        switch (collectionName) {
            case "machines": return DEMO_MACHINES as unknown as T[];
            case "stockItems": return DEMO_STOCK as unknown as T[];
            case "reorderRequests": return DEMO_ORDERS as unknown as T[];
            case "maintenanceTasks": return DEMO_MAINTENANCE as unknown as T[];
            default: return [];
        }
    };

    return {
        // Get all documents
        getAll: async (): Promise<T[]> => {
            if (!isFirebaseInitialized) return getDemoData();
            const snapshot = await getDocs(getCollectionRef());
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
        },

        // Get document by ID
        getById: async (id: string): Promise<T | null> => {
            if (!isFirebaseInitialized) {
                const data = getDemoData().find((item) => (item as T & { id: string }).id === id);
                return data || null;
            }
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
        },

        // Add new document (Auto ID)
        add: async (data: Omit<T, "id">): Promise<string> => {
            if (!isFirebaseInitialized) {
                console.warn("Firebase not initialized, skipping add");
                return "mock-id-" + Date.now();
            }
            const docRef = await addDoc(getCollectionRef(), {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return docRef.id;
        },

        // Add/Set document with specific ID
        set: async (id: string, data: Omit<T, "id">): Promise<void> => {
            if (!isFirebaseInitialized) return;
            const docRef = doc(db, collectionName, id);
            await setDoc(docRef, {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        },

        // Update document
        update: async (id: string, data: Partial<T>): Promise<void> => {
            if (!isFirebaseInitialized) return;
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
            });
        },

        // Delete document
        remove: async (id: string): Promise<void> => {
            if (!isFirebaseInitialized) return;
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        },

        // Query documents
        query: async (...constraints: QueryConstraint[]): Promise<T[]> => {
            if (!isFirebaseInitialized) return getDemoData(); // Simplified query for demo
            const q = query(getCollectionRef(), ...constraints);
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
        }
    };
};


