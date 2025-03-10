'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { authState, isAdmin } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Admin Page] Auth state:', authState, 'isAdmin:', isAdmin);
    
    // If authentication check is complete and user is not authenticated, redirect to login
    if (authState === 'unauthenticated') {
      console.log('[Admin Page] User is not authenticated, redirecting to login');
      window.location.href = '/admin/login';
    } else if (authState === 'authenticated') {
      // Authentication check is complete and user is authenticated
      console.log('[Admin Page] User is authenticated, showing admin dashboard');
      setIsLoading(false);
    }
  }, [authState, isAdmin, router]);

  // Show loading state while checking authentication
  if (isLoading || authState === 'loading') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg">Checking authentication...</p>
      </div>
    );
  }

  // Show admin dashboard if authenticated
  return (
    <Container>
      <div className="py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <SignOutButton />
        </div>
        
        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="repositories">Repositories</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pipeline" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Status</CardTitle>
                  <CardDescription>Current status of data pipelines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>GitHub Sync</span>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Data Processing</span>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Enrichment</span>
                      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                        In Progress
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">Last run: 3 hours ago</p>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Actions</CardTitle>
                  <CardDescription>Run and manage data pipelines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full">Run Full Pipeline</Button>
                  <Button variant="outline" className="w-full">Run GitHub Sync Only</Button>
                  <Button variant="outline" className="w-full">Run Enrichment Only</Button>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-muted-foreground">Pipeline runs are logged in the database</p>
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Pipeline Runs</CardTitle>
                <CardDescription>History of recent pipeline executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground">
                    <div>Date</div>
                    <div>Type</div>
                    <div>Status</div>
                    <div>Duration</div>
                  </div>
                  <div className="grid grid-cols-4 text-sm border-t pt-4">
                    <div>2025-03-14 08:30</div>
                    <div>Full Pipeline</div>
                    <div className="text-green-600">Completed</div>
                    <div>15m 32s</div>
                  </div>
                  <div className="grid grid-cols-4 text-sm border-t pt-4">
                    <div>2025-03-13 14:45</div>
                    <div>GitHub Sync</div>
                    <div className="text-green-600">Completed</div>
                    <div>8m 17s</div>
                  </div>
                  <div className="grid grid-cols-4 text-sm border-t pt-4">
                    <div>2025-03-12 20:15</div>
                    <div>Enrichment</div>
                    <div className="text-red-600">Failed</div>
                    <div>2m 41s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="repositories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tracked Repositories</CardTitle>
                <CardDescription>Manage repositories being tracked by the system</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  This section will allow adding, removing, and configuring tracked repositories
                </p>
                <Button>Add Repository</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage access to the admin dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  This section will allow managing users and their access levels
                </p>
                <Button>Add User</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
} 