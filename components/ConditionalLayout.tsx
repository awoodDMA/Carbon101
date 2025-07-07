'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ClientOnlyWrapper from './ClientOnlyWrapper';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Pages that should not show the sidebar
  const noSidebarPages = ['/login', '/register', '/forgot-password'];
  const shouldShowSidebar = !noSidebarPages.includes(pathname);
  
  if (shouldShowSidebar) {
    return (
      <ClientOnlyWrapper fallback={
        <div className="flex h-screen">
          <div className="w-60 bg-secondary border-r"></div>
          <main className="flex-1 overflow-auto bg-background">
            <div className="min-h-full p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      }>
        <div className="flex h-screen">
          <MobileNav />
          <Sidebar />
          <main id="main-content" className="flex-1 overflow-auto bg-background">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>
      </ClientOnlyWrapper>
    );
  }
  
  return (
    <main id="main-content" className="min-h-screen bg-background">
      {children}
    </main>
  );
}