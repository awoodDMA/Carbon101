'use client';

import React from 'react';
import ErrorDialog from './ErrorDialog';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDialog: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDialog: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      showDialog: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDialog: false,
    });
  };

  handleCloseDialog = () => {
    this.setState({
      showDialog: false,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      // Format error information for the dialog
      const errorDetails = {
        message: error?.message || 'Unknown error occurred',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack || undefined,
        name: error?.name,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      };

      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <>
            <FallbackComponent error={error!} retry={this.handleRetry} />
            <ErrorDialog
              isOpen={this.state.showDialog}
              onClose={this.handleCloseDialog}
              title="Application Error"
              errorInfo={errorDetails}
            />
          </>
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. You can try refreshing the page or contact support.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => this.setState({ showDialog: true })}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
              >
                Show Error Details
              </button>
            </div>
          </div>

          <ErrorDialog
            isOpen={this.state.showDialog}
            onClose={this.handleCloseDialog}
            title="Application Error"
            errorInfo={errorDetails}
          />
        </div>
      );
    }

    return this.props.children;
  }
}