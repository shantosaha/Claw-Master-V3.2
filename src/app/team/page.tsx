"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseInitialized } from "@/lib/firebase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Plus, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

// Demo users for when Firebase is not initialized
const DEMO_USERS: UserProfile[] = [
    {
        uid: "demo-admin",
        email: "admin@clawmaster.demo",
        displayName: "Demo Admin",
        role: "admin",
        photoURL: "",
    },
    {
        uid: "demo-manager",
        email: "manager@clawmaster.demo",
        displayName: "Demo Manager",
        role: "manager",
        photoURL: "",
    },
    {
        uid: "demo-tech",
        email: "tech@clawmaster.demo",
        displayName: "Demo Technician",
        role: "tech",
        photoURL: "",
    },
];

export default function TeamPage() {
    const { userProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Check if Firebase is properly initialized
            if (!isFirebaseInitialized || !db) {
                console.info("Firebase not initialized, using demo users");
                setUsers(DEMO_USERS);
                return;
            }

            const snapshot = await getDocs(collection(db, "users"));
            const data = snapshot.docs.map(doc => doc.data() as UserProfile);
            setUsers(data.length > 0 ? data : DEMO_USERS);
        } catch (error) {
            console.error("Failed to load users:", error);
            // Fallback to demo users on error
            setUsers(DEMO_USERS);
            toast.error("Could not load team data", {
                description: "Showing demo data instead.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMember = () => {
        toast.info("Invite Member", {
            description: "Team invitation feature coming soon. Contact your administrator to add new team members.",
        });
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="h-3 w-3 mr-1" />;
            case 'manager': return <Shield className="h-3 w-3 mr-1" />;
            default: return <User className="h-3 w-3 mr-1" />;
        }
    };

    const getRoleColor = (role: string): "destructive" | "default" | "secondary" | "outline" => {
        switch (role) {
            case 'admin': return "destructive";
            case 'manager': return "default"; // primary
            case 'tech': return "secondary";
            default: return "outline";
        }
    };

    if (loading) return <div>Loading team...</div>;

    return (
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                        <p className="text-muted-foreground">
                            Manage access and roles for your arcade staff.
                        </p>
                    </div>
                    <Button onClick={handleInviteMember}>
                        <Plus className="mr-2 h-4 w-4" /> Invite Member
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No team members found.
                        </div>
                    ) : (
                        users.map((u) => (
                            <Card key={u.uid} className="overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={u.photoURL} alt={u.displayName} />
                                        <AvatarFallback>{u.displayName?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <CardTitle className="text-base">{u.displayName || "Unknown User"}</CardTitle>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {u.email}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-2">
                                        <Badge variant={getRoleColor(u.role)} className="flex items-center px-2 py-0.5">
                                            {getRoleIcon(u.role)}
                                            <span className="capitalize">{u.role}</span>
                                        </Badge>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Active
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

