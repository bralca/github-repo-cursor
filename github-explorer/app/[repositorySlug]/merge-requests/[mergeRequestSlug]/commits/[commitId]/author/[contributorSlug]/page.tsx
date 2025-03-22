import { redirect } from 'next/navigation';

// Define types for the page props
interface CommitPageProps {
  params: Promise<{
    repositorySlug: string;
    mergeRequestSlug: string;
    contributorSlug: string;
    commitId: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Define metadata generation function (also performs redirect)
export async function generateMetadata({ params }: CommitPageProps) {
  const paramsObj = await params;
  
  // Redirect to the new URL structure: /[repoSlug]/merge-requests/[mrSlug]/authors/[contributorSlug]/commits/[commitId]
  const newPath = `/${paramsObj.repositorySlug}/merge-requests/${paramsObj.mergeRequestSlug}/authors/${paramsObj.contributorSlug}/commits/${paramsObj.commitId}`;
  
  redirect(newPath);
}

/**
 * Commit Page Component - Redirects to the new URL structure
 */
export default async function CommitPage({ params }: CommitPageProps) {
  const paramsObj = await params;
  
  // Redirect to the new URL structure: /[repoSlug]/merge-requests/[mrSlug]/authors/[contributorSlug]/commits/[commitId]
  const newPath = `/${paramsObj.repositorySlug}/merge-requests/${paramsObj.mergeRequestSlug}/authors/${paramsObj.contributorSlug}/commits/${paramsObj.commitId}`;
  
  redirect(newPath);
} 