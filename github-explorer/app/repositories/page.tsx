import { Container } from '@/components/ui/container';

export const metadata = {
  title: 'Repositories | GitHub Explorer',
  description: 'View all GitHub repositories with detailed analytics.',
};

export default function RepositoriesPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground">
          This page will display the list of repositories. To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 