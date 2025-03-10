import { Container } from '@/components/ui/container';

export const metadata = {
  title: 'Merge Requests | GitHub Explorer',
  description: 'View all GitHub merge requests with detailed analytics.',
};

export default function MergeRequestsPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">Merge Requests</h1>
        <p className="text-muted-foreground">
          This page will display the list of merge requests. To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 