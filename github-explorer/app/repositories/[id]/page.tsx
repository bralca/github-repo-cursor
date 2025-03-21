import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';

export async function generateMetadata({ params }: { params: { id: string } }) {
  // Await params before using them to avoid NextJS errors
  const resolvedParams = await Promise.resolve(params);
  
  return {
    title: `Repository ${resolvedParams.id} | GitHub Explorer`,
    description: `Detailed analytics for repository ${resolvedParams.id}.`,
  };
}

export default async function RepositoryPage({ params }: { params: { id: string } }) {
  // Await params before using them to avoid NextJS errors
  const resolvedParams = await Promise.resolve(params);
  
  // This is a placeholder that will be replaced with actual data fetching
  // from Supabase in a future task
  
  // Simulate "not found" for demonstration purposes
  if (resolvedParams.id === 'not-found') {
    notFound();
  }
  
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">
          Repository: {resolvedParams.id}
        </h1>
        <p className="text-muted-foreground">
          This page will display detailed information about repository {resolvedParams.id}.
          To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 