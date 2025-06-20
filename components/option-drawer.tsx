'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const options = [
  { id: 'option-a', name: 'Option A' },
  { id: 'option-b', name: 'Option B' },
  { id: 'option-c', name: 'Option C' },
];

export default function OptionDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const optionId = searchParams.get('optionId') ?? '';

  const setOption = (id: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('optionId', id);
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        className="self-end"
        onClick={() => setOpen(!open)}
      >
        {open ? 'Close options' : 'Design options'}
      </Button>
      {open && (
        <aside className="fixed right-0 top-0 z-50 flex h-full w-64 flex-col gap-2 overflow-y-auto border-l bg-background p-4 shadow-lg">
          <h2 className="text-lg font-semibold">Design Options</h2>
          <ul className="flex flex-col gap-2">
            {options.map((opt) => (
              <li key={opt.id}>
                <Button
                  className="w-full justify-start"
                  variant={opt.id === optionId ? 'default' : 'outline'}
                  onClick={() => setOption(opt.id)}
                >
                  {opt.name}
                </Button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
