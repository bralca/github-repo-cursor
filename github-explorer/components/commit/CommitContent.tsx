'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useCommitDetails, useCommitDiff, useCommitRelated, useCommitFiles, CommitFile } from '@/lib/client/fetchCommitData';

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
    filename: string; // Keeping for backward compatibility, but we'll use files array
  };
  repositorySlug: string;
  mergeRequestSlug: string;
  contributorSlug: string;
  fileSlug: string; // This will contain the commit ID
}

// Updated version of the props with commitId instead of fileSlug
interface CommitContentPropsV2 {
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
    filename: string; // Keeping for backward compatibility
  };
  repositorySlug: string;
  mergeRequestSlug: string;
  contributorSlug: string;
  commitId?: string; // New prop for commit ID
  fileSlug?: string; // Optional for backward compatibility
}

type TabType = 'code' | 'metadata' | 'related';

// Type guard to check if we have a commitId or fileSlug
function isCommitContentPropsV2(props: CommitContentProps | CommitContentPropsV2): props is CommitContentPropsV2 {
  return 'commitId' in props;
}

// Main component can work with either prop set for backward compatibility
export default function CommitContent(props: CommitContentProps | CommitContentPropsV2) {
  const {
    initialData,
    repositorySlug,
    mergeRequestSlug,
    contributorSlug,
  } = props;
  
  const fileSlug = 'fileSlug' in props ? props.fileSlug : undefined;
  const commitId = isCommitContentPropsV2(props) ? props.commitId : undefined;
  
  const [activeTab, setActiveTab] = useState<TabType>('code');
  const [selectedFile, setSelectedFile] = useState<string>(initialData.filename);
  
  // Use file slug as commit ID if commitId is not provided directly
  const commitSHA = commitId || fileSlug || '';
  
  // Fetch commit files
  const {
    data: fileList,
    isLoading: filesLoading,
    error: filesError
  } = useCommitFiles(
    initialData.repository.github_id,
    commitSHA
  );
  
  // Update the selected file if we get files from the API
  useEffect(() => {
    if (fileList && fileList.length > 0 && !selectedFile) {
      setSelectedFile(fileList[0].filename);
    }
  }, [fileList, selectedFile]);

  // Fetch commit diff for the selected file
  const {
    data: diffData, 
    isLoading: diffLoading, 
    error: diffError
  } = useCommitDiff(
    initialData.repository.github_id,
    commitSHA,
    selectedFile || initialData.filename
  );
  
  // Fetch commit metadata
  const {
    data: commitDetails,
    isLoading: detailsLoading,
    error: detailsError
  } = useCommitDetails(
    initialData.repository.github_id,
    commitSHA
  );
  
  // Fetch related commits
  const {
    data: relatedCommits,
    isLoading: relatedLoading,
    error: relatedError
  } = useCommitRelated(
    initialData.repository.github_id,
    initialData.commit.sha
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

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

  // Loading component for any async data
  const LoadingState = () => (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <p className="ml-3">Loading...</p>
    </div>
  );

  // Error component for any failed data fetching
  const ErrorState = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
      <div className="flex">
        <svg className="h-5 w-5 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>{message || 'An error occurred while loading data.'}</p>
      </div>
    </div>
  );

  // Tab navigation component
  const TabNavigation = () => (
    <div className="border-b border-gray-200 mb-4">
      <nav className="-mb-px flex space-x-8">
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

  // File selection component (new)
  const FileSelector = () => {
    if (filesLoading) return <LoadingState />;
    if (filesError) return <ErrorState message="Failed to load files for this commit" />;
    
    if (!fileList || fileList.length === 0) {
      return <p>No files found for this commit.</p>;
    }
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Files Changed ({fileList.length})</h3>
        <div className="bg-gray-50 rounded-md p-2 border border-gray-200 max-h-64 overflow-y-auto">
          {fileList.map((file: CommitFile) => {
            const status = getStatusInfo(file.status);
            return (
              <button
                key={file.filename}
                onClick={() => setSelectedFile(file.filename)}
                className={`w-full text-left mb-1 px-3 py-2 rounded flex items-center ${
                  selectedFile === file.filename ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${status.dotColor} mr-2`}></span>
                <span className={`text-xs font-medium ${status.textColor} ${status.bgColor} px-2 py-1 rounded mr-2`}>
                  {status.text}
                </span>
                <span className="truncate flex-1">{file.filename}</span>
                <span className="text-xs text-gray-500 ml-2">
                  +{file.additions || 0} -{file.deletions || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Code diff viewer component
  const CodeDiffViewer = () => {
    if (diffLoading) return <LoadingState />;
    if (diffError) return <ErrorState message="Failed to load code diff" />;
    
    if (!diffData || !diffData.patch) {
      return (
        <div className="bg-white rounded-md shadow p-6">
          <p>No code diff is available for this file.</p>
        </div>
      );
    }
    
    // Show the file selector first, then the selected file diff
    return (
      <div>
        <FileSelector />
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <h3 className="font-medium">{selectedFile || initialData.filename}</h3>
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
            {diffData.patch}
          </pre>
        </div>
      </div>
    );
  };

  // Commit metadata component
  const CommitMetadata = () => {
    if (detailsLoading) return <LoadingState />;
    if (detailsError) return <ErrorState message="Failed to load commit details" />;
    
    const details = commitDetails || initialData.commit;
    const contributor = initialData.contributor;
    
    return (
      <div className="bg-white rounded-md shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Commit Details</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">SHA</h4>
              <p className="font-mono text-sm truncate">{details.sha}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">Date</h4>
              <p>{formatDate(details.committed_at)}</p>
              <p className="text-sm text-gray-500">{formatRelativeTime(details.committed_at)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">Message</h4>
              <p>{details.message}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-500">Author</h4>
              <div className="flex items-center mt-1">
                {contributor.avatar && (
                  <Image
                    src={contributor.avatar}
                    alt={contributor.name || contributor.username || 'Author'}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                )}
                <span>
                  {contributor.name || contributor.username || 'Unknown author'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <h4 className="text-sm font-medium text-gray-500">Files Changed</h4>
              <p className="text-2xl font-semibold text-gray-800">
                {fileList?.length || details.changed_files || '?'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <h4 className="text-sm font-medium text-gray-500">Additions</h4>
              <p className="text-2xl font-semibold text-green-600">+{details.additions || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md text-center">
              <h4 className="text-sm font-medium text-gray-500">Deletions</h4>
              <p className="text-2xl font-semibold text-red-600">-{details.deletions || 0}</p>
            </div>
          </div>
        </div>
        
        {details.complexity_score !== null && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Complexity</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-500">Complexity Score</h4>
                <div className={`text-sm font-medium px-2 py-1 rounded ${
                  details.complexity_score > 70 ? 'bg-red-100 text-red-800' :
                  details.complexity_score > 40 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {details.complexity_score > 70 ? 'High' :
                   details.complexity_score > 40 ? 'Medium' : 'Low'}
                </div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    details.complexity_score > 70 ? 'bg-red-600' :
                    details.complexity_score > 40 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${details.complexity_score}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Score: {details.complexity_score}/100
              </p>
            </div>
          </div>
        )}
        
        {/* File list in metadata view */}
        <div className="mb-6">
          <FileSelector />
        </div>
      </div>
    );
  };

  // Related commits component
  const RelatedCommits = () => {
    if (relatedLoading) return <LoadingState />;
    if (relatedError) return <ErrorState message="Failed to load related commits" />;
    
    if (!relatedCommits || relatedCommits.length === 0) {
      return (
        <div className="bg-white rounded-md shadow p-6">
          <p>No related commits found.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-md shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Related Commits</h2>
          <div className="divide-y divide-gray-200">
            {relatedCommits.map((commit) => (
              <div key={commit.sha} className="py-4">
                <div className="flex items-start">
                  {commit.author_avatar && (
                    <Image
                      src={commit.author_avatar}
                      alt={commit.author_name || 'Author'}
                      width={40}
                      height={40}
                      className="rounded-full mr-4"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{commit.message}</h3>
                    <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                      <span className="mr-3">{commit.author_name || 'Unknown author'}</span>
                      <span className="mr-3">{formatRelativeTime(commit.committed_at)}</span>
                      <span className="font-mono text-xs truncate">{commit.sha.substring(0, 7)}</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-green-600 mr-2">+{commit.additions || 0}</span>
                      <span className="text-red-600 mr-2">-{commit.deletions || 0}</span>
                      <span className="text-gray-500">{commit.changed_files || 1} file(s) changed</span>
                    </div>
                  </div>
                  <div>
                    <Link
                      href={`/${repositorySlug}/merge-requests/${mergeRequestSlug}/authors/${commit.author_slug || contributorSlug}/commits/${commit.sha}`}
                      className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Commit header */}
      <div className="bg-white rounded-md shadow mb-6 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
          <h1 className="text-2xl font-bold mb-2 lg:mb-0">
            {initialData.commit.message}
          </h1>
          <div className="text-sm text-gray-600">
            <span className="inline-block mr-4">
              Committed {formatRelativeTime(initialData.commit.committed_at)}
            </span>
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {initialData.commit.sha.substring(0, 7)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center mb-4">
          <div className="flex items-center mr-6 mb-2">
            {initialData.contributor.avatar && (
              <Image
                src={initialData.contributor.avatar}
                alt={initialData.contributor.name || initialData.contributor.username || 'Author'}
                width={32}
                height={32}
                className="rounded-full mr-2"
              />
            )}
            <div>
              <div className="font-medium">
                {initialData.contributor.name || initialData.contributor.username || 'Unknown author'}
              </div>
              <div className="text-sm text-gray-500">Author</div>
            </div>
          </div>
          
          <div className="mr-6 mb-2">
            <div className="font-medium">{initialData.repository.name}</div>
            <div className="text-sm text-gray-500">Repository</div>
          </div>
          
          <div className="mb-2">
            <div className="font-medium truncate max-w-xs">
              {initialData.mergeRequest.title}
            </div>
            <div className="text-sm text-gray-500">Pull Request</div>
          </div>
        </div>
        
        <div className="flex flex-wrap -mx-2">
          <div className="px-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
              {fileList?.length || initialData.commit.changed_files || 1} file{(fileList?.length || initialData.commit.changed_files || 1) !== 1 ? 's' : ''} changed
            </span>
          </div>
          <div className="px-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800">
              +{initialData.commit.additions || 0}
            </span>
          </div>
          <div className="px-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-800">
              -{initialData.commit.deletions || 0}
            </span>
          </div>
        </div>
      </div>
      
      {/* Tab navigation and content */}
      <TabNavigation />
      
      {activeTab === 'code' && <CodeDiffViewer />}
      {activeTab === 'metadata' && <CommitMetadata />}
      {activeTab === 'related' && <RelatedCommits />}
    </div>
  );
} 