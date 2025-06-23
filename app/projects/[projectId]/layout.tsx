import type { ReactNode } from 'react'
import { appRouter } from '@/lib/mock-router'

export async function generateStaticParams() {
  const caller = appRouter.createCaller({})
  const projects = await caller.projects()
  return projects.map(p => ({ projectId: p.id }))
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children
}
