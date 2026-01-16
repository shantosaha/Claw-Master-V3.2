import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// JotForm Form ID
const JOTFORM_FORM_ID = "241572864977069";

// Field mappings for JotForm submission
// Format: submission[qID] = value
const FIELD_MAPPINGS = {
    tag: "q21_locationTag",           // Tag Number
    firstName: "q19_locationStaff[first]", // Staff First Name
    lastName: "q19_locationStaff[last]",   // Staff Last Name
    location: "q6_location",          // Location dropdown
    c1: "q8_c1",                      // C1
    c2: "q9_c2",                      // C2
    c3: "q10_c3",                     // C3
    c4: "q11_c4",                     // C4
    playPerWin: "q12_playsPer",      // Plays Per Win
    inflowSku: "q22_inflowSku",       // Inflow SKU
    remarks: "q20_remarks",           // Remarks
    // Note: Image upload (q13) requires special handling with FormData
} as const;

interface SubmitReportData {
    machineId: string;
    machineName: string;
    location: string;
    staffName: string;
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    playPerWin: number;
    inflowSku?: string;
    remarks?: string;
    imageUrl?: string;
    imageBase64?: string;
}

/**
 * POST handler to submit service report to JotForm
 * Supports multipart/form-data for direct image uploads
 */
export async function POST(request: NextRequest) {
    try {
        const incomingFormData = await request.formData();

        console.log("[JotForm Submit] Received form data");

        // Build new FormData for JotForm
        const jotformFormData = new FormData();

        // Required JotForm fields
        jotformFormData.append("formID", JOTFORM_FORM_ID);

        // Map incoming fields to JotForm fields
        const staffName = incomingFormData.get("staffName")?.toString() || "";
        const nameParts = staffName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        jotformFormData.append(FIELD_MAPPINGS.tag, incomingFormData.get("machineTag")?.toString() || "");
        jotformFormData.append(FIELD_MAPPINGS.firstName, firstName);
        jotformFormData.append(FIELD_MAPPINGS.lastName, lastName);
        jotformFormData.append(FIELD_MAPPINGS.location, incomingFormData.get("location")?.toString() || "");
        jotformFormData.append(FIELD_MAPPINGS.c1, incomingFormData.get("c1")?.toString() || "0");
        jotformFormData.append(FIELD_MAPPINGS.c2, incomingFormData.get("c2")?.toString() || "0");
        jotformFormData.append(FIELD_MAPPINGS.c3, incomingFormData.get("c3")?.toString() || "0");
        jotformFormData.append(FIELD_MAPPINGS.c4, incomingFormData.get("c4")?.toString() || "0");
        jotformFormData.append(FIELD_MAPPINGS.playPerWin, incomingFormData.get("playPerWin")?.toString() || "0");
        jotformFormData.append(FIELD_MAPPINGS.inflowSku, incomingFormData.get("inflowSku")?.toString() || "");
        jotformFormData.append(FIELD_MAPPINGS.remarks, incomingFormData.get("remarks")?.toString() || "");

        // Handle Image File (q13)
        const imageFile = incomingFormData.get("imageFile");
        if (imageFile && imageFile instanceof File) {
            console.log("[JotForm Submit] Attaching image file:", imageFile.name, imageFile.size);
            jotformFormData.append("q13_imageUpload", imageFile);
        }

        // Submit to JotForm
        const jotformSubmitUrl = `https://submit.jotform.com/submit/${JOTFORM_FORM_ID}`;

        console.log("[JotForm Submit] Forwarding to:", jotformSubmitUrl);

        const response = await fetch(jotformSubmitUrl, {
            method: "POST",
            body: jotformFormData,
            // Fetch will set the correct boundary for multipart/form-data
            redirect: "manual",
        });

        const isSuccess = response.status >= 200 && response.status < 400;

        if (isSuccess) {
            const location = response.headers.get("location");
            return NextResponse.json({
                success: true,
                message: "Service report submitted successfully to JotForm with image",
                redirectUrl: location,
            });
        } else {
            const responseText = await response.text();
            console.error("[JotForm Submit] Error response:", responseText.substring(0, 500));
            return NextResponse.json({
                success: false,
                error: `JotForm submission failed with status ${response.status}`,
                details: responseText.substring(0, 200),
            }, { status: response.status });
        }
    } catch (error) {
        console.error("[JotForm Submit] Error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to submit to JotForm",
            details: String(error),
        }, { status: 500 });
    }
}
