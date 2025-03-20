'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Interface for the repository data
interface RepositoryData {
  id: string;
  github_id: string;
  name: string;
  full_name?: string;
  description?: string;
  stars?: number;
  forks?: number;
  open_issues_count?: number;
  last_updated?: string;
  // Additional fields that might be loaded client-side
  health_percentage?: number;
  primary_language?: string;
  license?: string;
  watchers_count?: number;
  size_kb?: number;
  is_fork?: boolean;
  default_branch?: string;
  owner_id?: string;
}

interface RepositoryContentProps {
  repository: RepositoryData;
}

/**
 * Hook for loading repository data
 * This follows the pattern requested in the implementation plan
 */
function useRepositoryData(initialData: RepositoryData) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<RepositoryData>(initialData);
  const [contributors, setContributors] = useState<any[]>([]);
  const [mergeRequests, setMergeRequests] = useState<any[]>([]);
  const router = useRouter();

  const fetchDetailedData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch data from our API
      // For MVP, we'll simulate loading with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Enhance the repository with additional client-side data
      setRepository({
        ...initialData,
        health_percentage: initialData.health_percentage || 85,
        watchers_count: initialData.watchers_count || (initialData.stars ? Math.floor(initialData.stars * 0.4) : 10),
        size_kb: initialData.size_kb || 1024,
      });
      
      // Mock contributors data
      setContributors([
        { id: '1', name: 'Contributor 1', commits: 40, avatar: null },
        { id: '2', name: 'Contributor 2', commits: 30, avatar: null },
        { id: '3', name: 'Contributor 3', commits: 20, avatar: null },
      ]);
      
      // Mock merge requests data
      setMergeRequests([
        { id: '1', title: 'Add new feature', created_at: new Date(Date.now() - 86400000).toISOString(), merged: true },
        { id: '2', title: 'Fix critical bug', created_at: new Date(Date.now() - 172800000).toISOString(), merged: true },
        { id: '3', title: 'Update documentation', created_at: new Date(Date.now() - 259200000).toISOString(), merged: true },
      ]);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load detailed repository data:', err);
      setError('Failed to load detailed repository data. Please try again later.');
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDetailedData();
  }, [initialData.github_id]);

  // Return all the data and state needed by the component
  return {
    repository,
    contributors,
    mergeRequests,
    loading,
    error,
    refresh: fetchDetailedData
  };
}

/**
 * Client component for rendering detailed repository content
 * This component loads additional data and provides interactive elements
 */
export default function RepositoryContent({ repository: initialData }: RepositoryContentProps) {
  const { 
    repository, 
    contributors, 
    mergeRequests, 
    loading, 
    error, 
    refresh 
  } = useRepositoryData(initialData);

  // Show loading state
  if (loading) {
    return (
      <div className="my-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Repository Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white rounded shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Top Contributors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white rounded shadow animate-pulse flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Merge Requests</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white rounded shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
        <h3 className="font-semibold mb-2">Error Loading Repository Data</h3>
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded transition"
          onClick={refresh}
        >
          Retry
        </button>
      </div>
    );
  }

  // Format a date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Calculate days ago
  const daysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  // Render detailed content
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold mb-4">Repository Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {repository.health_percentage !== undefined && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Health Score</h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-3 mr-2">
                  <div 
                    className={`h-3 rounded-full ${
                      repository.health_percentage > 70 ? 'bg-green-600' : 
                      repository.health_percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${repository.health_percentage}%` }}
                  ></div>
                </div>
                <span className="font-bold">{repository.health_percentage}%</span>
              </div>
            </div>
          )}
          
          {repository.primary_language && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Primary Language</h3>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span>{repository.primary_language}</span>
              </p>
            </div>
          )}
          
          {repository.license && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">License</h3>
              <p className="flex items-center">
                <svg className="w-4 h-4 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd"></path>
                </svg>
                <span>{repository.license}</span>
              </p>
            </div>
          )}
          
          {repository.last_updated && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Last Updated</h3>
              <p>{formatDate(repository.last_updated)}</p>
            </div>
          )}
          
          {repository.size_kb && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Repository Size</h3>
              <p>{(repository.size_kb / 1024).toFixed(2)} MB</p>
            </div>
          )}
          
          {repository.default_branch && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Default Branch</h3>
              <p>{repository.default_branch}</p>
            </div>
          )}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Top Contributors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contributors.map((contributor) => (
            <div key={contributor.id} className="p-6 bg-white rounded-lg shadow-md flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex items-center justify-center text-gray-500">
                {contributor.avatar ? (
                  <img src={contributor.avatar} alt={contributor.name} className="w-full h-full rounded-full" />
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold">{contributor.name}</p>
                <p className="text-sm text-gray-600">{contributor.commits} commits</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <span>View all contributors</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Merge Requests</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mergeRequests.map((mr) => (
                  <tr key={mr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                        {mr.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Merged
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {daysAgo(mr.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6">
          <Link href="#" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <span>View all merge requests</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
} 