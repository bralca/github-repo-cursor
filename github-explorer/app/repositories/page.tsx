import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RepositoriesClient } from './client'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Repositories | GitHub Explorer',
  description: 'Explore GitHub repositories and their activity metrics.',
}

/**
 * Server component for the repositories page
 * Initial data is fetched on the server for SEO and fast initial load
 */
export default async function RepositoriesPage() {
  // Create a server-side Supabase client
  const supabase = createServerSupabaseClient()
  
  // Fetch initial repositories data
  const { data: initialRepositories, error } = await supabase
    .from('repositories')
    .select('*')
    .order('stars', { ascending: false })
    .range(0, 9)
  
  if (error) {
    console.error('Error fetching repositories:', error)
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Repositories</h1>
      <p className="text-muted-foreground mb-8">
        Explore GitHub repositories and their metrics
      </p>
      
      {/* Pass the initial data to the client component */}
      <RepositoriesClient initialRepositories={initialRepositories || []} />
    </div>
  )
} 