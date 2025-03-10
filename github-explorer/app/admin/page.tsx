import { Container } from '@/components/ui/container';

export const metadata = {
  title: 'Admin Dashboard | GitHub Explorer',
  description: 'Administrative dashboard for GitHub Explorer.',
};

export default function AdminPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="mb-8 text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          This page will display the admin dashboard. To be implemented in future tasks.
        </p>
      </div>
    </Container>
  );
} 