import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service | Claw Master",
    description: "Terms of Service for Claw Master - Arcade Inventory & Settings Tracker",
};

export default function TermsOfServicePage() {
    return (
        <div className="container max-w-4xl py-8 px-4">
            <Button variant="ghost" asChild className="mb-6">
                <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Terms of Service</CardTitle>
                    <p className="text-sm text-muted-foreground">Last updated: December 9, 2024</p>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Claw Master (&quot;the Application&quot;), you agree to be bound
                        by these Terms of Service. If you do not agree, please do not use the Application.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        Claw Master is an arcade inventory and settings tracking application that helps
                        operators manage their arcade machines, stock, maintenance, and team operations.
                    </p>

                    <h2>3. User Accounts</h2>
                    <h3>3.1 Account Creation</h3>
                    <p>
                        You must have a valid Google account to sign in. You are responsible for maintaining
                        the confidentiality of your account credentials.
                    </p>

                    <h3>3.2 Account Responsibilities</h3>
                    <p>You agree to:</p>
                    <ul>
                        <li>Provide accurate information</li>
                        <li>Maintain the security of your account</li>
                        <li>Notify us immediately of unauthorized access</li>
                        <li>Accept responsibility for all activities under your account</li>
                    </ul>

                    <h2>4. Acceptable Use</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Use the Application for unlawful purposes</li>
                        <li>Attempt to gain unauthorized access to systems</li>
                        <li>Interfere with the Application&apos;s functionality</li>
                        <li>Upload malicious code or content</li>
                        <li>Impersonate others or misrepresent your affiliation</li>
                        <li>Use automated systems to access the Application without permission</li>
                    </ul>

                    <h2>5. Data and Content</h2>
                    <h3>5.1 Your Data</h3>
                    <p>
                        You retain ownership of data you input into the Application. You grant us a license
                        to store, process, and display this data as necessary to provide the service.
                    </p>

                    <h3>5.2 Data Accuracy</h3>
                    <p>
                        You are responsible for the accuracy of data you enter. We are not liable for
                        business decisions made based on inaccurate data.
                    </p>

                    <h2>6. Service Availability</h2>
                    <p>
                        We strive to maintain high availability but do not guarantee uninterrupted service.
                        We may perform maintenance that temporarily affects access.
                    </p>

                    <h2>7. Intellectual Property</h2>
                    <p>
                        The Application, including its code, design, and trademarks, is proprietary. You
                        may not copy, modify, or distribute any part without permission.
                    </p>

                    <h2>8. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
                        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS,
                        DATA, OR BUSINESS OPPORTUNITIES.
                    </p>

                    <h2>9. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold harmless Claw Master and its operators from any
                        claims arising from your use of the Application or violation of these Terms.
                    </p>

                    <h2>10. Termination</h2>
                    <p>
                        We may suspend or terminate your access at any time for violation of these Terms
                        or for any other reason at our discretion.
                    </p>

                    <h2>11. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. Continued use of the Application after
                        changes constitutes acceptance of the new Terms.
                    </p>

                    <h2>12. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of the jurisdiction in which the Application
                        operator is located.
                    </p>

                    <h2>13. Contact</h2>
                    <p>
                        For questions about these Terms, please contact the system administrator.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
