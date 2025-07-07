'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  errorInfo: {
    message?: string;
    stack?: string;
    componentStack?: string;
    errorBoundary?: string;
    [key: string]: any;
  };
}

export default function ErrorDialog({ isOpen, onClose, title = "Error Details", errorInfo }: ErrorDialogProps) {
  const [copied, setCopied] = useState(false);

  // Format error information as compressed text
  const formatErrorForCopy = () => {
    const parts: string[] = [];
    
    if (errorInfo.message) {
      parts.push(`Error: ${errorInfo.message}`);
    }
    
    if (errorInfo.stack) {
      // Compress stack trace by removing extra whitespace and newlines
      const compressedStack = errorInfo.stack
        .replace(/\n\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      parts.push(`Stack: ${compressedStack}`);
    }
    
    if (errorInfo.componentStack) {
      const compressedComponent = errorInfo.componentStack
        .replace(/\n\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      parts.push(`Component: ${compressedComponent}`);
    }
    
    // Add any other error properties
    Object.entries(errorInfo).forEach(([key, value]) => {
      if (!['message', 'stack', 'componentStack'].includes(key) && value) {
        const compressedValue = String(value)
          .replace(/\n\s+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        parts.push(`${key}: ${compressedValue}`);
      }
    });
    
    return parts.join(' | ');
  };

  const handleCopy = async () => {
    try {
      const errorText = formatErrorForCopy();
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: select text for manual copy
      const textArea = document.createElement('textarea');
      textArea.value = formatErrorForCopy();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close error dialog"
      />
      
      {/* Dialog */}
      <div className="relative bg-background rounded-lg border shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-destructive">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Error Message */}
          {errorInfo.message && (
            <div>
              <h3 className="text-sm font-medium text-destructive mb-2">Error Message:</h3>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm">
                {errorInfo.message}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {errorInfo.stack && (
            <div>
              <h3 className="text-sm font-medium mb-2">Stack Trace:</h3>
              <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-40">
                <pre className="whitespace-pre-wrap">{errorInfo.stack}</pre>
              </div>
            </div>
          )}

          {/* Component Stack */}
          {errorInfo.componentStack && (
            <div>
              <h3 className="text-sm font-medium mb-2">Component Stack:</h3>
              <div className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
              </div>
            </div>
          )}

          {/* Additional Error Info */}
          {Object.entries(errorInfo).some(([key]) => !['message', 'stack', 'componentStack'].includes(key)) && (
            <div>
              <h3 className="text-sm font-medium mb-2">Additional Information:</h3>
              <div className="space-y-2">
                {Object.entries(errorInfo)
                  .filter(([key]) => !['message', 'stack', 'componentStack'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="p-2 bg-muted/50 rounded text-xs">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Compressed Error Preview */}
          <div>
            <h3 className="text-sm font-medium mb-2">Compressed Error (for copying):</h3>
            <div className="p-3 bg-accent/50 border rounded-md text-xs break-all">
              {formatErrorForCopy()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Click copy to get compressed error text for support
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                copied 
                  ? "bg-green-600 text-white" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Error
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}