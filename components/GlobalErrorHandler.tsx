'use client';

import { useErrorHandler } from '@/hooks/useErrorHandler';
import ErrorDialog from './ErrorDialog';

export default function GlobalErrorHandler() {
  const { currentError, showErrorDialog, closeErrorDialog } = useErrorHandler();

  if (!currentError) return null;

  return (
    <ErrorDialog
      isOpen={showErrorDialog}
      onClose={closeErrorDialog}
      title="Application Error"
      errorInfo={currentError}
    />
  );
}