'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, GitCompare } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/compare', label: 'Compare', icon: GitCompare },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main" className="flex h-full w-16 flex-col items-center gap-4 border-r p-4">
      <Link href="/" className="mb-4 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Home">
        CC
      </Link>
      <ul className="flex flex-col gap-3">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-label={label}
              className={cn(
                'flex flex-col items-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                pathname === href && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
