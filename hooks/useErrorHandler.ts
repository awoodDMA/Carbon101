'use client';

import { useEffect, useState } from 'react';

interface ErrorInfo {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
  userAgent: string;
  url: string;
  type: 'javascript' | 'unhandledrejection' | 'custom';
}

export function useErrorHandler() {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    // Handle JavaScript errors
    const handleError = (event: ErrorEvent) => {
      // Filter out generic "Script error" messages which are usually cross-origin issues
      // These provide no actionable information and are often from third-party scripts
      if (event.message === 'Script error.' || event.message === 'Script error') {
        console.warn('Ignoring generic script error (likely cross-origin):', {
          message: event.message,
          filename: event.filename,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const errorInfo: ErrorInfo = {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'javascript',
      };

      setCurrentError(errorInfo);
      setShowErrorDialog(true);
      
      console.error('JavaScript Error:', errorInfo);
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        message: event.reason?.message || String(event.reason) || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'unhandledrejection',
      };

      setCurrentError(errorInfo);
      setShowErrorDialog(true);
      
      console.error('Unhandled Promise Rejection:', errorInfo);
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const reportError = (error: Error | string, additionalInfo?: Record<string, any>) => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      type: 'custom',
      ...additionalInfo,
    };

    setCurrentError(errorInfo);
    setShowErrorDialog(true);
  };

  const closeErrorDialog = () => {
    setShowErrorDialog(false);
    setCurrentError(null);
  };

  return {
    currentError,
    showErrorDialog,
    reportError,
    closeErrorDialog,
  };
}