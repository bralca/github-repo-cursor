import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { TestClient } from './client'

export const metadata: Metadata = {
  title: 'Supabase Integration Test | GitHub Explorer',
  description: 'Test page for verifying Supabase integration',
}

export default async function TestPage() {
  const supabase = createServerSupabaseClient()
  
  // Test server-side fetching
  const { data: serverRepositories, error: serverError } = await supabase
    .from('repositories')
    .select('*')
    .limit(3)
  
  if (serverError) {
    console.error('Server-side fetch error:', serverError)
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Supabase Integration Test</h1>
      
      <div className="space-y-8">
        {/* Server-side fetched data */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Server-Side Fetched Data</h2>
          {serverError ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              Error: {serverError.message}
            </div>
          ) : !serverRepositories?.length ? (
            <div className="p-4 bg-muted rounded-md">
              No repositories found. Make sure your database has the repositories table with data.
            </div>
          ) : (
            <div className="grid gap-4">
              {serverRepositories.map(repo => (
                <div key={repo.id} className="p-4 border rounded-md">
                  <h3 className="font-medium">{repo.name}</h3>
                  <p className="text-sm text-muted-foreground">{repo.description || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Client-side component with React Query */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Client-Side Fetched Data</h2>
          <TestClient />
        </section>
      </div>
    </div>
  )
} 