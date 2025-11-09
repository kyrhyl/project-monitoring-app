import ProjectDetailsPage from '@/components/ProjectDetailsPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  
  return <ProjectDetailsPage projectId={id} />;
}