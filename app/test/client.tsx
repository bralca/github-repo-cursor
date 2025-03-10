'use client'

import { useSupabaseQuery } from '@/lib/supabase/hooks'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function TestClient() {
  // Test client-side fetching with React Query
  const { data, isLoading, isError, error, refetch } = useSupabaseQuery(
    ['test-repositories'],
    async () => {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      return data
    }
  )

  if (isError) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Button onClick={() => refetch()}>
          Refresh Data
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !data?.length ? (
        <div className="p-4 bg-muted rounded-md">
          No repositories found
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map(repo => (
            <div key={repo.id} className="p-4 border rounded-md">
              <h3 className="font-medium">{repo.name}</h3>
              <p className="text-sm text-muted-foreground">{repo.description}</p>
              <div className="mt-2 text-sm">
                ⭐ {repo.stars} • 🍴 {repo.forks}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 