import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy | Claw Master",
    description: "Privacy Policy for Claw Master - Arcade Inventory & Settings Tracker",
};

export default function PrivacyPolicyPage() {
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
                    <CardTitle className="text-2xl">Privacy Policy</CardTitle>
                    <p className="text-sm text-muted-foreground">Last updated: December 9, 2024</p>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <h2>1. Introduction</h2>
                    <p>
                        Claw Master (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the Claw Master
                        Arcade Inventory &amp; Settings Tracker application. This Privacy Policy explains how we
                        collect, use, disclose, and safeguard your information when you use our application.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <h3>2.1 Personal Information</h3>
                    <p>We may collect personal information that you voluntarily provide, including:</p>
                    <ul>
                        <li>Name and email address (via Google Sign-In)</li>
                        <li>Profile picture (from Google account)</li>
                        <li>Role and permissions within the organization</li>
                    </ul>

                    <h3>2.2 Usage Data</h3>
                    <p>We automatically collect certain information when you use the application:</p>
                    <ul>
                        <li>Device information (browser type, operating system)</li>
                        <li>Access times and pages viewed</li>
                        <li>Actions taken within the application</li>
                    </ul>

                    <h3>2.3 Business Data</h3>
                    <p>Data related to your arcade operations:</p>
                    <ul>
                        <li>Inventory records and stock levels</li>
                        <li>Machine configurations and settings</li>
                        <li>Maintenance logs and order history</li>
                        <li>Team member assignments</li>
                    </ul>

                    <h2>3. How We Use Your Information</h2>
                    <p>We use the collected information to:</p>
                    <ul>
                        <li>Provide and maintain the application</li>
                        <li>Authenticate users and manage access</li>
                        <li>Generate analytics and reports</li>
                        <li>Improve our services</li>
                        <li>Communicate important updates</li>
                    </ul>

                    <h2>4. Data Storage and Security</h2>
                    <p>
                        Your data is stored securely using Firebase services provided by Google. We implement
                        industry-standard security measures including:
                    </p>
                    <ul>
                        <li>Encrypted data transmission (HTTPS/TLS)</li>
                        <li>Role-based access controls</li>
                        <li>Regular security audits</li>
                        <li>Secure authentication via Firebase Auth</li>
                    </ul>

                    <h2>5. Data Sharing</h2>
                    <p>We do not sell your personal information. We may share data with:</p>
                    <ul>
                        <li>Service providers (Firebase/Google Cloud) for hosting</li>
                        <li>Team members within your organization (based on permissions)</li>
                        <li>Legal authorities when required by law</li>
                    </ul>

                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Request correction of inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Export your data</li>
                        <li>Withdraw consent at any time</li>
                    </ul>

                    <h2>7. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active or as needed to provide
                        services. Business data may be retained for compliance and audit purposes.
                    </p>

                    <h2>8. Cookies and Tracking</h2>
                    <p>
                        We use essential cookies for authentication and session management. No third-party
                        tracking cookies are used.
                    </p>

                    <h2>9. Children&apos;s Privacy</h2>
                    <p>
                        Our application is not intended for children under 13. We do not knowingly collect
                        data from children.
                    </p>

                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy periodically. We will notify you of significant
                        changes via the application or email.
                    </p>

                    <h2>11. Contact Us</h2>
                    <p>
                        For questions about this Privacy Policy or your data, please contact the system
                        administrator.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
