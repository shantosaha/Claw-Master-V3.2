import { useState, useEffect, useRef } from "react";
import { ArcadeMachine } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Send, CheckCircle, Camera, X, Image as ImageIcon, ChevronsUpDown, Check, Sparkles, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { serviceReportService } from "@/services/serviceReportService";
import { unifiedSettingsService } from "@/services/unifiedSettingsService";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { getThumbnailUrl, getLightboxUrl } from "@/lib/utils/imageUtils";

interface ServiceReportFormProps {
    machine?: ArcadeMachine;
    onSuccess?: () => void;
}

const VALID_LOCATIONS = ["591", "505", "614", "Burwood", "Hornsby", "Hurstville", "Haymarket"];

export function ServiceReportForm({ machine: initialMachine, onSuccess }: ServiceReportFormProps) {
    const { user } = useAuth();
    const { machines } = useData();
    const [selectedMachine, setSelectedMachine] = useState<ArcadeMachine | null>(initialMachine || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [openMachineSearch, setOpenMachineSearch] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [autoFilledFields, setAutoFilledFields] = useState<Record<string, boolean>>({});
    const [fetchedImageUrl, setFetchedImageUrl] = useState<string | undefined>(undefined);
    const [lastStaffName, setLastStaffName] = useState<string | undefined>(undefined);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        machineTag: "",
        machineName: "",
        location: "614",
        firstName: user?.displayName?.split(' ')[0] || "",
        lastName: user?.displayName?.split(' ').slice(1).join(' ') || "",
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        playPerWin: 0,
        remarks: "",
        imageFile: null as File | null
    });

    // Auto-fill form when machine is selected or provided
    useEffect(() => {
        const fetchAndFill = async () => {
            if (selectedMachine) {
                setIsAutoFilling(true);
                try {
                    const m = selectedMachine as any;

                    // Try to get data directly (if passed from monitoring grid)
                    // Always fetch settings to get the latest JotForm data (including image)
                    const [settings, reports] = await Promise.all([
                        unifiedSettingsService.getEffectiveSettings(selectedMachine.id),
                        serviceReportService.getReports("GLOBAL_FETCH")
                    ]);

                    const normalize = (s: string) => String(s || "").toLowerCase().replace(/[\s_-]/g, '');
                    const mTag = normalize(selectedMachine.assetTag || "");
                    const lTag = normalize(selectedMachine.tag !== undefined ? String(selectedMachine.tag) : "");
                    const mId = normalize(selectedMachine.id);

                    // Find the latest report matching this machine by any of its identifiers
                    const latestReport = reports
                        .filter(r => {
                            const reportTag = normalize(r.inflowSku || r.machineId || "");
                            if (!reportTag) return false;

                            return (
                                (mTag && reportTag === mTag) ||
                                (lTag && reportTag === lTag) ||
                                (mId && reportTag === mId)
                            );
                        })
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                    // Prioritize data from the latest actual JotForm report
                    const c1 = latestReport ? latestReport.c1 : settings.c1;
                    const c2 = latestReport ? latestReport.c2 : settings.c2;
                    const c3 = latestReport ? latestReport.c3 : settings.c3;
                    const c4 = latestReport ? latestReport.c4 : settings.c4;
                    const playPerWin = latestReport ? latestReport.playPerWin : settings.payoutRate;
                    const imageUrl = latestReport?.imageUrl || settings.imageUrl;

                    setFormData(prev => ({
                        ...prev,
                        machineTag: selectedMachine.assetTag || String(selectedMachine.tag || ""),
                        machineName: selectedMachine.name,
                        location: "614", // Forced default location as requested
                        c1: Number(c1) || 0,
                        c2: Number(c2) || 0,
                        c3: Number(c3) || 0,
                        c4: Number(c4) || 0,
                        playPerWin: Number(playPerWin) || 0,
                    }));

                    // Record which fields were auto-filled
                    setAutoFilledFields({
                        machineTag: !!(mTag || lTag),
                        location: true,
                        c1: typeof c1 === 'number',
                        c2: typeof c2 === 'number',
                        c3: typeof c3 === 'number',
                        c4: typeof c4 === 'number',
                        playPerWin: typeof playPerWin === 'number',
                    });

                    setFetchedImageUrl(imageUrl);
                    setLastStaffName(latestReport?.staffName);
                    setIsSuccess(false);
                } catch (err) {
                    console.error("Auto-fill error:", err);
                } finally {
                    setIsAutoFilling(false);
                }
            } else if (!initialMachine) {
                setFormData(prev => ({
                    ...prev,
                    machineTag: "",
                    machineName: "",
                    location: "614",
                    c1: 0,
                    c2: 0,
                    c3: 0,
                    c4: 0,
                    playPerWin: 0,
                }));
                setAutoFilledFields({});
                setFetchedImageUrl(undefined);
                setLastStaffName(undefined);
            }
        };

        fetchAndFill();
    }, [selectedMachine, user, initialMachine]);

    // Update selected machine if prop changes
    useEffect(() => {
        if (initialMachine) {
            setSelectedMachine(initialMachine);
        }
    }, [initialMachine]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear auto-filled status when user touches a field
        if (autoFilledFields[field]) {
            setAutoFilledFields(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, imageFile: e.target.files![0] }));
        }
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
    };

    useEffect(() => {
        if (isCameraOpen && !stream) {
            const initCamera = async () => {
                try {
                    const activeStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" }
                    }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }));

                    setStream(activeStream);
                    if (videoRef.current) videoRef.current.srcObject = activeStream;
                } catch (err) {
                    console.error("Camera error:", err);
                    setIsCameraOpen(false);
                    toast.error("Could not access camera");
                }
            };
            initCamera();
        }
    }, [isCameraOpen, stream]);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
                        setFormData(prev => ({ ...prev, imageFile: file }));
                        stopCamera();
                        toast.success("Photo captured!");
                    }
                }, "image/jpeg", 0.8);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.imageFile) {
            toast.error("Photo evidence is required.");
            return;
        }

        if (!formData.machineTag) {
            toast.error("Machine Tag/ID is required.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Use FormData for direct upload
            const submitData = new FormData();
            submitData.append("machineTag", formData.machineTag);
            submitData.append("machineName", formData.machineName);
            submitData.append("location", formData.location);
            submitData.append("firstName", formData.firstName);
            submitData.append("lastName", formData.lastName);
            submitData.append("c1", String(formData.c1));
            submitData.append("c2", String(formData.c2));
            submitData.append("c3", String(formData.c3));
            submitData.append("c4", String(formData.c4));
            submitData.append("playPerWin", String(formData.playPerWin));
            submitData.append("remarks", formData.remarks);
            submitData.append("imageFile", formData.imageFile);

            const result = await serviceReportService.submitReport(submitData);

            if (result) {
                toast.success("Service report submitted successfully");
                setIsSuccess(true);
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Submission failed", error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="border-dashed border-2 shadow-none bg-muted/30">
                <CardContent className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">Report Submitted!</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                            The service report for {formData.machineName || formData.machineTag} has been successfully sent to JotForm.
                        </p>
                    </div>
                    <Button onClick={() => setIsSuccess(false)} variant="outline">
                        Submit Another Report
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Service Report</CardTitle>
                        <CardDescription>
                            Submit a new service entry. Select a machine to auto-fill or enter manually.
                        </CardDescription>
                    </div>

                    {/* Machine Search / Combobox */}
                    <div className="flex flex-col gap-1.5 min-w-[240px]">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quick Select</Label>
                        <Popover open={openMachineSearch} onOpenChange={setOpenMachineSearch}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openMachineSearch}
                                    className="w-full justify-between font-normal h-9 bg-background"
                                >
                                    {selectedMachine
                                        ? `${selectedMachine.name} (${selectedMachine.assetTag || selectedMachine.tag || "N/A"})`
                                        : "Search machine..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Search machine name or tag..." />
                                    <CommandList>
                                        <CommandEmpty>No machine found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setSelectedMachine(null);
                                                    setOpenMachineSearch(false);
                                                }}
                                                className="text-red-600 font-medium"
                                            >
                                                Clear Selection / Manual Entry
                                            </CommandItem>
                                            {machines.map((m) => (
                                                <CommandItem
                                                    key={m.id}
                                                    value={`${m.name} ${m.assetTag || m.tag || ""}`}
                                                    onSelect={() => {
                                                        setSelectedMachine(m);
                                                        setOpenMachineSearch(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedMachine?.id === m.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{m.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">Tag: {m.assetTag || m.tag || "N/A"}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    {/* Identification Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/40 rounded-lg border border-dashed">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Staff Name</Label>
                                {lastStaffName && (
                                    <Badge variant="outline" className="text-[10px] py-0 h-4 border-muted-foreground/20 text-muted-foreground">
                                        Last: {lastStaffName}
                                    </Badge>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                    placeholder="First Name"
                                    className="h-9 text-sm"
                                    required
                                />
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                    placeholder="Last Name"
                                    className="h-9 text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="machineTag" className="text-xs text-muted-foreground uppercase tracking-wide flex justify-between items-center">
                                Machine Tag / ID
                                {autoFilledFields.machineTag && (
                                    <span className="flex items-center gap-1 text-[10px] text-blue-500 font-bold bg-blue-50 px-1 rounded animate-in fade-in duration-300">
                                        <Sparkles className="h-3 w-3" /> PRE-FILLED
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="machineTag"
                                value={formData.machineTag}
                                onChange={(e) => handleInputChange("machineTag", e.target.value)}
                                placeholder="e.g. 591A or MAC-101"
                                className={cn(
                                    "h-9 text-sm font-mono transition-colors duration-500",
                                    autoFilledFields.machineTag && "bg-blue-50 border-blue-200"
                                )}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-xs text-muted-foreground uppercase tracking-wide flex justify-between items-center">
                                Location
                                {autoFilledFields.location && (
                                    <span className="flex items-center gap-1 text-[10px] text-blue-500 font-bold bg-blue-50 px-1 rounded animate-in fade-in duration-300">
                                        <Sparkles className="h-3 w-3" /> PRE-FILLED
                                    </span>
                                )}
                            </Label>
                            <Select
                                value={formData.location}
                                onValueChange={(val) => handleInputChange("location", val)}
                            >
                                <SelectTrigger className={cn(
                                    "h-9 text-sm transition-colors duration-500",
                                    autoFilledFields.location && "bg-blue-50 border-blue-200"
                                )}>
                                    <SelectValue placeholder="Select Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VALID_LOCATIONS.map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Submission Date</Label>
                            <div className="h-9 flex items-center px-3 border rounded-md bg-background/50 text-sm">
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Claw Settings */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Claw Strength settings</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {["c1", "c2", "c3", "c4"].map((field) => (
                                <div key={field} className="space-y-2">
                                    <Label htmlFor={field} className="text-xs text-muted-foreground flex justify-between items-center">
                                        <span>{field.toUpperCase()} {field === "c1" ? "(Catch)" : field === "c2" ? "(Top)" : field === "c3" ? "(Move)" : "(Max)"}</span>
                                        {autoFilledFields[field] && (
                                            <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                                        )}
                                    </Label>
                                    <Input
                                        id={field}
                                        type="number"
                                        value={formData[field as keyof typeof formData] as number}
                                        onChange={(e) => handleInputChange(field, Number(e.target.value))}
                                        className={cn(
                                            "h-9 transition-colors duration-500",
                                            autoFilledFields[field] && "bg-blue-50 border-blue-200"
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payout Targets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="playPerWin" className="font-semibold flex justify-between items-center">
                                Plays Per Win Target
                                {autoFilledFields.playPerWin && (
                                    <span className="flex items-center gap-1 text-[10px] text-blue-500 font-bold bg-blue-50 px-1 rounded animate-in fade-in duration-300">
                                        <Sparkles className="h-3 w-3" /> PRE-FILLED
                                    </span>
                                )}
                            </Label>
                            <Input
                                id="playPerWin"
                                type="number"
                                value={formData.playPerWin}
                                onChange={(e) => handleInputChange("playPerWin", Number(e.target.value))}
                                className={cn(
                                    "h-10 text-lg font-bold transition-colors duration-500",
                                    autoFilledFields.playPerWin && "bg-blue-50 border-blue-200"
                                )}
                            />
                            <p className="text-xs text-muted-foreground">Target win rate configured on the machine motherboard.</p>
                        </div>

                        {/* Image Evidence */}
                        <div className="space-y-2">
                            <Label className="font-semibold flex items-center gap-2">
                                Photo Evidence <span className="text-red-500">*</span>
                            </Label>

                            {!isCameraOpen ? (
                                <div className="space-y-3">
                                    {formData.imageFile ? (
                                        <div className="relative aspect-video w-full max-w-[200px] bg-muted rounded-md overflow-hidden border group">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <div className="w-full h-full cursor-pointer">
                                                        <img
                                                            src={URL.createObjectURL(formData.imageFile)}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Maximize2 className="h-6 w-6 text-white" />
                                                        </div>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
                                                    <VisuallyHidden>
                                                        <DialogTitle>Image Preview</DialogTitle>
                                                    </VisuallyHidden>
                                                    <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center">
                                                        <img
                                                            src={URL.createObjectURL(formData.imageFile)}
                                                            alt="Captured evidence"
                                                            className="max-w-full max-h-[85vh] object-contain"
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            <div className="absolute top-1 right-1">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full shadow-lg"
                                                    onClick={() => setFormData(p => ({ ...p, imageFile: null }))}
                                                    type="button"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {isAutoFilling ? (
                                                <div className="aspect-video w-full max-w-[200px] bg-muted animate-pulse rounded-md flex items-center justify-center border">
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (fetchedImageUrl || selectedMachine?.imageUrl) && (
                                                <div className="relative aspect-video w-full max-w-[200px] bg-muted rounded-md overflow-hidden border group">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <div className="w-full h-full cursor-pointer">
                                                                <img
                                                                    src={getThumbnailUrl(fetchedImageUrl || selectedMachine?.imageUrl, 400)}
                                                                    alt="Machine"
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        if (fetchedImageUrl && selectedMachine?.imageUrl) {
                                                                            target.src = getThumbnailUrl(selectedMachine.imageUrl, 200);
                                                                            const label = target.parentElement?.querySelector('.image-label');
                                                                            if (label) label.textContent = "Machine Photo (Fallback)";
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Maximize2 className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div className="absolute inset-0 flex items-end justify-center p-2">
                                                                    <span className="image-label bg-black/50 text-[10px] text-white px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                                        {fetchedImageUrl ? "Last Report Photo" : "Current Machine Photo"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
                                                            <VisuallyHidden>
                                                                <DialogTitle>Machine Reference Image</DialogTitle>
                                                            </VisuallyHidden>
                                                            <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center">
                                                                <img
                                                                    src={getLightboxUrl(fetchedImageUrl || selectedMachine?.imageUrl, 1200)}
                                                                    alt="Machine Reference"
                                                                    loading="eager"
                                                                    decoding="async"
                                                                    className="max-w-full max-h-[85vh] object-contain"
                                                                />
                                                                <div className="absolute bottom-4 left-4">
                                                                    <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-md">
                                                                        {fetchedImageUrl ? "Reference Photo from Last Report" : "Current System Machine Photo"}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <Button variant="outline" className="flex-1 justify-start h-10" type="button" onClick={() => document.getElementById('image-upload')?.click()}>
                                                    <ImageIcon className="mr-2 h-4 w-4" />
                                                    Upload Photo
                                                </Button>
                                                <Input
                                                    id="image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <Button variant="secondary" className="h-10 px-4" type="button" onClick={startCamera}>
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Camera
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2 bg-black rounded-lg p-2">
                                    <div className="relative aspect-video bg-black rounded overflow-hidden">
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="ghost" className="text-white hover:bg-white/10" size="sm" onClick={stopCamera} type="button">Cancel</Button>
                                        <Button variant="default" size="sm" onClick={capturePhoto} type="button">
                                            <Camera className="mr-2 h-4 w-4" /> Capture Photo
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <Label htmlFor="remarks" className="font-semibold">Remarks & Notes</Label>
                        <Textarea
                            id="remarks"
                            placeholder="Detail any hardware adjustments, cleanings, or parts replaced..."
                            className="min-h-[80px]"
                            value={formData.remarks}
                            onChange={(e) => handleInputChange("remarks", e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/5 px-6 py-4">
                    <Button variant="ghost" type="button" onClick={() => setSelectedMachine(null)} disabled={isSubmitting}>
                        Clear Form
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Submit Report
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

