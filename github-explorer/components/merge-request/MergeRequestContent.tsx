'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  useMergeRequestDetails, 
  useMergeRequestComments,
  useMergeRequestActivity,
  useMergeRequestFiles,
  useMergeRequestCommits,
  type MergeRequestDetails,
  type MergeRequestFile,
  type MergeRequestCommit
} from '@/lib/client/fetchMergeRequestData';
import Link from 'next/link';
import Image from 'next/image';

// Types for tabs
type TabType = 'overview' | 'files' | 'commits' | 'activity';

interface MergeRequestContentProps {
  repositoryGithubId: number;
  mergeRequestGithubId: number;
  initialData?: Partial<MergeRequestDetails>;
}

export default function MergeRequestContent({
  repositoryGithubId,
  mergeRequestGithubId,
  initialData
}: MergeRequestContentProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Fetch data using our custom hooks
  const { data: mergeRequest, loading: loadingMR, error: errorMR } = useMergeRequestDetails(
    repositoryGithubId,
    mergeRequestGithubId,
    initialData
  );
  
  const { comments, loading: loadingComments } = useMergeRequestComments(
    repositoryGithubId,
    mergeRequestGithubId
  );
  
  const { activities, loading: loadingActivities } = useMergeRequestActivity(
    repositoryGithubId,
    mergeRequestGithubId
  );
  
  const { files, loading: loadingFiles } = useMergeRequestFiles(
    repositoryGithubId,
    mergeRequestGithubId
  );
  
  const { commits, loading: loadingCommits } = useMergeRequestCommits(
    repositoryGithubId,
    mergeRequestGithubId
  );
  
  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);
  
  // Show loading state if primary data is loading
  if (loadingMR && !mergeRequest) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-24 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  // Show error state
  if (errorMR || !mergeRequest) {
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
              Error loading merge request data. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <TabButton 
            isActive={activeTab === 'overview'} 
            onClick={() => handleTabChange('overview')}
            label="Overview"
          />
          <TabButton 
            isActive={activeTab === 'files'} 
            onClick={() => handleTabChange('files')}
            label={`Files (${mergeRequest.changed_files})`}
          />
          <TabButton 
            isActive={activeTab === 'commits'} 
            onClick={() => handleTabChange('commits')}
            label={`Commits (${mergeRequest.commits_count})`}
          />
          <TabButton 
            isActive={activeTab === 'activity'} 
            onClick={() => handleTabChange('activity')}
            label="Activity"
          />
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            mergeRequest={mergeRequest} 
            comments={comments}
            loadingComments={loadingComments}
          />
        )}
        
        {activeTab === 'files' && (
          <FilesTab 
            files={files} 
            loading={loadingFiles} 
          />
        )}
        
        {activeTab === 'commits' && (
          <CommitsTab 
            commits={commits} 
            loading={loadingCommits} 
          />
        )}
        
        {activeTab === 'activity' && (
          <ActivityTab 
            activities={activities} 
            loading={loadingActivities} 
          />
        )}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ isActive, onClick, label }: { 
  isActive: boolean; 
  onClick: () => void; 
  label: string;
}) {
  return (
    <button
      className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
        isActive
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// Overview Tab Component
function OverviewTab({ 
  mergeRequest, 
  comments, 
  loadingComments 
}: { 
  mergeRequest: MergeRequestDetails; 
  comments: any[];
  loadingComments: boolean;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <div className="bg-gray-50 p-4 rounded-md">
          {mergeRequest.description ? (
            <p className="whitespace-pre-line">{mergeRequest.description}</p>
          ) : (
            <p className="text-gray-500 italic">No description provided.</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Repository</h3>
            <Link 
              href={`/${mergeRequest.repository.name}-${mergeRequest.repository.github_id}`}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {mergeRequest.repository.full_name}
            </Link>
          </div>
          
          {mergeRequest.author && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Author</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image 
                    src={mergeRequest.author.avatar} 
                    alt={mergeRequest.author.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                </div>
                <div className="ml-2">
                  <Link 
                    href={`/contributors/${mergeRequest.author.name || mergeRequest.author.username}-${mergeRequest.author.username}-${mergeRequest.author.github_id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {mergeRequest.author.name || mergeRequest.author.username}
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Created</h3>
            <p>{format(new Date(mergeRequest.created_at), 'MMM d, yyyy')}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Status</h3>
            <StatusBadge state={mergeRequest.state} />
          </div>
          
          {mergeRequest.merged_by && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Merged by</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Image 
                    src={mergeRequest.merged_by.avatar} 
                    alt={mergeRequest.merged_by.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                </div>
                <div className="ml-2">
                  <Link 
                    href={`/contributors/${mergeRequest.merged_by.name || mergeRequest.merged_by.username}-${mergeRequest.merged_by.username}-${mergeRequest.merged_by.github_id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {mergeRequest.merged_by.name || mergeRequest.merged_by.username}
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Branches</h3>
            <p>
              <span className="font-medium">From:</span> {mergeRequest.source_branch}<br />
              <span className="font-medium">To:</span> {mergeRequest.target_branch}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Changes</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-md text-center">
            <h3 className="font-medium mb-1">Additions</h3>
            <p className="text-2xl text-green-600">+{mergeRequest.additions}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-md text-center">
            <h3 className="font-medium mb-1">Deletions</h3>
            <p className="text-2xl text-red-600">-{mergeRequest.deletions}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md text-center">
            <h3 className="font-medium mb-1">Files</h3>
            <p className="text-2xl text-blue-600">{mergeRequest.changed_files}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        {loadingComments ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <div className="flex-shrink-0">
                    <Image 
                      src={comment.author.avatar} 
                      alt={comment.author.username} 
                      width={24} 
                      height={24} 
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-2">
                    <span className="font-medium">{comment.author.name || comment.author.username}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {format(new Date(comment.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="whitespace-pre-line">{comment.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

// Files Tab Component
function FilesTab({ files, loading }: { files: MergeRequestFile[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-60 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Changed Files</h2>
      {files.length > 0 ? (
        <div className="space-y-4">
          {files.map(file => (
            <div key={file.file_path} className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-mono text-sm flex justify-between">
                <div>
                  <span 
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                      file.status === 'added' ? 'bg-green-100 text-green-800' : 
                      file.status === 'modified' ? 'bg-yellow-100 text-yellow-800' : 
                      file.status === 'deleted' ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {file.status}
                  </span>
                  {file.file_path}
                  {file.status === 'renamed' && (
                    <span className="text-gray-500 ml-2">from {file.previous_path}</span>
                  )}
                </div>
                <div>
                  <span className="text-green-600 mr-2">+{file.additions}</span>
                  <span className="text-red-600">-{file.deletions}</span>
                </div>
              </div>
              {file.patch && (
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre">{file.patch}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">No files changed.</p>
      )}
    </div>
  );
}

// Commits Tab Component
function CommitsTab({ commits, loading }: { commits: MergeRequestCommit[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Commits</h2>
      {commits.length > 0 ? (
        <div className="space-y-4">
          {commits.map(commit => (
            <div key={commit.github_id} className="border rounded-md p-4">
              <div className="flex items-center mb-2">
                <div className="flex-shrink-0">
                  <Image 
                    src={commit.author.avatar} 
                    alt={commit.author.username} 
                    width={24} 
                    height={24} 
                    className="rounded-full"
                  />
                </div>
                <div className="ml-2">
                  <span className="font-medium">{commit.author.name || commit.author.username}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {format(new Date(commit.committed_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <p className="font-medium">{commit.message}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-mono">{commit.github_id.substring(0, 7)}</span>
                <span className="mx-2">•</span>
                <span className="text-green-600">+{commit.additions}</span>
                <span className="mx-1">•</span>
                <span className="text-red-600">-{commit.deletions}</span>
                <span className="mx-1">•</span>
                <span>{commit.changed_files} {commit.changed_files === 1 ? 'file' : 'files'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">No commits found.</p>
      )}
    </div>
  );
}

// Activity Tab Component
function ActivityTab({ activities, loading }: { activities: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Activity Timeline</h2>
      {activities.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {activities.map(activity => (
              <div key={activity.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                  activity.type === 'state_change' ? 'bg-purple-100' : 
                  activity.type === 'commit' ? 'bg-blue-100' : 
                  activity.type === 'review' ? 'bg-green-100' : 
                  activity.type === 'comment' ? 'bg-yellow-100' : 
                  'bg-gray-100'
                }`}>
                  {activity.type === 'state_change' && (
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7.805v2.196a1 1 0 01-2 0V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H16a1 1 0 110 2h-5a1 1 0 01-1-1v-5a1 1 0 112 0v2.5a7.002 7.002 0 01-8.175-3.176 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  )}
                  {activity.type === 'commit' && (
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1 1 0 004 6.82V16a1 1 0 001 1h10a1 1 0 001-1V6.82a1 1 0 00-.604-.925L11 4.323V3a1 1 0 00-1-1zM5.5 7.6a.5.5 0 00-.5.5v2a.5.5 0 001 0V8.1a.5.5 0 00-.5-.5zm6.5.5a.5.5 0 111 0v4a.5.5 0 01-1 0V8.1zm2.5-.5a.5.5 0 00-.5.5v4a.5.5 0 001 0v-4a.5.5 0 00-.5-.5zM9 8.1a.5.5 0 01.5-.5.5.5 0 01.5.5v2a.5.5 0 01-.5.5.5.5 0 01-.5-.5v-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  {activity.type === 'review' && (
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {activity.type === 'comment' && (
                    <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="flex-shrink-0">
                      <Image 
                        src={activity.actor.avatar} 
                        alt={activity.actor.username} 
                        width={24} 
                        height={24} 
                        className="rounded-full"
                      />
                    </div>
                    <div className="ml-2">
                      <span className="font-medium">{activity.actor.name || activity.actor.username}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {format(new Date(activity.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  {activity.type === 'state_change' && (
                    <p>
                      {activity.details.from ? (
                        <>Changed status from <b>{activity.details.from}</b> to <b>{activity.details.to}</b></>
                      ) : (
                        <>Created merge request</>
                      )}
                    </p>
                  )}
                  
                  {activity.type === 'commit' && (
                    <p>
                      Committed: <span className="font-medium">{activity.details.message}</span>
                      <span className="ml-2 text-xs text-gray-500 font-mono">{activity.details.commit_id.substring(0, 7)}</span>
                    </p>
                  )}
                  
                  {activity.type === 'review' && (
                    <p>
                      {activity.details.state === 'approved' ? (
                        <span className="text-green-600">Approved the changes</span>
                      ) : activity.details.state === 'changes_requested' ? (
                        <span className="text-yellow-600">Requested changes</span>
                      ) : (
                        <span>Reviewed the changes</span>
                      )}
                    </p>
                  )}
                  
                  {activity.type === 'comment' && activity.details.content && (
                    <p className="whitespace-pre-line">{activity.details.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic">No activity recorded.</p>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ state }: { state: 'open' | 'closed' | 'merged' }) {
  let bgColor, textColor, label;
  
  switch (state) {
    case 'open':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = 'Open';
      break;
    case 'closed':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      label = 'Closed';
      break;
    case 'merged':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      label = 'Merged';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = state;
  }
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
} 