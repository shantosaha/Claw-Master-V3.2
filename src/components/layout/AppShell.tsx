"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse logic when screen is small
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // Collapse on tablets and smaller screens
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <Sidebar open={sidebarOpen} collapsed={isCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-6 bg-background"
          tabIndex={-1}
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

