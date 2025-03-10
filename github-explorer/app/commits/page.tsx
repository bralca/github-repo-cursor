import { Container } from '@/components/ui/container';

export const metadata = {
  title: 'Commits | GitHub Explorer',
  description: 'View all GitHub commits with detailed analytics.',
};

export default function CommitsPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">Commits</h1>
        <p className="text-muted-foreground">
          This page will display the list of commits. To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 