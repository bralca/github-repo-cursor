import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { LoadingContainer } from '@/components/ui/page-transition';

export default function Home() {
  return (
    <Container centered size="xl" className="py-8 md:py-12">
      <div className="flex flex-col items-center space-y-8 md:space-y-12 text-center">
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
            Explore GitHub Data with Ease
          </h1>
          <p className="mx-auto max-w-[700px] text-base md:text-lg text-muted-foreground">
            Discover insights about repositories, contributors, merge requests,
            and commits with powerful analytics and visualization tools.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/repositories">
            <Button size="lg">Explore Repositories</Button>
          </Link>
          <Link href="/contributors">
            <Button variant="outline" size="lg">
              View Contributors
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Repositories</CardTitle>
              <CardDescription>
                Track repository performance and health.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>View detailed metrics about repositories, including commit activity, contributor statistics, and code health indicators.</p>
            </CardContent>
            <CardFooter>
              <Link href="/repositories">
                <Button variant="ghost">Explore Repositories</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contributors</CardTitle>
              <CardDescription>
                Analyze developer contributions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Learn about contributors' impact, track their activity over time, and identify top performers across projects.</p>
            </CardContent>
            <CardFooter>
              <Link href="/contributors">
                <Button variant="ghost">View Contributors</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merge Requests</CardTitle>
              <CardDescription>
                Review pull request analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Monitor merge request lifecycle, review times, and merge patterns to improve development workflow.</p>
            </CardContent>
            <CardFooter>
              <Link href="/merge-requests">
                <Button variant="ghost">Check Merge Requests</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Container>
  );
}
