"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, CustomRole, PermissionDef } from "@/types";
import { PermissionCodePreview } from "@/components/team/PermissionCodePreview";
import { roleService, permissionService } from "@/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, isFirebaseInitialized } from "@/lib/firebase";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
    Plus, Mail, Shield, User, Settings, ClipboardCheck,
    Eye, Package, Wrench, BarChart3, Users, AlertCircle, Info,
    Trash2, Edit, Hand, UserCog, Key
} from "lucide-react";
import { toast } from "sonner";

// Icon mapping for roles
const ROLE_ICONS: Record<string, React.ReactNode> = {
    Shield: <Shield className="h-4 w-4" />,
    Users: <Users className="h-4 w-4" />,
    Wrench: <Wrench className="h-4 w-4" />,
    User: <User className="h-4 w-4" />,
    Hand: <Hand className="h-4 w-4" />,
    UserCog: <UserCog className="h-4 w-4" />,
};

// Demo users
const DEMO_USERS: UserProfile[] = [
    {
        uid: "demo-admin",
        email: "admin@clawmaster.demo",
        displayName: "Demo Admin",
        role: "admin",
        photoURL: "",
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
        },
    },
    {
        uid: "demo-manager",
        email: "manager@clawmaster.demo",
        displayName: "Demo Supervisor",
        role: "supervisor",
        photoURL: "",
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: true,
            stockCheckSettings: false,
            viewInventory: true,
            editInventory: true,
            viewMachines: true,
            editMachines: true,
            viewMaintenance: true,
            editMaintenance: true,
            viewRevenue: true,
            viewTeam: true,
            editTeam: false,
            editRoles: false,
            viewAnalytics: true,
        },
    },
    {
        uid: "demo-tech",
        email: "tech@clawmaster.demo",
        displayName: "Demo Technician",
        role: "tech",
        photoURL: "",
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: false,
            stockCheckSettings: false,
            viewInventory: true,
            editInventory: false,
            viewMachines: true,
            editMachines: true,
            viewMaintenance: true,
            editMaintenance: true,
            viewRevenue: false,
            viewTeam: false,
            editTeam: false,
            editRoles: false,
            viewAnalytics: false,
        },
    },
];

let demoUsersData = [...DEMO_USERS];

