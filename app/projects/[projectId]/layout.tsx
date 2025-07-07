import type { ReactNode } from 'react'

// Remove static generation to allow dynamic rendering
// export async function generateStaticParams() {
//   const caller = appRouter.createCaller({})
//   const projects = await caller.projects()
//   return projects.map(p => ({ projectId: p.id }))
// }

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return children
}
