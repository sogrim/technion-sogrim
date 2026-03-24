import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">משהו השתבש</h2>
              <p className="text-muted-foreground">
                אירעה שגיאה בלתי צפויה. אנא נסה שוב.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-lg bg-muted p-3 text-start">
                <p className="text-xs font-mono text-muted-foreground break-all" dir="ltr">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={this.handleRetry}>
                <RotateCcw className="h-4 w-4" />
                נסה שוב
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                חזור לדף הבית
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
