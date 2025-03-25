import { NextResponse } from 'next/server';
import { getCommitFiles } from '@/lib/server-api/commits';

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

    // Get all files changed in the commit using the server API
    const files = await getCommitFiles(repositoryId, commitId);

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files found for this commit' },
        { status: 404 }
      );
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching commit files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commit files' },
      { status: 500 }
    );
  }
} 