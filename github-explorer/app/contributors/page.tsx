import { Container } from '@/components/ui/container';

export const metadata = {
  title: 'Contributors | GitHub Explorer',
  description: 'View all GitHub contributors with detailed analytics.',
};

export default function ContributorsPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">Contributors</h1>
        <p className="text-muted-foreground">
          This page will display the list of contributors. To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 