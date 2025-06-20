'use client';

import { useState, useEffect } from 'react';
import { User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects, useOptions } from '@/hooks/use-api';

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const projects = useProjects();
  const [activeId, setActiveId] = useState('');
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    if (!activeId && projects.length) {
      setActiveId(projects[0].id);
    }
  }, [projects, activeId]);
  const options = useOptions(activeId || projects[0]?.id || '');
  return (
    <>
      <aside
        className={cn(
          'flex flex-col border-r transition-all',
          open ? 'w-56' : 'w-16',
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
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    'block w-full rounded px-2 py-1 text-sm hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !open && 'text-center',
                    activeId === p.id && 'bg-accent text-accent-foreground',
                  )}
                >
                  {open ? p.name : p.name.charAt(0)}
                </button>
                {open && activeId === p.id && (
                  <ul className="mt-1 space-y-1 pl-4">
                    {options.map((o) => (
                      <li key={o.id} className="text-muted-foreground">
                        <span className="block rounded px-2 py-1 text-sm hover:bg-accent">
                          {o.name}
                        </span>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => setShowModal(true)}
                        className="rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
                      >
                        ＋ New option
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 mt-auto">
          <Settings aria-hidden="true" className="size-5" />
        </div>
      </aside>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowModal(false);
            }}
            className="rounded bg-background p-4 shadow"
          >
            <h2 className="mb-2 text-lg font-semibold">New Option</h2>
            <input
              type="text"
              placeholder="Name"
              required
              className="mb-4 w-64 rounded border p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded border px-3 py-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-primary px-3 py-1 text-primary-foreground"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
