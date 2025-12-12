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

    // persistent storage for non-hardcoded collections (like settings, audit logs)
    const localStore: T[] = [];

    const getDemoData = (): T[] => {
        switch (collectionName) {
            case "machines": return DEMO_MACHINES as unknown as T[];
            case "stockItems": return DEMO_STOCK as unknown as T[];
            case "reorderRequests": return DEMO_ORDERS as unknown as T[];
            case "maintenanceTasks": return DEMO_MAINTENANCE as unknown as T[];
            default: return localStore;
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
                console.warn("Firebase not initialized, adding to demo data in-memory");
                const newId = "mock-id-" + Date.now();
                const newItem = { ...data, id: newId, createdAt: new Date(), updatedAt: new Date() } as unknown as T;
                const list = getDemoData();
                list.push(newItem);
                return newId;
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
            if (!isFirebaseInitialized) {
                const list = getDemoData();
                const index = list.findIndex((item) => (item as any).id === id);
                const newItem = { ...data, id, createdAt: new Date(), updatedAt: new Date() } as unknown as T;
                if (index >= 0) {
                    list[index] = newItem;
                } else {
                    list.push(newItem);
                }
                return;
            }
            const docRef = doc(db, collectionName, id);
            await setDoc(docRef, {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        },

        // Update document
        update: async (id: string, data: Partial<T>): Promise<void> => {
            if (!isFirebaseInitialized) {
                const list = getDemoData();
                const item = list.find((i) => (i as any).id === id);
                if (item) {
                    Object.assign(item, { ...data, updatedAt: new Date() });
                }
                return;
            }
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
            });
        },

        // Delete document
        remove: async (id: string): Promise<void> => {
            if (!isFirebaseInitialized) {
                const list = getDemoData();
                const index = list.findIndex((item) => (item as any).id === id);
                if (index !== -1) list.splice(index, 1);
                return;
            }
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        },

        // Query documents
        query: async (...constraints: QueryConstraint[]): Promise<T[]> => {
            if (!isFirebaseInitialized) {
                // Return reversed list to simulate orderBy('timestamp', 'desc') which is common
                // This ensures 'latest' is first
                return [...getDemoData()].reverse();
            }
            const q = query(getCollectionRef(), ...constraints);
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
        }
    };
};


