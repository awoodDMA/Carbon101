'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/compare', label: 'Compare', icon: BarChart },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-lg">Carbon101</div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Close navigation menu"
          />
          
          {/* Drawer */}
          <div className="md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-out">
            <div className="p-4 border-b">
              <div className="font-semibold text-lg">Carbon101</div>
            </div>
            
            <nav className="p-4 space-y-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent',
                    pathname === href && 'bg-accent border-l-2 border-primary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
      
      {/* Spacer for mobile header */}
      <div className="md:hidden h-16" />
    </>
  );
}