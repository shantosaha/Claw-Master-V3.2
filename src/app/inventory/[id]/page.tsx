"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { stockService, machineService } from "@/services";
import { StockItem, ArcadeMachine } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Settings2, Loader2, ExternalLink, Package, History, StickyNote, Warehouse, Bot } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StockItemForm } from "@/components/inventory/StockItemForm";
import { ActivityLog } from "@/components/inventory/ActivityLog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [item, setItem] = useState<StockItem | null>(null);
    const [machines, setMachines] = useState<ArcadeMachine[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [sizes, setSizes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [itemData, machinesData, categoriesData, sizesData] = await Promise.all([
                stockService.getById(id),
                machineService.getAll(),
                stockService.getUniqueCategories(),
                stockService.getUniqueSizes(),
            ]);
            setItem(itemData);
            setMachines(machinesData);
            setCategories(categoriesData);
            setSizes(sizesData);
        } catch (error) {
            console.error("Failed to load item:", error);
            toast.error("Error", { description: "Failed to load item details." });
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveItem = async (data: any) => {
        if (!item) return;
        try {
            await stockService.update(item.id, {
                ...data,
                updatedAt: new Date()
            });
            await loadData(); // Re-load data to get fresh state
            toast.success("Item Updated", { description: "Item details have been updated." });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Failed to update item:", error);
            toast.error("Error", { description: "Failed to update item." });
        }
    };
    
    const handleDeleteItem = async () => {
        if (!item) return;
        try {
            await stockService.delete(item.id);
            toast.success("Item Deleted", { description: `${item.name} has been permanently deleted.` });
            router.push("/inventory");
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Error", { description: "Failed to delete item." });
        } finally {
            setIsDeleteConfirmOpen(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4">
                <h1 className="text-2xl font-bold">Item Not Found</h1>
                <Button onClick={() => router.push("/inventory")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Inventory
                </Button>
            </div>
        );
    }

    const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
    const stockLevel = calculateStockLevel(totalQty, item.stockStatus);
    const assignedMachines = machines.filter(m =>
        m.slots.some(slot =>
            slot.currentItem?.id === item.id ||
            slot.upcomingQueue?.some(uItem => uItem.itemId === item.id)
        )
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
             <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push("/inventory")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Inventory
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Image Card */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted/40 border">
                                {(item.imageUrls && item.imageUrls.length > 0) || item.imageUrl ? (
                                    <img
                                        src={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[selectedImageIndex] : item.imageUrl || ""}
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-contain p-2"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://placehold.co/600x600?text=No+Image";
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                        No Image
                                    </div>
                                )}
                            </div>
                            {item.imageUrls && item.imageUrls.length > 1 && (
                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {item.imageUrls.map((url, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            className={`relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"}`}
                                        >
                                            <img
                                                src={url}
                                                alt={`${item.name} thumbnail ${index + 1}`}
                                                className="object-cover w-full h-full"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Primary Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">{item.name}</CardTitle>
                            <CardDescription>SKU: {item.sku}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Category</span>
                                <span className="font-medium">{item.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Brand</span>
                                <span className="font-medium">{item.brand || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Size</span>
                                <span className="font-medium">{item.size || "N/A"}</span>
                            </div>
                        </CardContent>
                        <Separator />
                        <CardContent className="p-4">
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {item.tags && item.tags.length > 0 ? (
                                    item.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)
                                ) : (
                                    <span className="text-sm text-muted-foreground">No tags</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col space-y-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </Button>
                            <Button variant="destructive_outline" onClick={() => setIsDeleteConfirmOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="details"><Package className="mr-2 h-4 w-4"/>Details</TabsTrigger>
                            <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>History</TabsTrigger>
                            <TabsTrigger value="machines"><Bot className="mr-2 h-4 w-4"/>Machines</TabsTrigger>
                            <TabsTrigger value="notes"><StickyNote className="mr-2 h-4 w-4"/>Notes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 mt-6">
                            {item.description && (
                                <Card>
                                    <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm text-muted-foreground">{item.description}</p></CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader><CardTitle>Stock Details</CardTitle></CardHeader>
                                <CardContent className="divide-y">
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-muted-foreground">Overall Stock</span>
                                        <span className="font-bold text-lg">{totalQty} units</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-muted-foreground">Stock Status</span>
                                        <Badge className={`${stockLevel.colorClass} text-white`}>{stockLevel.label}</Badge>
                                    </div>
                                    <div className="py-3">
                                         <h4 className="text-sm font-medium mb-3 text-muted-foreground">Locations</h4>
                                         <div className="space-y-2">
                                            {item.locations.length > 0 ? (
                                                item.locations.map((loc, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                          <Warehouse className="h-4 w-4 text-muted-foreground"/>
                                                          <span className="font-medium">{loc.name}</span>
                                                        </div>
                                                        <Badge variant="secondary">{loc.quantity} units</Badge>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No locations defined</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
                                <CardContent className="divide-y text-sm">
                                    <div className="flex justify-between py-3"><span className="text-muted-foreground">Cost Per Unit</span><span className="font-medium">${item.supplyChain?.costPerUnit?.toFixed(2) || '0.00'}</span></div>
                                    <div className="flex justify-between py-3"><span className="text-muted-foreground">Estimated Value</span><span className="font-medium">${item.value?.toFixed(2) || '0.00'}</span></div>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader><CardTitle>Technical Specs</CardTitle></CardHeader>
                                <CardContent className="divide-y text-sm">
                                   <div className="flex justify-between py-3"><span className="text-muted-foreground">Weight</span><span className="font-medium">{item.technicalSpecs?.weightGrams ? `${item.technicalSpecs.weightGrams} g` : 'N/A'}</span></div>
                                    <div className="flex justify-between py-3"><span className="text-muted-foreground">Dimensions (L×W×H)</span><span className="font-medium">{item.technicalSpecs?.dimensions ? `${item.technicalSpecs.dimensions.lengthCm}×${item.technicalSpecs.dimensions.widthCm}×${item.technicalSpecs.dimensions.heightCm} cm` : 'N/A'}</span></div>
                                    <div className="flex justify-between py-3"><span className="text-muted-foreground">Recommended Claw Strength</span><span className="font-medium">{item.technicalSpecs?.recommendedClawStrength || 'N/A'}</span></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Supply Chain</CardTitle></CardHeader>
                                <CardContent className="divide-y text-sm">
                                   <div className="flex justify-between py-3"><span className="text-muted-foreground">Vendor</span><span className="font-medium">{item.supplyChain?.vendor || 'N/A'}</span></div>
                                   <div className="flex justify-between py-3"><span className="text-muted-foreground">Reorder Point</span><span className="font-medium">{item.supplyChain?.reorderPoint ? `${item.supplyChain.reorderPoint} units` : 'N/A'}</span></div>
                                   <div className="flex justify-between py-3"><span className="text-muted-foreground">Last Order Date</span><span className="font-medium">{item.supplyChain?.lastOrderDate ? new Date(item.supplyChain.lastOrderDate).toLocaleDateString() : 'N/A'}</span></div>
                                </CardContent>
                            </Card>

                        </TabsContent>

                        <TabsContent value="history" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle>Activity Log</CardTitle><CardDescription>Recent history for this item</CardDescription></CardHeader>
                                <CardContent><ActivityLog logs={item.history} /></CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="machines" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle>Machine Assignments</CardTitle><CardDescription>Where this item is currently or scheduled to be in use.</CardDescription></CardHeader>
                                <CardContent>
                                    {assignedMachines.length > 0 ? (
                                         <div className="space-y-3">
                                             {assignedMachines.map((machine) => (
                                                <div key={machine.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                     <Link href={`/machines/${machine.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
                                                        {machine.name}
                                                        <ExternalLink className="h-4 w-4" />
                                                     </Link>
                                                     <div className="text-right text-sm">
                                                        {machine.slots.filter(s => s.currentItem?.id === item.id).map(s => (
                                                            <div key={s.id}>In use at: <span className="font-semibold">{s.name}</span></div>
                                                        ))}
                                                         {machine.slots.filter(s => s.upcomingQueue?.some(u => u.itemId === item.id)).map(s => (
                                                            <div key={s.id} className="text-yellow-600">Queued for: <span className="font-semibold">{s.name}</span></div>
                                                        ))}
                                                     </div>
                                                </div>
                                             ))}
                                         </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">Not assigned to any machines.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-6">
                             <Card>
                                <CardHeader><CardTitle>Notes</CardTitle><CardDescription>Internal notes for this stock item. (Feature coming soon)</CardDescription></CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg p-4 h-48 flex items-center justify-center bg-muted/20">
                                        <p className="text-muted-foreground">Notes functionality is under development.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Stock Item</DialogTitle>
                        <DialogDescription>
                            Update details for {item.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <StockItemForm
                        initialData={item}
                        categories={categories}
                        sizes={sizes}
                        machines={machines}
                        onSubmit={handleSaveItem}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDeleteItem}
                title="Are you sure?"
                description={`This will permanently delete "${item.name}". This action cannot be undone.`}
            />

        </div>
    );
}