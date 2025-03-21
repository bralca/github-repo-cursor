import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';

interface RepositoryPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params }: RepositoryPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `Repository ${id} | GitHub Explorer`,
    description: `Detailed analytics for repository ${id}.`,
  };
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { id } = await params;
  
  // This is a placeholder that will be replaced with actual data fetching
  // from Supabase in a future task
  
  // Simulate "not found" for demonstration purposes
  if (id === 'not-found') {
    notFound();
  }
  
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">
          Repository: {id}
        </h1>
        <p className="text-muted-foreground">
          This page will display detailed information about repository {id}.
          To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 