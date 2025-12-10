import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/context/DataProvider";
import { CookieConsent } from "@/components/common/CookieConsent";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Claw Master",
  description: "Arcade Inventory & Playfield-Settings Tracker",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DataProvider>
              <AppShell>
                {children}
              </AppShell>
              <Toaster />
              <CookieConsent />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>

    </html>
  );
}

