import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: any;
let auth: any;
let db: any;
let storage: any;

const mock = new Proxy({}, { get: () => () => { } });

try {
    // Only attempt to initialize if we have a config or are in browser
    if (typeof window !== "undefined" || process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } else {
        // Server-side without keys, use mock
        console.info("Firebase: No server keys found, using mocks.");
        app = mock;
        auth = mock;
        db = mock;
        storage = mock;
    }
} catch (error) {
    console.warn("Firebase initialization failed (using mocks):", error);
    app = mock;
    auth = mock;
    db = mock;
    storage = mock;
}

// Ensure they are never undefined, even if something weird happened above
if (!app) app = mock;
if (!auth) auth = mock;
if (!db) db = mock;
if (!storage) storage = mock;

export { app, auth, db, storage };
export const isFirebaseInitialized = app !== mock;
