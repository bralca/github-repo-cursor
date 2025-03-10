import { PageLoader } from '@/components/ui/page-transition';
import { Container } from '@/components/ui/container';

export default function Loading() {
  return (
    <Container centered className="min-h-[70vh]">
      <PageLoader />
    </Container>
  );
} 