export default function TeamPage() {
    const { userProfile, roles, permissions, canEditRoles, refreshData, getRoleById } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("members");

    // User editing state
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editRole, setEditRole] = useState<string>("crew");
    const [editPermissions, setEditPermissions] = useState<UserProfile["permissions"]>({});
    const [savingUser, setSavingUser] = useState(false);

    // Role editing state
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [roleForm, setRoleForm] = useState({
        name: "",
        description: "",
        icon: "User",
        permissions: {} as UserProfile["permissions"],
    });
    const [roleNameError, setRoleNameError] = useState<string | null>(null);
    const [savingRole, setSavingRole] = useState(false);
    const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);

    // Permission editing state
    const [isCreatingPerm, setIsCreatingPerm] = useState(false);
    const [permForm, setPermForm] = useState<{
        name: string;
        description: string;
        targetEntity?: PermissionDef['targetEntity'];
        actionType?: PermissionDef['actionType'];
        targetField?: string;
        customAction?: string;
    }>({
        name: "",
        description: "",
        targetEntity: undefined,
        actionType: undefined,
        targetField: "",
        customAction: "",
    });
    const [permNameError, setPermNameError] = useState<string | null>(null);
    const [savingPerm, setSavingPerm] = useState(false);
    const [deletingPerm, setDeletingPerm] = useState<PermissionDef | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            if (!isFirebaseInitialized || !db) {
                setUsers(demoUsersData);
                return;
            }

            const snapshot = await getDocs(collection(db, "users"));
            const data = snapshot.docs.map(doc => doc.data() as UserProfile);
            setUsers(data.length > 0 ? data : demoUsersData);
        } catch (error) {
            console.error("Failed to load users:", error);
            setUsers(demoUsersData);
            toast.error("Could not load team data");
        } finally {
            setLoading(false);
        }
    };

    const handleInviteMember = () => {
        toast.info("Invite Member", {
            description: "Team invitation feature coming soon.",
        });
    };

    // ============= USER EDITING =============
    const openEditUserDialog = (user: UserProfile) => {
        setEditingUser(user);
        setEditRole(user.role);
        const role = getRoleById(user.role);
        setEditPermissions(user.permissions || role?.permissions || {});
    };

    const handleRoleChange = (newRole: string) => {
        setEditRole(newRole);
        const role = getRoleById(newRole);
        if (role) {
            setEditPermissions(role.permissions);
        }
    };

    const toggleUserPermission = (key: string) => {
        setEditPermissions(prev => ({
            ...prev,
            [key as keyof typeof prev]: !prev?.[key as keyof typeof prev]
        }));
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        setSavingUser(true);
        try {
            if (!isFirebaseInitialized || !db) {
                demoUsersData = demoUsersData.map(u =>
                    u.uid === editingUser.uid
                        ? { ...u, role: editRole, permissions: editPermissions }
                        : u
                );
                setUsers(demoUsersData);
            } else {
                const userRef = doc(db, "users", editingUser.uid);
                await updateDoc(userRef, { role: editRole, permissions: editPermissions });
                await loadUsers();
            }

            toast.success("User updated", {
                description: `${editingUser.displayName}'s role and permissions saved.`,
            });
            setEditingUser(null);
        } catch (error) {
            console.error("Failed to update user:", error);
            toast.error("Failed to update user");
        } finally {
            setSavingUser(false);
        }
    };

    // ============= ROLE EDITING =============
    const openCreateRoleDialog = () => {
        setIsCreatingRole(true);
        setEditingRole(null);
        setRoleForm({
            name: "",
            description: "",
            icon: "User",
            permissions: {},
        });
        setRoleNameError(null);
    };

    const openEditRoleDialog = (role: CustomRole) => {
        setEditingRole(role);
        setIsCreatingRole(false);
        setRoleForm({
            name: role.name,
            description: role.description,
            icon: role.icon || "User",
            permissions: role.permissions,
        });
        setRoleNameError(null);
    };

    const handleRoleNameChange = async (name: string) => {
        setRoleForm(prev => ({ ...prev, name }));

        if (name.trim().length < 2) {
            setRoleNameError(null);
            return;
        }

        const result = await roleService.checkDuplicate(name, editingRole?.id);
        if (result.isDuplicate) {
            setRoleNameError(`A role named "${result.similar?.name}" already exists or is too similar.`);
        } else {
            setRoleNameError(null);
        }
    };

    const toggleRolePermission = (key: string) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [key as keyof typeof prev.permissions]: !prev.permissions?.[key as keyof typeof prev.permissions]
            }
        }));
    };

    const handleSaveRole = async () => {
        if (!roleForm.name.trim()) {
            toast.error("Role name is required");
            return;
        }

        const dupCheck = await roleService.checkDuplicate(roleForm.name, editingRole?.id);
        if (dupCheck.isDuplicate) {
            toast.error(`A role named "${dupCheck.similar?.name}" already exists or is too similar.`);
            return;
        }

        setSavingRole(true);
        try {
            if (editingRole) {
                // Update existing
                await roleService.update(editingRole.id, {
                    name: roleForm.name,
                    description: roleForm.description,
                    icon: roleForm.icon,
                    permissions: roleForm.permissions,
                });
                toast.success("Role updated");
            } else {
                // Create new
                await roleService.create({
                    name: roleForm.name,
                    description: roleForm.description,
                    icon: roleForm.icon,
                    color: "secondary",
                    permissions: roleForm.permissions,
                    sortOrder: 40, // Below system roles
                });
                toast.success("Role created");
            }

            await refreshData();
            setEditingRole(null);
            setIsCreatingRole(false);
        } catch (error) {
            console.error("Failed to save role:", error);
            toast.error("Failed to save role");
        } finally {
            setSavingRole(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!deletingRole) return;

        const result = await roleService.remove(deletingRole.id);
        if (result.success) {
            toast.success("Role deleted");
            await refreshData();
        } else {
            toast.error(result.error || "Failed to delete role");
        }
        setDeletingRole(null);
    };

    // ============= PERMISSION EDITING =============
    const openCreatePermDialog = () => {
        setIsCreatingPerm(true);
        setPermForm({
            name: "",
            description: "",
            targetEntity: undefined,
            actionType: undefined,
            targetField: "",
            customAction: "",
        });
        setPermNameError(null);
    };

    const handlePermNameChange = async (name: string) => {
        setPermForm(prev => ({ ...prev, name }));

        if (name.trim().length < 2) {
            setPermNameError(null);
            return;
        }

        const result = await permissionService.checkDuplicate(name);
        if (result.isDuplicate) {
            setPermNameError(`A permission named "${result.similar?.name}" already exists or is too similar.`);
        } else {
            setPermNameError(null);
        }
    };

    const handleSavePerm = async () => {
        if (!permForm.name.trim()) {
            toast.error("Permission name is required");
            return;
        }

        const dupCheck = await permissionService.checkDuplicate(permForm.name);
        if (dupCheck.isDuplicate) {
            toast.error(`A permission named "${dupCheck.similar?.name}" already exists or is too similar.`);
            return;
        }

        setSavingPerm(true);
        try {
            await permissionService.create({
                name: permForm.name,
                description: permForm.description,
                targetEntity: permForm.targetEntity,
                actionType: permForm.actionType,
                targetField: permForm.targetField || undefined,
                customAction: permForm.customAction || undefined,
                isSystem: false,
            });
            toast.success("Permission created");
            await refreshData();
            setIsCreatingPerm(false);
        } catch (error) {
            console.error("Failed to save permission:", error);
            toast.error("Failed to save permission");
        } finally {
            setSavingPerm(false);
        }
    };

    const handleDeletePerm = async () => {
        if (!deletingPerm) return;

        const result = await permissionService.remove(deletingPerm.id);
        if (result.success) {
            toast.success("Permission deleted");
            await refreshData();
        } else {
            toast.error(result.error || "Failed to delete permission");
        }
        setDeletingPerm(null);
    };

    // ============= HELPERS =============
    const getRoleIcon = (iconName?: string) => {
        return ROLE_ICONS[iconName || "User"] || <User className="h-4 w-4" />;
    };

    const getRoleColor = (role: CustomRole | undefined): "destructive" | "default" | "secondary" | "outline" => {
        return role?.color || "outline";
    };

    const getPermissionCount = (user: UserProfile): number => {
        if (!user.permissions) return 0;
        return Object.values(user.permissions).filter(Boolean).length;
    };

    const canEditUser = (targetUser: UserProfile): boolean => {
        if (!userProfile) return false;
        if (userProfile.role === "admin") return true;
        if ((userProfile.role === "manager" || userProfile.role === "supervisor") && targetUser.role !== "admin") return true;
        return false;
    };

    if (loading) return <div className="p-8">Loading team...</div>;

    const showRoleSettings = canEditRoles() || userProfile?.role === "admin";

    return (
        <ProtectedRoute allowedRoles={['admin', 'manager', 'supervisor']}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                        <p className="text-muted-foreground">
                            Manage access, roles, and permissions for your arcade staff.
                        </p>
                    </div>
                    {activeTab === "members" && (
                        <Button onClick={handleInviteMember}>
                            <Plus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                    )}
                    {activeTab === "roles" && showRoleSettings && (
                        <Button onClick={openCreateRoleDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Add Role
                        </Button>
                    )}
                    {activeTab === "permissions" && showRoleSettings && (
                        <Button onClick={openCreatePermDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Add Permission
                        </Button>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="members" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Team Members
                        </TabsTrigger>
                        {showRoleSettings && (
                            <>
                                <TabsTrigger value="roles" className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" /> Roles
                                </TabsTrigger>
                                <TabsTrigger value="permissions" className="flex items-center gap-2">
                                    <Key className="h-4 w-4" /> Permissions
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    {/* TEAM MEMBERS TAB */}
                    <TabsContent value="members" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No team members found.
                                </div>
                            ) : (
                                users.map((u) => {
                                    const role = getRoleById(u.role);
                                    return (
                                        <Card
                                            key={u.uid}
                                            className={`overflow-hidden transition-shadow ${canEditUser(u) ? "cursor-pointer hover:shadow-md" : ""}`}
                                            onClick={() => canEditUser(u) && openEditUserDialog(u)}
                                        >
                                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={u.photoURL} alt={u.displayName} />
                                                    <AvatarFallback>{u.displayName?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col flex-1">
                                                    <CardTitle className="text-base">{u.displayName || "Unknown User"}</CardTitle>
                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {u.email}
                                                    </div>
                                                </div>
                                                {canEditUser(u) && <Settings className="h-4 w-4 text-muted-foreground" />}
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between mt-2">
                                                    <Badge variant={getRoleColor(role)} className="flex items-center px-2 py-0.5">
                                                        {getRoleIcon(role?.icon)}
                                                        <span className="ml-1">{role?.name || u.role}</span>
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        {getPermissionCount(u) > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {getPermissionCount(u)} permissions
                                                            </Badge>
                                                        )}
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>

                    {/* ROLES TAB */}
                    <TabsContent value="roles" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role) => (
                                <Card
                                    key={role.id}
                                    className={`overflow-hidden transition-shadow cursor-pointer hover:shadow-md ${role.isSystem ? "border-l-4 border-l-blue-500" : ""}`}
                                    onClick={() => openEditRoleDialog(role)}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-lg">
                                                    {getRoleIcon(role.icon)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        {role.name}
                                                        {role.isSystem && (
                                                            <Badge variant="outline" className="text-[10px] px-1">
                                                                System
                                                            </Badge>
                                                        )}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs">
                                                        {role.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Edit className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Badge variant="outline" className="text-xs">
                                            {Object.values(role.permissions || {}).filter(Boolean).length} permissions enabled
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* PERMISSIONS TAB */}
                    <TabsContent value="permissions" className="mt-6">
                        <div className="grid grid-cols-1 gap-4">
                            {permissions.map((perm) => (
                                <Card key={perm.id} className="overflow-hidden">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="p-2 bg-muted rounded-full">
                                                <Key className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-sm">{perm.name}</h3>
                                                    {perm.isSystem && (
                                                        <Badge variant="secondary" className="text-[10px] px-1 h-5">System</Badge>
                                                    )}
                                                    {perm.targetEntity && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 h-5">
                                                            {perm.targetEntity}
                                                        </Badge>
                                                    )}
                                                    {perm.actionType && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-blue-50 dark:bg-blue-950">
                                                            {perm.actionType}
                                                        </Badge>
                                                    )}
                                                    {perm.targetField && (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-purple-50 dark:bg-purple-950">
                                                            field: {perm.targetField}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{perm.description}</p>
                                                <code className="text-[10px] text-muted-foreground mt-1 block">ID: {perm.id}</code>
                                            </div>
                                        </div>
                                        {!perm.isSystem && (
                                            <Button variant="ghost" size="icon" onClick={() => setDeletingPerm(perm)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                </Tabs>

                {/* USER EDIT DIALOG */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={editingUser?.photoURL} />
                                    <AvatarFallback>{editingUser?.displayName?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div>{editingUser?.displayName}</div>
                                    <div className="text-sm font-normal text-muted-foreground">{editingUser?.email}</div>
                                </div>
                            </DialogTitle>
                            <DialogDescription>
                                Manage role and permissions for this team member.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={editRole} onValueChange={handleRoleChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                <div className="flex items-center gap-2">
                                                    {getRoleIcon(role.icon)}
                                                    <span>{role.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                {permissions.map(perm => (
                                    <PermissionRow
                                        key={perm.id}
                                        label={perm.name}
                                        checked={editPermissions?.[perm.id as keyof typeof editPermissions] as boolean}
                                        onToggle={() => toggleUserPermission(perm.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingUser(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveUser} disabled={savingUser}>
                                {savingUser ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ROLE EDIT/CREATE DIALOG */}
                <Dialog open={!!editingRole || isCreatingRole} onOpenChange={(open) => {
                    if (!open) {
                        setEditingRole(null);
                        setIsCreatingRole(false);
                    }
                }}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? `Edit Role: ${editingRole.name}` : "Create New Role"}
                            </DialogTitle>
                            <DialogDescription>
                                Configure role details and permissions.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input
                                    value={roleForm.name}
                                    onChange={(e) => handleRoleNameChange(e.target.value)}
                                    placeholder="e.g., Shift Leader"
                                    disabled={editingRole?.isSystem}
                                />
                                {roleNameError && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">{roleNameError}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this role's responsibilities"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <Select value={roleForm.icon} onValueChange={(v) => setRoleForm(prev => ({ ...prev, icon: v }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ROLE_ICONS).map(([key, icon]) => (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    {icon}
                                                    <span>{key}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-base font-semibold mb-4 block">Default Permissions</Label>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {permissions.map(perm => (
                                        <PermissionRow
                                            key={perm.id}
                                            label={perm.name}
                                            checked={roleForm.permissions?.[perm.id as keyof typeof roleForm.permissions] as boolean}
                                            onToggle={() => toggleRolePermission(perm.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between">
                            <div>
                                {editingRole && !editingRole.isSystem && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setDeletingRole(editingRole)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => {
                                    setEditingRole(null);
                                    setIsCreatingRole(false);
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveRole} disabled={savingRole || !!roleNameError}>
                                    {savingRole ? "Saving..." : editingRole ? "Save Changes" : "Create Role"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* CREATE PERMISSION DIALOG */}
                <Dialog open={isCreatingPerm} onOpenChange={setIsCreatingPerm}>
                    <DialogContent className="w-[95vw] max-w-none sm:max-w-[1600px] max-h-[95vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Custom Permission</DialogTitle>
                            <DialogDescription>
                                Define a new permission with technical configuration. The code preview shows exactly how to implement this permission in your application.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                            {/* LEFT: Configuration Form */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Permission Name *</Label>
                                    <Input
                                        value={permForm.name}
                                        onChange={(e) => handlePermNameChange(e.target.value)}
                                        placeholder="e.g., Edit Machine Name"
                                    />
                                    {permNameError && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">{permNameError}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <Textarea
                                        value={permForm.description}
                                        onChange={(e) => setPermForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="What does this permission allow?"
                                        rows={2}
                                    />
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Target Entity</Label>
                                        <Select
                                            value={permForm.targetEntity || ""}
                                            onValueChange={(v) => setPermForm(prev => ({ ...prev, targetEntity: v as PermissionDef['targetEntity'] }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select entity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="machine">Machine</SelectItem>
                                                <SelectItem value="inventory">Inventory</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                <SelectItem value="revenue">Revenue</SelectItem>
                                                <SelectItem value="settings">Settings</SelectItem>
                                                <SelectItem value="stockCheck">Stock Check</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Action Type</Label>
                                        <Select
                                            value={permForm.actionType || ""}
                                            onValueChange={(v) => setPermForm(prev => ({ ...prev, actionType: v as PermissionDef['actionType'] }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="create">Create</SelectItem>
                                                <SelectItem value="read">Read/View</SelectItem>
                                                <SelectItem value="update">Update/Edit</SelectItem>
                                                <SelectItem value="delete">Delete</SelectItem>
                                                <SelectItem value="approve">Approve</SelectItem>
                                                <SelectItem value="configure">Configure</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Target Field (Optional)</Label>
                                    <Input
                                        value={permForm.targetField}
                                        onChange={(e) => setPermForm(prev => ({ ...prev, targetField: e.target.value }))}
                                        placeholder="e.g., name, status, settings"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Specify if this permission controls a specific field
                                    </p>
                                </div>

                                {permForm.actionType === 'custom' && (
                                    <div className="space-y-2">
                                        <Label>Custom Action</Label>
                                        <Input
                                            value={permForm.customAction}
                                            onChange={(e) => setPermForm(prev => ({ ...prev, customAction: e.target.value }))}
                                            placeholder="Describe the custom action"
                                        />
                                    </div>
                                )}

                                {/* Permission ID Preview */}
                                {permForm.name && (
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="text-xs text-muted-foreground mb-1">Generated Permission ID:</p>
                                        <code className="text-sm font-mono">{permForm.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}</code>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Live Code Preview */}
                            <div className="space-y-2 min-w-0">
                                <Label className="text-base">Live Code Preview</Label>
                                <p className="text-xs text-muted-foreground mb-4">
                                    This shows how developers will use this permission in code
                                </p>
                                {permForm.name ? (
                                    <PermissionCodePreview
                                        permissionId={permForm.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}
                                        permissionName={permForm.name}
                                        targetEntity={permForm.targetEntity}
                                        actionType={permForm.actionType}
                                        targetField={permForm.targetField}
                                        customAction={permForm.customAction}
                                    />
                                ) : (
                                    <Card>
                                        <CardContent className="p-6 text-center text-muted-foreground text-sm">
                                            Enter a permission name to see the code preview
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreatingPerm(false)}>Cancel</Button>
                            <Button onClick={handleSavePerm} disabled={savingPerm || !!permNameError || !permForm.name || !permForm.description}>
                                {savingPerm ? "Creating..." : "Create Permission"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE ROLE CONFIRMATION */}
                <Dialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Role?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the role "{deletingRole?.name}"?
                                Users with this role will need to be reassigned.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingRole(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteRole}>Delete Role</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* DELETE PERMISSION CONFIRMATION */}
                <Dialog open={!!deletingPerm} onOpenChange={(open) => !open && setDeletingPerm(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Permission?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the permission "{deletingPerm?.name}"?
                                This will remove it from all roles and users.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeletingPerm(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeletePerm}>Delete Permission</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}

function PermissionRow({ label, checked, onToggle }: { label: string; checked?: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <Label className="text-sm font-normal cursor-pointer flex-1" onClick={onToggle}>{label}</Label>
            <Switch checked={checked ?? false} onCheckedChange={onToggle} />
        </div>
    );
}
