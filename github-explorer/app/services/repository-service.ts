import { createServerSupabaseClient } from '@/lib/supabase/server';

// Repository data structure
export interface Repository {
  id: string;
  github_id: string;
  name: string;
  full_name?: string;
  description?: string;
  stars?: number;
  forks?: number;
  open_issues_count?: number;
  last_updated?: string;
  created_at?: string;
  url?: string;
  owner?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

// Interface for raw data from Supabase
interface RawRepositoryData {
  id: string;
  github_id: string;
  name: string;
  full_name?: string;
  description?: string;
  stars?: number;
  forks?: number;
  open_issues_count?: number;
  last_updated?: string;
  created_at?: string;
  url?: string;
  owner: Array<{
    id: string;
    username: string;
    avatar_url?: string;
  }>;
}

/**
 * Maps raw repository data from Supabase to our Repository interface
 */
function mapRepositoryData(data: RawRepositoryData): Repository {
  return {
    ...data,
    owner: data.owner?.[0] || undefined
  };
}

/**
 * Retrieves a repository by its GitHub ID
 * @param githubId - The GitHub ID of the repository
 * @returns The repository data or null if not found
 */
export async function getRepositoryByGithubId(githubId: string): Promise<Repository | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('repositories')
    .select(`
      id, 
      github_id, 
      name, 
      full_name, 
      description, 
      stars, 
      forks, 
      open_issues_count, 
      last_updated,
      created_at,
      url,
      owner:owners(id, username, avatar_url)
    `)
    .eq('github_id', githubId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching repository by GitHub ID:', error);
    return null;
  }
  
  return mapRepositoryData(data as RawRepositoryData);
}

/**
 * Retrieves a list of repositories with optional pagination
 * @param limit - Maximum number of repositories to return
 * @param offset - Number of repositories to skip
 * @returns Array of repositories
 */
export async function getRepositories(limit = 10, offset = 0): Promise<Repository[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('repositories')
    .select(`
      id, 
      github_id, 
      name, 
      full_name, 
      description, 
      stars, 
      forks, 
      open_issues_count, 
      last_updated,
      created_at,
      url,
      owner:owners(id, username, avatar_url)
    `)
    .order('stars', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error || !data) {
    console.error('Error fetching repositories:', error);
    return [];
  }
  
  return (data as RawRepositoryData[]).map(mapRepositoryData);
}

/**
 * Retrieves repository statistics
 * @param repositoryId - The ID of the repository
 * @returns Repository statistics or null if not found
 */
export async function getRepositoryStats(repositoryId: string): Promise<any | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('repository_stats')
    .select('*')
    .eq('repository_id', repositoryId)
    .single();
  
  if (error || !data) {
    console.error('Error fetching repository stats:', error);
    return null;
  }
  
  return data;
}

/**
 * Searches repositories by name or description
 * @param query - The search query
 * @param limit - Maximum number of repositories to return
 * @returns Array of repositories matching the search criteria
 */
export async function searchRepositories(query: string, limit = 10): Promise<Repository[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('repositories')
    .select(`
      id, 
      github_id, 
      name, 
      full_name, 
      description, 
      stars, 
      forks, 
      open_issues_count, 
      last_updated,
      created_at,
      url,
      owner:owners(id, username, avatar_url)
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('stars', { ascending: false })
    .limit(limit);
  
  if (error || !data) {
    console.error('Error searching repositories:', error);
    return [];
  }
  
  return (data as RawRepositoryData[]).map(mapRepositoryData);
} 