"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db, isFirebaseInitialized } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile, Role, CustomRole, PermissionDef } from "@/types";
import { roleService, permissionService } from "@/services";

type PermissionKey = keyof NonNullable<UserProfile['permissions']>;

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    roles: CustomRole[];
    permissions: PermissionDef[];
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (role: Role[]) => boolean;
    hasPermission: (permission: PermissionKey | string) => boolean;
    canApproveStockCheck: () => boolean;
    canSubmitStockCheck: () => boolean;
    canConfigureStockCheckSettings: () => boolean;
    canEditRoles: () => boolean;
    canAccessMigration: () => boolean;
    getRoleById: (id: string) => CustomRole | undefined;
    refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    roles: [],
    permissions: [],
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    hasRole: () => false,
    hasPermission: () => false,
    canApproveStockCheck: () => false,
    canSubmitStockCheck: () => false,
    canConfigureStockCheckSettings: () => false,
    canEditRoles: () => false,
    canAccessMigration: () => false,
    getRoleById: () => undefined,
    refreshData: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [roles, setRoles] = useState<CustomRole[]>([]);
    const [permissions, setPermissions] = useState<PermissionDef[]>([]);
    const [loading, setLoading] = useState(true);

    // Load roles and permissions on mount
    const loadData = useCallback(async () => {
        try {
            const [loadedRoles, loadedPerms] = await Promise.all([
                roleService.getAll(),
                permissionService.getAll()
            ]);
            setRoles(loadedRoles);
            setPermissions(loadedPerms);
        } catch (error) {
            console.error("Failed to load auth data:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!isFirebaseInitialized) {
            console.warn("Firebase not initialized. Using Mock Auth.");

            // Revert to single mock admin
            const mockUser = {
                uid: "mock-admin",
                email: "admin@clawmaster.demo",
                displayName: "Demo Admin",
                photoURL: "https://github.com/shadcn.png"
            };
            const mockProfile: UserProfile = {
                uid: "mock-admin",
                email: "admin@clawmaster.demo",
                displayName: "Demo Admin",
                photoURL: "https://github.com/shadcn.png",
                role: "admin",
                permissions: {
                    stockCheckSubmit: true,
                    stockCheckApprove: true,
                    stockCheckSettings: true,
                    viewInventory: true,
                    editInventory: true,
                    viewMachines: true,
                    editMachines: true,
                    viewMaintenance: true,
                    editMaintenance: true,
                    viewRevenue: true,
                    viewTeam: true,
                    editTeam: true,
                    editRoles: true,
                    viewAnalytics: true,
                    accessMigration: true,
                },
            };

            setUser(mockUser as User);
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
                            permissions: {
                                stockCheckSubmit: true, // Default: can submit
                                stockCheckApprove: false,
                                stockCheckSettings: false,
                            },
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


    const signInWithGoogle = useCallback(async () => {
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
    }, []);

    const logout = useCallback(async () => {
        if (!isFirebaseInitialized) {
            alert("Demo Mode: Logout disabled.");
            return;
        }
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    }, []);


    const hasRole = useCallback((allowedRoles: Role[]) => {
        if (!userProfile) return false;
        return allowedRoles.includes(userProfile.role);
    }, [userProfile]);

    // Permission helpers
    const hasPermission = useCallback((permission: PermissionKey | string): boolean => {
        if (!userProfile) return false;
        // Admins always have all permissions
        if (userProfile.role === 'admin') return true;

        // 1. Check direct user permissions
        const userPermissions = userProfile.permissions as Record<string, boolean> | undefined;
        if (userPermissions?.[permission]) return true;

        // 2. Check role-based permissions
        const userRole = roles.find(r => r.id === userProfile.role);
        if (userRole?.permissions?.[permission]) return true;

        return false;
    }, [userProfile, roles]);

    const canSubmitStockCheck = useCallback((): boolean => {
        return hasPermission('stockCheckSubmit');
    }, [hasPermission]);

    const canApproveStockCheck = useCallback((): boolean => {
        return hasPermission('stockCheckApprove');
    }, [hasPermission]);

    const canConfigureStockCheckSettings = useCallback((): boolean => {
        return hasPermission('stockCheckSettings');
    }, [hasPermission]);

    const canEditRoles = useCallback((): boolean => {
        return hasPermission('editRoles');
    }, [hasPermission]);

    const canAccessMigration = useCallback((): boolean => {
        return hasPermission('accessMigration');
    }, [hasPermission]);

    const getRoleById = useCallback((id: string): CustomRole | undefined => {
        return roles.find(r => r.id === id);
    }, [roles]);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        user,
        userProfile,
        roles,
        permissions,
        loading,
        signInWithGoogle,
        logout,
        hasRole,
        hasPermission,
        canApproveStockCheck,
        canSubmitStockCheck,
        canConfigureStockCheckSettings,
        canEditRoles,
        canAccessMigration,
        getRoleById,
        refreshData: loadData,
    }), [
        user,
        userProfile,
        roles,
        permissions,
        loading,
        signInWithGoogle,
        logout,
        hasRole,
        hasPermission,
        canApproveStockCheck,
        canSubmitStockCheck,
        canConfigureStockCheckSettings,
        canEditRoles,
        canAccessMigration,
        getRoleById,
        loadData
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
