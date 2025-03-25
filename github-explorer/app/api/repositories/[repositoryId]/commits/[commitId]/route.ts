import { NextResponse } from 'next/server';
import { getCommitByRepositoryAndSha } from '@/lib/server-api/commits';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ repositoryId: string; commitId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { repositoryId, commitId } = resolvedParams;

    // Validate params
    if (!repositoryId || !commitId) {
      return NextResponse.json(
        { error: 'Repository ID and Commit ID are required' },
        { status: 400 }
      );
    }

    // Get commit details using the server API
    const commitDetails = await getCommitByRepositoryAndSha(repositoryId, commitId);

    if (!commitDetails) {
      return NextResponse.json(
        { error: 'Commit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(commitDetails);
  } catch (error) {
    console.error('Error fetching commit details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commit details' },
      { status: 500 }
    );
  }
} 