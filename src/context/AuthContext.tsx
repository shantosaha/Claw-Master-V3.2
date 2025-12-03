"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db, isFirebaseInitialized } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, Role } from "@/types";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (role: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    hasRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isFirebaseInitialized) {
            console.warn("Firebase not initialized. Using Mock Auth.");
            // Mock User for Demo
            const mockUser: any = {
                uid: "mock-user-123",
                email: "demo@clawmaster.app",
                displayName: "Demo Admin",
                photoURL: "https://github.com/shadcn.png",
            };
            const mockProfile: UserProfile = {
                uid: "mock-user-123",
                email: "demo@clawmaster.app",
                role: "admin",
                displayName: "Demo Admin",
                photoURL: "https://github.com/shadcn.png",
            };
            setUser(mockUser);
            setUserProfile(mockProfile);
            setLoading(false);
            return;
        }

        if (isFirebaseInitialized) {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                setUser(firebaseUser);

                if (firebaseUser) {
                    // Fetch user profile from Firestore
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setUserProfile(userDoc.data() as UserProfile);
                    } else {
                        // Create new user profile if not exists
                        const newProfile: UserProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            role: "crew", // Default role
                            displayName: firebaseUser.displayName || "",
                            photoURL: firebaseUser.photoURL || "",
                        };
                        await setDoc(userDocRef, newProfile);
                        setUserProfile(newProfile);
                    }
                } else {
                    setUserProfile(null);
                }

                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, []);


    const signInWithGoogle = async () => {
        if (!isFirebaseInitialized) {
            alert("Demo Mode: You are already logged in as Admin.");
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        if (!isFirebaseInitialized) {
            alert("Demo Mode: Logout disabled.");
            return;
        }
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };


    const hasRole = (allowedRoles: Role[]) => {
        if (!userProfile) return false;
        return allowedRoles.includes(userProfile.role);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};
