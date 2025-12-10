"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render shows the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error to console (could also send to error reporting service)
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="flex items-center justify-center min-h-[400px] p-4">
                    <Card className="w-full max-w-md border-destructive/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Please try refreshing the page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <Button onClick={this.handleRetry} variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="w-full text-sm text-muted-foreground">
                                    <summary className="cursor-pointer hover:text-foreground">
                                        Error Details
                                    </summary>
                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
