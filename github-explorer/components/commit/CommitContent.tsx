'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useCommitDetails, useCommitDiff, useCommitRelated } from '@/lib/client/fetchCommitData';

// Types for the props and component state
interface CommitContentProps {
  initialData: {
    commit: {
      id: string;
      github_id: string;
      sha: string;
      message: string;
      committed_at: string;
      additions: number;
      deletions: number;
      changed_files?: number;
      complexity_score: number | null;
    };
    repository: {
      id: string;
      github_id: string;
      name: string;
      full_name?: string;
    };
    contributor: {
      id: string;
      github_id: string;
      name?: string;
      username?: string;
      avatar?: string;
    };
    mergeRequest: {
      id: string;
      github_id: string;
      title: string;
    };
    filename: string;
  };
  repositorySlug: string;
  mergeRequestSlug: string;
  contributorSlug: string;
  fileSlug: string;
}

type TabType = 'code' | 'metadata' | 'related';

export default function CommitContent({
  initialData,
  repositorySlug,
  mergeRequestSlug,
  contributorSlug,
  fileSlug
}: CommitContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('code');
  
  // Use custom hooks for data fetching
  const { 
    data: commitDetails, 
    isLoading: isLoadingDetails, 
    error: detailsError 
  } = useCommitDetails(
    initialData.repository.github_id, 
    initialData.commit.sha
  );
  
  const { 
    data: commitDiff, 
    isLoading: isLoadingDiff, 
    error: diffError 
  } = useCommitDiff(
    initialData.repository.github_id, 
    initialData.commit.sha,
    initialData.filename
  );
  
  const { 
    data: relatedCommits, 
    isLoading: isLoadingRelated, 
    error: relatedError 
  } = useCommitRelated(
    initialData.repository.github_id, 
    initialData.mergeRequest.github_id
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get status display information
  const getStatusInfo = (status: string = 'modified') => {
    switch (status.toLowerCase()) {
      case 'added':
        return { text: 'Added', bgColor: 'bg-green-100', textColor: 'text-green-800', dotColor: 'bg-green-600' };
      case 'modified':
        return { text: 'Modified', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', dotColor: 'bg-yellow-600' };
      case 'deleted':
        return { text: 'Deleted', bgColor: 'bg-red-100', textColor: 'text-red-800', dotColor: 'bg-red-600' };
      default:
        return { text: 'Changed', bgColor: 'bg-blue-100', textColor: 'text-blue-800', dotColor: 'bg-blue-600' };
    }
  };

  // The file status (using commitDiff or a default)
  const fileStatus = commitDiff?.status || 'modified';
  const statusInfo = getStatusInfo(fileStatus);

  // Loading state component
  const LoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
      <h3 className="text-lg font-medium">Error loading data</h3>
      <p>{message}</p>
      <button 
        className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  // Tab navigation component
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8">
        <button
          onClick={() => setActiveTab('code')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'code'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Code Changes
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'metadata'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Commit Details
        </button>
        <button
          onClick={() => setActiveTab('related')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'related'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Related Commits
        </button>
      </nav>
    </div>
  );

  // Code diff component with syntax highlighting
  const CodeDiffViewer = () => {
    if (isLoadingDiff) return <LoadingState />;
    if (diffError) return <ErrorState message="Failed to load code diff" />;
    
    if (!commitDiff || !commitDiff.patch) {
      return (
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
          <p className="text-gray-600">No diff available for this file.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-hidden rounded-md border border-gray-200">
        <div className="bg-gray-50 py-2 px-4 border-b border-gray-200 flex justify-between items-center">
          <span className="font-mono text-sm text-gray-600">{initialData.filename}</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            <span className={`w-2 h-2 ${statusInfo.dotColor} rounded-full mr-1`}></span>
            {statusInfo.text}
          </span>
        </div>
        <div className="bg-white overflow-x-auto">
          <pre className="p-4 text-sm text-gray-800 font-mono whitespace-pre-wrap">
            {commitDiff.patch}
          </pre>
        </div>
      </div>
    );
  };

  // Commit metadata component
  const CommitMetadata = () => {
    if (isLoadingDetails) return <LoadingState />;
    if (detailsError) return <ErrorState message="Failed to load commit details" />;
    
    return (
      <div className="space-y-6">
        <div className="bg-white shadow overflow-hidden rounded-md">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Commit Information</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">SHA</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{initialData.commit.sha.substring(0, 7)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Committed</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(initialData.commit.committed_at)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Author</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/contributors/${contributorSlug}`} className="text-blue-600 hover:underline">
                    {initialData.contributor.name || initialData.contributor.username || `User #${initialData.contributor.github_id}`}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Repository</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/${repositorySlug}`} className="text-blue-600 hover:underline">
                    {initialData.repository.full_name || initialData.repository.name}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Merge Request</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/${repositorySlug}/merge-requests/${mergeRequestSlug}`} className="text-blue-600 hover:underline">
                    {initialData.mergeRequest.title}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Message</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{initialData.commit.message}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">File</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{initialData.filename}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Changes</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="text-green-600">+{initialData.commit.additions}</span>
                  {' / '}
                  <span className="text-red-600">-{initialData.commit.deletions}</span>
                </dd>
              </div>
              {initialData.commit.complexity_score !== null && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Complexity Score</dt>
                  <dd className="mt-1 text-sm text-gray-900">{initialData.commit.complexity_score}/10</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    );
  };

  // Related commits component
  const RelatedCommits = () => {
    if (isLoadingRelated) return <LoadingState />;
    if (relatedError) return <ErrorState message="Failed to load related commits" />;
    
    if (!relatedCommits || relatedCommits.length === 0) {
      return (
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
          <p className="text-gray-600">No related commits found for this merge request.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Related Commits in This Merge Request</h3>
        <div className="overflow-hidden rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {relatedCommits.map(commit => (
              <li key={commit.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {commit.contributor_avatar && (
                      <Image 
                        src={commit.contributor_avatar} 
                        alt="" 
                        width={40} 
                        height={40}
                        className="rounded-full" 
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${repositorySlug}/merge-requests/${mergeRequestSlug}/commits/${
                        commit.contributor_slug || 'unknown-contributor'
                      }/${commit.file_slug || 'unknown-file'}`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {commit.message.split('\n')[0]}
                    </Link>
                    <p className="text-sm text-gray-500 truncate">
                      By {commit.contributor_name || commit.contributor_username || 'Unknown'} 
                      {' • '} 
                      <span className="font-mono">{commit.sha.substring(0, 7)}</span> 
                      {' • '} 
                      {formatRelativeTime(commit.committed_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    <span className="text-green-600">+{commit.additions}</span>
                    {' / '}
                    <span className="text-red-600">-{commit.deletions}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Commit header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          {initialData.contributor.avatar && (
            <Image 
              src={initialData.contributor.avatar} 
              alt="" 
              width={40} 
              height={40} 
              className="rounded-full mr-4"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{initialData.commit.message.split('\n')[0]}</h1>
            <p className="text-gray-600">
              Committed {formatRelativeTime(initialData.commit.committed_at)} by{' '}
              <Link href={`/contributors/${contributorSlug}`} className="text-blue-600 hover:underline">
                {initialData.contributor.name || initialData.contributor.username || `User #${initialData.contributor.github_id}`}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-mono mr-4">{initialData.commit.sha.substring(0, 10)}</span>
          <span className="mr-4">
            <span className="text-green-600">+{initialData.commit.additions}</span>
            {' / '}
            <span className="text-red-600">-{initialData.commit.deletions}</span>
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            <span className={`w-2 h-2 ${statusInfo.dotColor} rounded-full mr-1`}></span>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Tab navigation */}
      <TabNavigation />

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'code' && <CodeDiffViewer />}
        {activeTab === 'metadata' && <CommitMetadata />}
        {activeTab === 'related' && <RelatedCommits />}
      </div>
    </div>
  );
} 