'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

interface CommitContentProps {
  repositoryGithubId: number;
  mergeRequestGithubId: number;
  contributorGithubId: number;
  fileGithubId: string;
  initialData?: any;
}

interface CommitData {
  github_id: string;
  message: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  committed_at: string;
  patch?: string;
  repository: {
    id: string;
    name: string;
    full_name: string;
    github_id: number;
  };
  contributor: {
    id: string;
    github_id: number;
    username: string;
    name?: string;
    avatar: string;
  };
  merge_request: {
    id: string;
    github_id: number;
    title: string;
  };
}

export default function CommitContent({
  repositoryGithubId,
  mergeRequestGithubId,
  contributorGithubId,
  fileGithubId,
  initialData
}: CommitContentProps) {
  // In a real implementation, this would fetch data from an API
  // For now, just use the initialData
  const [commit, setCommit] = useState<CommitData>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to render the diff with syntax highlighting
  const renderDiff = useCallback((patch: string | undefined) => {
    if (!patch) return <p className="text-gray-500 italic">No diff available.</p>;
    
    // Simple diff renderer - in a real app, you'd use a library like react-syntax-highlighter
    return (
      <pre className="text-sm font-mono overflow-x-auto bg-gray-50 p-4 rounded-md">
        {patch.split('\n').map((line, index) => {
          if (line.startsWith('+')) {
            return <div key={index} className="bg-green-50 text-green-800">{line}</div>;
          } else if (line.startsWith('-')) {
            return <div key={index} className="bg-red-50 text-red-800">{line}</div>;
          } else if (line.startsWith('@')) {
            return <div key={index} className="bg-blue-50 text-blue-800">{line}</div>;
          } else {
            return <div key={index}>{line}</div>;
          }
        })}
      </pre>
    );
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-64 bg-gray-200 rounded w-full mb-4"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading commit data: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // If no data is available
  if (!commit) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No commit data available.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Commit Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Repository</h3>
              <Link 
                href={`/${commit.repository.name}-${commit.repository.github_id}`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {commit.repository.full_name}
              </Link>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Merge Request</h3>
              <Link 
                href={`/${commit.repository.name}-${commit.repository.github_id}/merge-requests/${commit.merge_request.title}-${commit.merge_request.github_id}`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                {commit.merge_request.title}
              </Link>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Author</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image 
                    src={commit.contributor.avatar} 
                    alt={commit.contributor.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                </div>
                <div className="ml-2">
                  <Link 
                    href={`/contributors/${commit.contributor.name || commit.contributor.username}-${commit.contributor.username}-${commit.contributor.github_id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {commit.contributor.name || commit.contributor.username}
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Date</h3>
              <p>{format(new Date(commit.committed_at), 'MMMM d, yyyy h:mm a')}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Hash</h3>
              <p className="font-mono text-sm">{commit.github_id}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Changes</h3>
              <p>
                <span className="text-green-600 mr-2">+{commit.additions}</span>
                <span className="text-red-600">-{commit.deletions}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">File: {commit.filename}</h2>
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 font-mono text-sm flex justify-between">
              <div>
                <span 
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                    commit.status === 'added' ? 'bg-green-100 text-green-800' : 
                    commit.status === 'modified' ? 'bg-yellow-100 text-yellow-800' : 
                    commit.status === 'deleted' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  {commit.status}
                </span>
                {commit.filename}
              </div>
              <div>
                <span className="text-green-600 mr-2">+{commit.additions}</span>
                <span className="text-red-600">-{commit.deletions}</span>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              {renderDiff(commit.patch)}
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Related Changes</h2>
          <p className="text-gray-500 italic">
            This would display other files changed in the same commit.
          </p>
        </div>
      </div>
    </div>
  );
} 