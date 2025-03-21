/**
 * URL Utility Module
 * 
 * Provides functions for generating and parsing SEO-friendly URLs
 * following the URL architecture defined in DOCS/SEO/URL_ARCHITECTURE.md
 */

/**
 * Maximum length for slugs to prevent overly long URLs
 */
const MAX_SLUG_LENGTH = 50;

/**
 * Repository entity type
 */
export interface Repository {
  id: string;
  github_id: string;
  name: string;
  full_name?: string;
}

/**
 * Contributor entity type
 */
export interface Contributor {
  id: string;
  github_id: string;
  name?: string;
  username?: string;
}

/**
 * Merge Request entity type
 */
export interface MergeRequest {
  id: string;
  github_id: string;
  title: string;
  repository_id: string;
  repository_github_id: string;
}

/**
 * File entity type
 */
export interface File {
  id: string;
  github_id: string;
  filename: string;
}

/**
 * Converts a string to a URL-friendly slug
 * @param input The string to convert to a slug
 * @returns A URL-friendly slug
 */
export function toSlug(input: string): string {
  if (!input) return '';
  
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '')          // Trim hyphens from end
    .substring(0, MAX_SLUG_LENGTH); // Truncate to maximum length
}

/**
 * Extracts a GitHub ID from a slug segment
 * @param slug The slug to extract the GitHub ID from
 * @returns The GitHub ID or null if not found
 */
export function extractGithubId(slug: string): string | null {
  if (!slug) return null;
  
  // Look for a numeric ID or hexadecimal SHA hash at the end of the slug
  const match = slug.match(/-([0-9a-f]+)$/);
  return match ? match[1] : null;
}

/**
 * Validates if a URL has the correct format according to our architecture
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  // Basic validation - we expect URLs to start with /
  if (!url.startsWith('/')) return false;
  
  // Further validation can be added based on specific URL patterns
  return true;
}

/**
 * Combines multiple segments into a URL path
 * @param segments Array of URL segments to combine
 * @returns Combined URL path
 */
export function combinePath(...segments: string[]): string {
  return '/' + segments
    .map(segment => segment.replace(/^\/|\/$/g, '')) // Remove leading/trailing slashes
    .filter(Boolean) // Remove empty segments
    .join('/');
}

// --- Repository URL Functions ---

/**
 * Generates a slug for repository URLs
 * @param name Repository name
 * @param githubId GitHub ID of the repository
 * @returns Repository slug in the format 'repository-name-githubID'
 */
export function generateRepositorySlug(name: string, githubId: string): string {
  if (!name || !githubId) {
    throw new Error('Repository name and GitHub ID are required for slug generation');
  }
  
  const nameSlug = toSlug(name);
  return `${nameSlug}-${githubId}`;
}

/**
 * Extracts information from a repository slug
 * @param slug Repository slug in the format 'repository-name-githubID'
 * @returns Object containing name and githubId, or null if parsing fails
 */
export function parseRepositorySlug(slug: string): { name: string, githubId: string } | null {
  if (!slug) return null;
  
  // Extract GitHub ID - match a numeric ID at the end of the slug
  const match = slug.match(/-(\d+)$/);
  if (!match) return null;
  
  const githubId = match[1];
  
  // Remove the ID part to get the name portion
  const name = slug.replace(new RegExp(`-${githubId}$`), '');
  return { name, githubId };
}

/**
 * Builds a complete URL for a repository
 * @param repository Repository object with name and github_id
 * @returns Complete URL for the repository in the format '/repository-name-githubID'
 */
export function buildRepositoryUrl(repository: Repository): string {
  if (!repository || !repository.name || !repository.github_id) {
    throw new Error('Valid repository object with name and github_id is required');
  }
  
  const slug = generateRepositorySlug(repository.name, repository.github_id);
  return `/${slug}`;
}

// --- Contributor URL Functions ---

/**
 * Generates a slug for contributor URLs
 * @param name Contributor name (optional)
 * @param username Contributor username (optional)
 * @param githubId GitHub ID of the contributor
 * @returns Contributor slug in the format 'name-username-githubID'
 */
export function generateContributorSlug(name: string | undefined, username: string | undefined, githubId: string): string {
  if (!githubId) {
    throw new Error('GitHub ID is required for contributor slug generation');
  }
  
  // Handle cases where name or username might be missing
  const nameSlug = name ? toSlug(name) : 'contributor';
  const usernameSlug = username ? toSlug(username) : '';
  
  // If both name and username are available, combine them
  if (nameSlug && usernameSlug) {
    return `${nameSlug}-${usernameSlug}-${githubId}`;
  }
  
  // If only one is available, use that
  return `${nameSlug || usernameSlug}-${githubId}`;
}

/**
 * Extracts information from a contributor slug
 * @param slug Contributor slug in the format 'name-username-githubID'
 * @returns Object containing name, username and githubId, or null if parsing fails
 */
export function parseContributorSlug(slug: string): { name: string, username: string, githubId: string } | null {
  if (!slug) return null;
  
  // Extract GitHub ID
  const githubId = extractGithubId(slug);
  if (!githubId) return null;
  
  // Remove the GitHub ID from the slug
  const slugWithoutId = slug.replace(new RegExp(`-${githubId}$`), '');
  
  // Split the remaining slug into potential name and username
  const parts = slugWithoutId.split('-');
  
  // Default values
  let name = 'contributor';
  let username = '';
  
  // If we have at least one part, it's the name
  if (parts.length >= 1) {
    name = parts[0];
  }
  
  // If we have multiple parts, the rest could be the username
  if (parts.length >= 2) {
    username = parts.slice(1).join('-');
  }
  
  return { name, username, githubId };
}

