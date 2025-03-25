// Import common types
import { MergeRequest } from '../types';

// Placeholder for merge-requests database functions
// These functions will be implemented to use the API client

export async function getMergeRequestSEODataByGithubId(
  githubId: string | number, 
  repoId: string | number
): Promise<MergeRequest | null> {
  // In production, this will use API client to fetch from the backend
  console.log('Getting merge request data for:', githubId, 'in repo:', repoId);
  return {
    id: 1,
    github_id: githubId,
    title: 'Merge Request Title',
  };
}