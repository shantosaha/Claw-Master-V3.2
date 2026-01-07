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
    writeBatch,
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

    // State for demo mode persistence
    let _localCache: T[] | null = null;

    const saveToStorage = () => {
        if (typeof window !== 'undefined' && _localCache) {
            try {
                localStorage.setItem(`demo_${collectionName}`, JSON.stringify(_localCache));
            } catch (e) {
                console.error("Failed to persist demo data", e);
            }
        }
    };

    const getDemoData = (): T[] => {
        if (_localCache) return _localCache;

        // Try load from local storage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`demo_${collectionName}`);
            if (saved) {
                try {
                    _localCache = JSON.parse(saved);
                    return _localCache!;
                } catch (e) {
                    console.error("Failed to parse demo data", e);
                }
            }
        }

        // Fallback to initial data
        switch (collectionName) {
            case "machines": _localCache = JSON.parse(JSON.stringify(DEMO_MACHINES)); break;
            case "stockItems": _localCache = JSON.parse(JSON.stringify(DEMO_STOCK)); break;
            case "reorderRequests": _localCache = JSON.parse(JSON.stringify(DEMO_ORDERS)); break;
            case "maintenanceTasks": _localCache = JSON.parse(JSON.stringify(DEMO_MAINTENANCE)); break;
            default: _localCache = [];
        }

        // Initial save
        saveToStorage();
        return _localCache!;
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
                const data = getDemoData().find((item) => (item as any).id === id);
                return data || null;
            }
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
        },

        // Add new document (Auto ID)
        add: async (data: Omit<T, "id">): Promise<string> => {
            if (!isFirebaseInitialized) {
                // Determine ID - use input ID if present (migration) or generate
                const inputId = (data as any).id;
                const newId = inputId || "mock-id-" + Date.now() + Math.random().toString(36).substr(2, 5);

                const newItem = {
                    ...data,
                    id: newId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as unknown as T;

                const list = getDemoData();
                list.push(newItem);
                saveToStorage();
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
                const newItem = {
                    ...data,
                    id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as unknown as T;

                if (index >= 0) {
                    list[index] = newItem;
                } else {
                    list.push(newItem);
                }
                saveToStorage();
                return;
            }
            const docRef = doc(db, collectionName, id);
            await setDoc(docRef, {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        },

        // Get documents where field == value
        getByField: async (field: string, value: any): Promise<T[]> => {
            if (!isFirebaseInitialized) {
                // Filter demo/local data
                let data = getDemoData().filter((item) => (item as any)[field] === value);
                // Default sort by createdAt desc
                data.sort((a: any, b: any) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                return data;
            }
            // Real Firestore query
            const q = query(
                getCollectionRef(),
                where(field, "==", value),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as unknown as T));
        },

        // Update document
        update: async (id: string, data: Partial<T>): Promise<void> => {
            if (!isFirebaseInitialized) {
                const list = getDemoData();
                const item = list.find((i) => (i as any).id === id);
                if (item) {
                    Object.assign(item, { ...data, updatedAt: new Date() });
                    saveToStorage();
                }
                return;
            }
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
            });
        },

        // Batch update documents
        updateBatch: async (updates: { id: string; data: Partial<T> }[]): Promise<void> => {
            if (!isFirebaseInitialized) {
                const list = getDemoData();
                let paramsChanged = false;

                updates.forEach(({ id, data }) => {
                    const item = list.find((i) => (i as any).id === id);
                    if (item) {
                        Object.assign(item, { ...data, updatedAt: new Date() });
                        paramsChanged = true;
                    }
                });

                if (paramsChanged) {
                    saveToStorage();
                }
                return;
            }

            const batch = writeBatch(db);
            updates.forEach(({ id, data }) => {
                const docRef = doc(db, collectionName, id);
                batch.update(docRef, {
                    ...data,
                    updatedAt: serverTimestamp(),
                });
            });

            await batch.commit();
        },

        // Delete document
        remove: async (id: string): Promise<void> => {
            if (!isFirebaseInitialized) {
                const list = getDemoData();
                const index = list.findIndex((item) => (item as any).id === id);
                if (index !== -1) {
                    list.splice(index, 1);
                    saveToStorage();
                }
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