/**
 * Builds a complete URL for a contributor
 * @param contributor Contributor object with name, username, and github_id
 * @returns Complete URL for the contributor in the format '/contributors/name-username-githubID'
 */
export function buildContributorUrl(contributor: Contributor): string {
  if (!contributor || !contributor.github_id) {
    throw new Error('Valid contributor object with github_id is required');
  }
  
  const slug = generateContributorSlug(contributor.name, contributor.username, contributor.github_id);
  return `/contributors/${slug}`;
}

// --- Merge Request URL Functions ---

/**
 * Generates a slug for merge request URLs
 * @param title Merge request title
 * @param githubId GitHub ID of the merge request
 * @returns Merge request slug in the format 'merge_request-title-githubid'
 */
export function generateMergeRequestSlug(title: string, githubId: string): string {
  if (!githubId) {
    throw new Error('GitHub ID is required for merge request slug generation');
  }
  
  const titleSlug = title ? toSlug(title) : 'merge-request';
  return `${titleSlug}-${githubId}`;
}

/**
 * Extracts information from a merge request slug
 * @param slug Merge request slug in the format 'merge_request-title-githubid'
 * @returns Object containing title and githubId, or null if parsing fails
 */
export function parseMergeRequestSlug(slug: string): { title: string, githubId: string } | null {
  if (!slug) return null;
  
  // Extract GitHub ID
  const githubId = extractGithubId(slug);
  if (!githubId) return null;
  
  // Remove the ID part to get the title portion
  const title = slug.replace(new RegExp(`-${githubId}$`), '');
  return { title, githubId };
}

/**
 * Builds a complete URL for a merge request
 * @param repository Repository object with name and github_id
 * @param mergeRequest Merge request object with title and github_id
 * @returns Complete URL for the merge request in the format '/repository-name-githubID/merge-requests/merge_request-title-githubid'
 */
export function buildMergeRequestUrl(repository: Repository, mergeRequest: MergeRequest): string {
  if (!repository || !repository.name || !repository.github_id) {
    throw new Error('Valid repository object with name and github_id is required');
  }
  
  if (!mergeRequest || !mergeRequest.title || !mergeRequest.github_id) {
    throw new Error('Valid merge request object with title and github_id is required');
  }
  
  const repoSlug = generateRepositorySlug(repository.name, repository.github_id);
  const mrSlug = generateMergeRequestSlug(mergeRequest.title, mergeRequest.github_id);
  
  return `/${repoSlug}/merge-requests/${mrSlug}`;
}

// --- Commit URL Functions ---

/**
 * Generates a slug for file URLs
 * @param filename File path/name
 * @param githubId GitHub ID of the file
 * @returns File slug in the format 'filename-githubID'
 */
export function generateFileSlug(filename: string, githubId: string): string {
  if (!githubId) {
    throw new Error('GitHub ID is required for file slug generation');
  }
  
  // Convert file paths to URL-friendly format
  // Replace slashes and dots with hyphens for better URL compatibility
  const normalizedFilename = filename.replace(/[\/\.]/g, '-');
  const filenameSlug = toSlug(normalizedFilename);
  
  return `${filenameSlug}-${githubId}`;
}

/**
 * Extracts information from a file slug
 * @param slug File slug in the format 'filename-githubID'
 * @returns Object containing filename and githubId, or null if parsing fails
 */
export function parseFileSlug(slug: string): { filename: string, githubId: string } | null {
  if (!slug) return null;
  
  // Extract GitHub ID
  const githubId = extractGithubId(slug);
  if (!githubId) return null;
  
  // Remove the ID part to get the filename portion
  const filename = slug.replace(new RegExp(`-${githubId}$`), '');
  return { filename, githubId };
}

/**
 * Builds a complete URL for a commit
 * @param repository Repository object
 * @param mergeRequest Merge request object
 * @param contributor Contributor object
 * @param file File object
 * @returns Complete URL for the commit
 */
export function buildCommitUrl(
  repository: Repository,
  mergeRequest: MergeRequest,
  contributor: Contributor,
  file: File
): string {
  if (!repository?.name || !repository?.github_id) {
    throw new Error('Valid repository with name and github_id is required');
  }
  
  if (!mergeRequest?.title || !mergeRequest?.github_id) {
    throw new Error('Valid merge request with title and github_id is required');
  }
  
  if (!contributor?.github_id) {
    throw new Error('Valid contributor with github_id is required');
  }
  
  if (!file?.filename || !file?.github_id) {
    throw new Error('Valid file with filename and github_id is required');
  }
  
  const repoSlug = generateRepositorySlug(repository.name, repository.github_id);
  const mrSlug = generateMergeRequestSlug(mergeRequest.title, mergeRequest.github_id);
  const contributorSlug = generateContributorSlug(contributor.name, contributor.username, contributor.github_id);
  const fileSlug = generateFileSlug(file.filename, file.github_id);
  
  return `/${repoSlug}/merge-requests/${mrSlug}/commits/${contributorSlug}/${fileSlug}`;
} 