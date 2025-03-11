'use client';

import { useState } from 'react';
import { useRepositories, useTopRepositories, useRepository } from '@/hooks/use-repositories';
import { useContributors, useTopContributors } from '@/hooks/use-contributors';
import { useMergeRequests, useRecentMergeRequests } from '@/hooks/use-merge-requests';
import { useCommits, useRecentCommits } from '@/hooks/use-commits';

export default function HooksTestPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(undefined);
  
  // Test repository hooks
  const repositories = useRepositories(page, pageSize);
  const topRepositories = useTopRepositories(3);
  const selectedRepository = useRepository(selectedRepoId);
  
  // Test contributor hooks
  const contributors = useContributors(page, pageSize);
  const topContributors = useTopContributors(3);
  
  // Test merge request hooks
  const mergeRequests = useMergeRequests(page, pageSize);
  const recentMergeRequests = useRecentMergeRequests(3);
  
  // Test commit hooks
  const commits = useCommits(page, pageSize);
  const recentCommits = useRecentCommits(3);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Data Access Hooks Test</h1>
      
      {/* Repositories Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Repositories</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Top Repositories</h3>
          {topRepositories.isLoading ? (
            <p>Loading top repositories...</p>
          ) : topRepositories.error ? (
            <p className="text-red-500">Error: {topRepositories.error.message}</p>
          ) : (
            <ul className="space-y-2">
              {topRepositories.data?.map(repo => (
                <li 
                  key={repo.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRepoId(repo.id)}
                >
                  <div className="font-medium">{repo.name}</div>
                  <div className="text-sm text-gray-500">{repo.description}</div>
                  <div className="text-sm mt-1">
                    <span className="mr-4">⭐ {repo.stars}</span>
                    <span>🍴 {repo.forks}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">All Repositories (Paginated)</h3>
          {repositories.isLoading ? (
            <p>Loading repositories...</p>
          ) : repositories.error ? (
            <p className="text-red-500">Error: {repositories.error.message}</p>
          ) : (
            <>
              <ul className="space-y-2 mb-4">
                {repositories.data?.data.map(repo => (
                  <li 
                    key={repo.id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRepoId(repo.id)}
                  >
                    <div className="font-medium">{repo.name}</div>
                    <div className="text-sm text-gray-500">{repo.description}</div>
                    <div className="text-sm mt-1">
                      <span className="mr-4">⭐ {repo.stars}</span>
                      <span>🍴 {repo.forks}</span>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">
                    Page {page} of {repositories.data?.totalPages || 1}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= (repositories.data?.totalPages || 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        {selectedRepoId && (
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">Selected Repository</h3>
            {selectedRepository.isLoading ? (
              <p>Loading repository details...</p>
            ) : selectedRepository.error ? (
              <p className="text-red-500">Error: {selectedRepository.error.message}</p>
            ) : selectedRepository.data ? (
              <div className="p-4 border rounded-lg">
                <h4 className="text-lg font-semibold">{selectedRepository.data.name}</h4>
                <p className="text-gray-700 my-2">{selectedRepository.data.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p><span className="font-medium">Owner:</span> {selectedRepository.data.owner}</p>
                    <p><span className="font-medium">Language:</span> {selectedRepository.data.language || 'Not specified'}</p>
                    <p><span className="font-medium">Created:</span> {new Date(selectedRepository.data.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Stars:</span> {selectedRepository.data.stars}</p>
                    <p><span className="font-medium">Forks:</span> {selectedRepository.data.forks}</p>
                    <p><span className="font-medium">Open Issues:</span> {selectedRepository.data.open_issues}</p>
                  </div>
                </div>
                <button 
                  className="mt-4 px-3 py-1 bg-gray-200 rounded"
                  onClick={() => setSelectedRepoId(undefined)}
                >
                  Close
                </button>
              </div>
            ) : (
              <p>No repository found</p>
            )}
          </div>
        )}
      </section>
      
      {/* Contributors Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Contributors</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Top Contributors</h3>
          {topContributors.isLoading ? (
            <p>Loading top contributors...</p>
          ) : topContributors.error ? (
            <p className="text-red-500">Error: {topContributors.error.message}</p>
          ) : (
            <ul className="space-y-2">
              {topContributors.data?.map(contributor => (
                <li key={contributor.id} className="p-4 border rounded-lg">
                  <div className="flex items-center">
                    {contributor.avatar && (
                      <img 
                        src={contributor.avatar} 
                        alt={contributor.username} 
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <div className="font-medium">{contributor.name || contributor.username}</div>
                      <div className="text-sm text-gray-500">@{contributor.username}</div>
                    </div>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="mr-4">Repositories: {contributor.repositories || 0}</span>
                    <span>Commits: {contributor.direct_commits || 0}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      
      {/* Merge Requests Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Merge Requests</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Recent Merge Requests</h3>
          {recentMergeRequests.isLoading ? (
            <p>Loading recent merge requests...</p>
          ) : recentMergeRequests.error ? (
            <p className="text-red-500">Error: {recentMergeRequests.error.message}</p>
          ) : (
            <ul className="space-y-2">
              {recentMergeRequests.data?.map(mr => (
                <li key={mr.id} className="p-4 border rounded-lg">
                  <div className="font-medium">{mr.title}</div>
                  <div className="text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded text-white ${
                      mr.state === 'open' ? 'bg-green-500' : 
                      mr.state === 'merged' ? 'bg-purple-500' : 'bg-red-500'
                    }`}>
                      {mr.state}
                    </span>
                    <span className="ml-2 text-gray-500">
                      #{mr.number} opened on {new Date(mr.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      
      {/* Commits Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Commits</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Recent Commits</h3>
          {recentCommits.isLoading ? (
            <p>Loading recent commits...</p>
          ) : recentCommits.error ? (
            <p className="text-red-500">Error: {recentCommits.error.message}</p>
          ) : (
            <ul className="space-y-2">
              {recentCommits.data?.map(commit => (
                <li key={commit.id} className="p-4 border rounded-lg">
                  <div className="font-medium truncate">{commit.title}</div>
                  <div className="text-sm mt-1 text-gray-500">
                    <span>{commit.author_name || commit.author}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(commit.date).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono text-xs">{commit.hash.substring(0, 7)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
} 