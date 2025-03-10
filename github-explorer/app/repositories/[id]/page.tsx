import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';

export function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Repository ${params.id} | GitHub Explorer`,
    description: `Detailed analytics for repository ${params.id}.`,
  };
}

export default function RepositoryPage({ params }: { params: { id: string } }) {
  // This is a placeholder that will be replaced with actual data fetching
  // from Supabase in a future task
  
  // Simulate "not found" for demonstration purposes
  if (params.id === 'not-found') {
    notFound();
  }
  
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">
          Repository: {params.id}
        </h1>
        <p className="text-muted-foreground">
          This page will display detailed information about repository {params.id}.
          To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 