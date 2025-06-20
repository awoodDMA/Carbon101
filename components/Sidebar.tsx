'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const projects = ['Project A', 'Project B', 'Project C'];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  return (
    <aside
      className={cn(
        'flex flex-col border-r transition-all',
        open ? 'w-56' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4">
        <User aria-hidden="true" className="size-6" />
        <button
          aria-label="Toggle sidebar"
          onClick={() => setOpen(!open)}
          className="rounded p-1 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? (
            <ChevronLeft aria-hidden="true" className="size-5" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {open && (
          <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">
            Projects
          </h2>
        )}
        <ul className="space-y-1">
          {projects.map((name) => (
            <li key={name}>
              <Link
                href="#"
                className={cn(
                  'block rounded px-2 py-1 text-sm hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !open && 'text-center'
                )}
              >
                {open ? name : name.charAt(0)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 mt-auto">
        <Settings aria-hidden="true" className="size-5" />
      </div>
    </aside>
  );
}
