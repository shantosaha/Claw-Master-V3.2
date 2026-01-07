import { useState, useEffect, useRef } from "react";
import { ArcadeMachine } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Save, CheckCircle, Camera, X, Image as ImageIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { serviceReportService } from "@/services/serviceReportService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ServiceReportFormProps {
    machine: ArcadeMachine;
    onSuccess?: () => void;
}

const VALID_LOCATIONS = ["591", "505", "614", "Burwood", "Hornsby", "Hurstville", "Haymarket"];

export function ServiceReportForm({ machine, onSuccess }: ServiceReportFormProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        location: "",
        c1: 0,
        c2: 0,
        c3: 0,
        c4: 0,
        playsPerWin: 0,
        remarks: "",
        imageFile: null as File | null
    });

    // Reset form when machine changes
    useEffect(() => {
        if (machine) {
            const m = machine as any;
            // Try to match machine location to valid list, otherwise default to first or empty
            const matchedLocation = VALID_LOCATIONS.find(l => l.toLowerCase() === machine.location.toLowerCase()) || machine.location;

            setFormData({
                location: matchedLocation,
                c1: m.c1 || 0,
                c2: m.c2 || 0,
                c3: m.c3 || 0,
                c4: m.c4 || 0,
                playsPerWin: m.payoutSettings || m.playPerWin || 0,
                remarks: "",
                imageFile: null
            });
            setIsSuccess(false);
            stopCamera(); // Ensure camera is closed if we switch machines
        }
    }, [machine]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, imageFile: e.target.files![0] }));
        }
    };

    const startCamera = async () => {
        setIsCameraOpen(true); // Open UI first so video element exists
    };

    // Effect to handle camera stream when UI opens
    useEffect(() => {
        let activeStream: MediaStream | null = null;

        const initCamera = async () => {
            if (isCameraOpen && !stream) {
                try {
                    // Try environment facing mode first (back camera)
                    try {
                        activeStream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: "environment" }
                        });
                    } catch (err) {
                        console.warn("Environment camera failed, falling back to default", err);
                        // Fallback to any video device
                        activeStream = await navigator.mediaDevices.getUserMedia({
                            video: true
                        });
                    }

                    setStream(activeStream);

                    if (videoRef.current) {
                        videoRef.current.srcObject = activeStream;
                    }
                } catch (err: any) {
                    console.error("Error accessing camera:", err);
                    setIsCameraOpen(false); // Close UI on error

                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        toast.error("Camera access denied. Please allow camera permissions in your browser and System Preferences (if on Mac).");
                    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                        toast.error("No camera device found.");
                    } else {
                        toast.error("Could not access camera. " + (err.message || "Unknown error"));
                    }
                }
            }
        };

        if (isCameraOpen) {
            initCamera();
        }

        // Cleanup function for when effect re-runs or component unmounts
        return () => {
            // We only stop tracks if we are closing the camera (handled by other effect)
            // or if the component unmounts. 
            // In this specific effect structure, we rely on the main cleanup effect for `stream` state changes
            // but we can ensure local cleanup here if needed.
        };
    }, [isCameraOpen]);

    // Ensure video ref is updated if stream changes while open
    useEffect(() => {
        if (isCameraOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isCameraOpen]);

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
            toast.error("Please upload or capture a photo of the machine/issue.");
            return;
        }

        if (!formData.location) {
            toast.error("Please select a valid location.");
            return;
        }

        setIsSubmitting(true);

        try {
            await serviceReportService.submitReport({
                machineId: machine.id,
                machineName: machine.name,
                location: formData.location, // Use selected location
                staffName: user?.displayName || "Unknown Staff",
                c1: Number(formData.c1),
                c2: Number(formData.c2),
                c3: Number(formData.c3),
                c4: Number(formData.c4),
                playsPerWin: Number(formData.playsPerWin),
                inflowSku: machine.assetTag || machine.tag || "N/A",
                remarks: formData.remarks,
                // In a real app, we'd upload the image here and get a URL
                imageUrl: URL.createObjectURL(formData.imageFile),
            });

            toast.success("Service report submitted successfully");
            setIsSuccess(true);
            if (onSuccess) onSuccess();

            // Optional: Reset form or wait for user to navigate away
        } catch (error) {
            console.error("Submission failed", error);
            toast.error("Failed to submit service report");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="max-w-2xl mx-auto border-dashed border-2 shadow-none bg-muted/30">
                <CardContent className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">Report Submitted!</h3>
                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                            The service report for {machine.name} has been successfully sent to the backend and forwarded to JotForm.
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
        <Card className="max-w-3xl mx-auto shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <CardTitle>New Service Report</CardTitle>
                <CardDescription>
                    Submit a new service entry for {machine.name}. Standard fields are auto-filled.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    {/* Auto-filled Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/40 rounded-lg border border-dashed">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Staff Member</Label>
                            <div className="font-medium text-sm">{user?.displayName || "Unknown Staff"}</div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Machine Tag</Label>
                            <div className="flex items-center gap-2">
                                <span className="font-mono bg-background px-2 py-1 rounded border text-sm">{machine.assetTag || machine.tag || "N/A"}</span>
                                <span className="text-muted-foreground text-sm">- {machine.name}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                            <div className="font-medium text-sm">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Location</Label>
                            <Select
                                value={formData.location}
                                onValueChange={(val) => handleInputChange("location", val)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VALID_LOCATIONS.map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Claw Settings */}
                    <div className="space-y-4">
                        <Label className="text-base">Claw Strength Settings</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="c1" className="text-xs">C1 (Catch)</Label>
                                <Input
                                    id="c1"
                                    type="number"
                                    value={formData.c1}
                                    onChange={(e) => handleInputChange("c1", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c2" className="text-xs">C2 (Top)</Label>
                                <Input
                                    id="c2"
                                    type="number"
                                    value={formData.c2}
                                    onChange={(e) => handleInputChange("c2", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c3" className="text-xs">C3 (Move)</Label>
                                <Input
                                    id="c3"
                                    type="number"
                                    value={formData.c3}
                                    onChange={(e) => handleInputChange("c3", e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c4" className="text-xs">C4 (Max Power)</Label>
                                <Input
                                    id="c4"
                                    type="number"
                                    value={formData.c4}
                                    onChange={(e) => handleInputChange("c4", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payout Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="playsPerWin">Plays Per Win Target</Label>
                            <Input
                                id="playsPerWin"
                                type="number"
                                value={formData.playsPerWin}
                                onChange={(e) => handleInputChange("playsPerWin", e.target.value)}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">The target win rate setting on the machine.</p>
                        </div>

                        {/* Photo Input with Camera Option */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                Photo Evidence <span className="text-red-500">*</span>
                            </Label>

                            {!isCameraOpen ? (
                                <div className="space-y-3">
                                    {formData.imageFile && (
                                        <div className="relative aspect-video w-full max-w-[200px] bg-muted rounded-md overflow-hidden border">
                                            <img
                                                src={URL.createObjectURL(formData.imageFile)}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => setFormData(p => ({ ...p, imageFile: null }))}
                                                type="button"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Button variant="outline" className="w-full justify-start text-muted-foreground" type="button" onClick={() => document.getElementById('image-upload')?.click()}>
                                                <ImageIcon className="mr-2 h-4 w-4" />
                                                {formData.imageFile ? "Change File" : "Upload File"}
                                            </Button>
                                            <Input
                                                id="image-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>
                                        <Button variant="outline" type="button" onClick={startCamera}>
                                            <Camera className="mr-2 h-4 w-4" />
                                            Camera
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 bg-black rounded-md p-2">
                                    <div className="relative aspect-video bg-black rounded overflow-hidden">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="destructive" size="sm" onClick={stopCamera} type="button">
                                            Cancel
                                        </Button>
                                        <Button variant="default" size="sm" onClick={capturePhoto} type="button">
                                            <Camera className="mr-2 h-4 w-4" />
                                            Capture
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks / Notes</Label>
                        <Textarea
                            id="remarks"
                            placeholder="Enter any maintenance notes, adjustments made, or issues found..."
                            className="min-h-[100px]"
                            value={formData.remarks}
                            onChange={(e) => handleInputChange("remarks", e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-4">
                    <Button variant="ghost" type="button" onClick={() => setIsSuccess(false)} disabled={isSubmitting}>
                        Reset Form
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
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
