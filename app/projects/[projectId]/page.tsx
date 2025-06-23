import ProjectPageClient from './ProjectPageClient'
import { appRouter } from '@/lib/mock-router'

export async function generateStaticParams() {
  const caller = appRouter.createCaller({})
  const projects = await caller.projects()
  return projects.map((p) => ({ projectId: p.id }))
}

interface ProjectPageProps {
  params: { projectId: string }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <ProjectPageClient projectId={params.projectId} />
}
