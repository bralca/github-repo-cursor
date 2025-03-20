'use client';

import { useState, useEffect } from 'react';
import { 
  useEntityData, 
  useRepositoryData, 
  useContributorData, 
  useMergeRequestData, 
  useCommitData 
} from '@/hooks/entity';
import { EntityLoadingSkeleton, EntityErrorState } from '@/components/shared';

export default function HooksTestPage() {
  const [activeTab, setActiveTab] = useState<string>('entityData');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Entity Hooks Testing Page</h1>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'entityData' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('entityData')}
          >
            useEntityData
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'repositoryData' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('repositoryData')}
          >
            useRepositoryData
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contributorData' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('contributorData')}
          >
            useContributorData
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mergeRequestData' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('mergeRequestData')}
          >
            useMergeRequestData
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'commitData' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('commitData')}
          >
            useCommitData
          </button>
        </nav>
      </div>
      
      {/* Content Sections */}
      <div className="space-y-8">
        {activeTab === 'entityData' && <EntityDataHookTest />}
        {activeTab === 'repositoryData' && <RepositoryDataHookTest />}
        {activeTab === 'contributorData' && <ContributorDataHookTest />}
        {activeTab === 'mergeRequestData' && <MergeRequestDataHookTest />}
        {activeTab === 'commitData' && <CommitDataHookTest />}
      </div>
    </div>
  );
}

// Mock hook state to simulate different states without actual API calls
function useMockHookState<T>(
  initialData?: T, 
  simulateLoading: boolean = false,
  simulateError: boolean = false
) {
  const [isLoading, setIsLoading] = useState(simulateLoading);
  const [data, setData] = useState<T | null>(initialData || null);
  const [error, setError] = useState<Error | null>(
    simulateError ? new Error("Simulated error for testing") : null
  );
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Simulate retry functionality
  const retry = () => {
    setIsRetrying(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // For demo purposes, toggle between success and error on retry
      if (error) {
        setError(null);
        setData(initialData || null);
      } else {
        setError(new Error("Error occurred during retry"));
        setData(null);
      }
      setIsRetrying(false);
    }, 1500);
  };
  
  // Simulate loading delay if needed
  useEffect(() => {
    if (simulateLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (simulateError) {
          setError(new Error("Simulated error after loading"));
        } else {
          setData(initialData || null);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [simulateLoading, simulateError, initialData]);
  
  return { data, isLoading, error, retry, isRetrying };
}

function EntityDataHookTest() {
  const mockData = {
    repository: {
      github_id: 123456,
      name: "react",
      owner: "facebook",
      description: "A JavaScript library for building user interfaces"
    },
    contributor: {
      github_id: 789012,
      name: "John Doe",
      username: "johndoe",
      bio: "Software engineer"
    },
    mergeRequest: {
      github_id: 456789,
      title: "Add new feature",
      description: "This PR adds an exciting new feature"
    },
    commit: {
      sha: "abc123",
      message: "Fix critical bug",
      author_name: "John Doe"
    }
  };
  
  const [entityType, setEntityType] = useState<'repository' | 'contributor' | 'mergeRequest' | 'commit'>('repository');
  const [hookState, setHookState] = useState<'default' | 'loading' | 'error'>('default');
  
  // Use the mock hook state to simulate different states
  const { 
    data, 
    isLoading, 
    error, 
    retry, 
    isRetrying 
  } = useMockHookState(
    mockData[entityType],
    hookState === 'loading',
    hookState === 'error'
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Type
          </label>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as any)}
          >
            <option value="repository">Repository</option>
            <option value="contributor">Contributor</option>
            <option value="mergeRequest">Merge Request</option>
            <option value="commit">Commit</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hook State
          </label>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={hookState}
            onChange={(e) => setHookState(e.target.value as any)}
          >
            <option value="default">Success (Default)</option>
            <option value="loading">Loading</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        {hookState === 'error' && !isLoading && (
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              onClick={() => retry()}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">useEntityData Hook Result</h2>
        
        {isLoading ? (
          <EntityLoadingSkeleton entityType={entityType} />
        ) : error ? (
          <EntityErrorState entityType={entityType} error={error} retry={retry} isRetrying={isRetrying} />
        ) : data ? (
          <div>
            <h3 className="font-semibold mb-2">{entityType} Data</h3>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-gray-500">No data available</div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your component:
const { data, isLoading, error, retry, isRetrying } = useEntityData(
  '${entityType}',
  {
    ${entityType === 'repository' ? 'repositorySlug: "react-facebook-123456",' : ''}
    ${entityType === 'contributor' ? 'contributorSlug: "john-doe-johndoe-789012",' : ''}
    ${entityType === 'mergeRequest' ? 'repositorySlug: "react-facebook-123456", mergeRequestSlug: "add-new-feature-456789",' : ''}
    ${entityType === 'commit' ? 'repositorySlug: "react-facebook-123456", commitSha: "abc123",' : ''}
  }
);

// Then in your JSX:
if (isLoading) {
  return <EntityLoadingSkeleton entityType="${entityType}" />;
}

if (error) {
  return <EntityErrorState entityType="${entityType}" error={error} retry={retry} isRetrying={isRetrying} />;
}

return (
  <div>
    {/* Render your data */}
    <h1>{data.name}</h1>
    {/* ... */}
  </div>
);`}
        </pre>
      </div>
    </div>
  );
}

function RepositoryDataHookTest() {
  const mockRepositoryData = {
    github_id: 123456,
    name: "react",
    owner: "facebook",
    description: "A JavaScript library for building user interfaces",
    stars: 150000,
    forks: 30000,
    url: "https://github.com/facebook/react",
    created_at: "2013-05-24T16:15:54Z",
    updated_at: "2023-03-17T12:34:56Z",
    language: "JavaScript"
  };
  
  const [hookState, setHookState] = useState<'default' | 'loading' | 'error'>('default');
  
  // Use the mock hook state to simulate different states
  const { 
    data, 
    isLoading, 
    error, 
    retry, 
    isRetrying 
  } = useMockHookState(
    mockRepositoryData,
    hookState === 'loading',
    hookState === 'error'
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hook State
          </label>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={hookState}
            onChange={(e) => setHookState(e.target.value as any)}
          >
            <option value="default">Success (Default)</option>
            <option value="loading">Loading</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        {hookState === 'error' && !isLoading && (
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              onClick={() => retry()}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">useRepositoryData Hook Result</h2>
        
        {isLoading ? (
          <EntityLoadingSkeleton entityType="repository" />
        ) : error ? (
          <EntityErrorState entityType="repository" error={error} retry={retry} isRetrying={isRetrying} />
        ) : data ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-xl">{data.name}</h3>
              <p className="text-gray-600">by {data.owner}</p>
            </div>
            
            <p>{data.description}</p>
            
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                ⭐ {data.stars.toLocaleString()} stars
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                🍴 {data.forks.toLocaleString()} forks
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                {data.language}
              </span>
            </div>
            
            <div className="text-sm text-gray-500">
              <div>Created: {new Date(data.created_at).toLocaleDateString()}</div>
              <div>Updated: {new Date(data.updated_at).toLocaleDateString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No repository data available</div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your component:
const { 
  data, 
  isLoading, 
  error, 
  retry, 
  isRetrying 
} = useRepositoryData("react-facebook-123456");

// Then in your JSX:
if (isLoading) {
  return <RepositoryLoadingSkeleton />;
}

if (error) {
  return <EntityErrorState entityType="repository" error={error} retry={retry} isRetrying={isRetrying} />;
}

return (
  <div>
    <h1>{data.name}</h1>
    <p>by {data.owner}</p>
    <p>{data.description}</p>
    {/* ... */}
  </div>
);`}
        </pre>
      </div>
    </div>
  );
}

function ContributorDataHookTest() {
  const mockContributorData = {
    github_id: 789012,
    username: "johndoe",
    name: "John Doe",
    avatar_url: "https://github.com/johndoe.png",
    bio: "Software engineer and open source contributor",
    company: "Example Corp",
    location: "San Francisco, CA",
    repositories: 25,
    contributions: 1250,
    followers: 150,
    following: 75
  };
  
  const [hookState, setHookState] = useState<'default' | 'loading' | 'error'>('default');
  
  // Use the mock hook state to simulate different states
  const { 
    data, 
    isLoading, 
    error, 
    retry, 
    isRetrying 
  } = useMockHookState(
    mockContributorData,
    hookState === 'loading',
    hookState === 'error'
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hook State
          </label>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={hookState}
            onChange={(e) => setHookState(e.target.value as any)}
          >
            <option value="default">Success (Default)</option>
            <option value="loading">Loading</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        {hookState === 'error' && !isLoading && (
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              onClick={() => retry()}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">useContributorData Hook Result</h2>
        
        {isLoading ? (
          <EntityLoadingSkeleton entityType="contributor" />
        ) : error ? (
          <EntityErrorState entityType="contributor" error={error} retry={retry} isRetrying={isRetrying} />
        ) : data ? (
          <div className="flex">
            {data.avatar_url && (
              <img 
                src={data.avatar_url} 
                alt={data.name} 
                className="w-24 h-24 rounded-full mr-6"
              />
            )}
            
            <div>
              <h3 className="font-bold text-xl">{data.name}</h3>
              <p className="text-gray-600">@{data.username}</p>
              
              {data.bio && (
                <p className="my-2">{data.bio}</p>
              )}
              
              <div className="mt-2 space-y-1 text-sm">
                {data.company && (
                  <div>🏢 {data.company}</div>
                )}
                {data.location && (
                  <div>📍 {data.location}</div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  👥 {data.followers} followers
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  🗃️ {data.repositories} repos
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  🛠️ {data.contributions} contributions
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No contributor data available</div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your component:
const { 
  data, 
  isLoading, 
  error, 
  retry, 
  isRetrying 
} = useContributorData("john-doe-johndoe-789012");

// Then in your JSX:
if (isLoading) {
  return <ContributorLoadingSkeleton />;
}

if (error) {
  return <EntityErrorState entityType="contributor" error={error} retry={retry} isRetrying={isRetrying} />;
}

return (
  <div className="flex">
    {data.avatar_url && (
      <img src={data.avatar_url} alt={data.name} className="w-24 h-24 rounded-full mr-6" />
    )}
    <div>
      <h1>{data.name}</h1>
      <p>@{data.username}</p>
      {/* ... */}
    </div>
  </div>
);`}
        </pre>
      </div>
    </div>
  );
}

function MergeRequestDataHookTest() {
  const mockMergeRequestData = {
    github_id: 456789,
    title: "Add new feature",
    number: 1234,
    description: "This PR adds an exciting new feature that improves performance by 50%",
    state: "open",
    repository_name: "react",
    repository_owner: "facebook",
    author_name: "John Doe",
    author_username: "johndoe",
    author_avatar_url: "https://github.com/johndoe.png",
    created_at: "2023-03-10T09:45:32Z",
    updated_at: "2023-03-15T14:22:18Z",
    additions: 520,
    deletions: 85,
    changed_files: 12
  };
  
  const [hookState, setHookState] = useState<'default' | 'loading' | 'error'>('default');
  
  // Use the mock hook state to simulate different states
  const { 
    data, 
    isLoading, 
    error, 
    retry, 
    isRetrying 
  } = useMockHookState(
    mockMergeRequestData,
    hookState === 'loading',
    hookState === 'error'
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hook State
          </label>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={hookState}
            onChange={(e) => setHookState(e.target.value as any)}
          >
            <option value="default">Success (Default)</option>
            <option value="loading">Loading</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        {hookState === 'error' && !isLoading && (
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              onClick={() => retry()}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">useMergeRequestData Hook Result</h2>
        
        {isLoading ? (
          <EntityLoadingSkeleton entityType="mergeRequest" />
        ) : error ? (
          <EntityErrorState entityType="mergeRequest" error={error} retry={retry} isRetrying={isRetrying} />
        ) : data ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  data.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {data.state}
                </span>
                <span className="ml-2 text-gray-500">#{data.number}</span>
              </div>
              <h3 className="font-bold text-xl mt-1">{data.title}</h3>
              <p className="text-gray-600">
                in <span className="font-semibold">{data.repository_owner}/{data.repository_name}</span>
              </p>
            </div>
            
            {data.description && (
              <div className="border-t border-b py-3 my-3">
                <p>{data.description}</p>
              </div>
            )}
            
            <div className="flex items-center">
              {data.author_avatar_url && (
                <img 
                  src={data.author_avatar_url} 
                  alt={data.author_name} 
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <span>
                <span className="font-medium">{data.author_name}</span>
                <span className="text-gray-500"> opened this merge request on </span>
                <span className="text-gray-600">{new Date(data.created_at).toLocaleDateString()}</span>
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                +{data.additions}
              </span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                -{data.deletions}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {data.changed_files} files changed
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No merge request data available</div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your component:
const { 
  data, 
  isLoading, 
  error, 
  retry, 
  isRetrying 
} = useMergeRequestData(
  "react-facebook-123456",
  "add-new-feature-456789"
);

// Then in your JSX:
if (isLoading) {
  return <MergeRequestLoadingSkeleton />;
}

if (error) {
  return <EntityErrorState entityType="mergeRequest" error={error} retry={retry} isRetrying={isRetrying} />;
}

return (
  <div>
    <h1>{data.title}</h1>
    <span className="status">{data.state}</span>
    <p>#{data.number}</p>
    {/* ... */}
  </div>
);`}
        </pre>
      </div>
    </div>
  );
}

function CommitDataHookTest() {
  const mockCommitData = {
    sha: "abc123def456",
    message: "Fix critical bug in render method",
    author_name: "John Doe",
    author_email: "john@example.com",
    author_avatar_url: "https://github.com/johndoe.png",
    committed_date: "2023-03-15T12:34:56Z",
    repository_name: "react",
    repository_owner: "facebook",
    files: [
      {
        filename: "src/render.js",
        status: "modified",
        additions: 15,
        deletions: 8,
        changes: 23,
        patch: "@@ -42,7 +42,14 @@ function render() {\n   // Some code\n-  const result = oldImplementation();\n+  // Fixed implementation with better performance\n+  let result;\n+  \n+  try {\n+    result = newImplementation();\n+  } catch (error) {\n+    console.error('Render error:', error);\n+    result = fallbackImplementation();\n+  }\n   \n   return result;\n }"
      },
      {
        filename: "src/utils.js",
        status: "modified",
        additions: 5,
        deletions: 2,
        changes: 7,
        patch: "@@ -15,8 +15,11 @@ function helper() {\n   // Utility code\n-  return transform(data);\n+  return optimizedTransform(data);\n }"
      }
    ]
  };
  
  const [hookState, setHookState] = useState<'default' | 'loading' | 'error'>('default');
  const [activeFile, setActiveFile] = useState<number>(0);
  
  // Use the mock hook state to simulate different states
  const { 
    data, 
    isLoading, 
    error, 
    retry, 
    isRetrying 
  } = useMockHookState(
    mockCommitData,
    hookState === 'loading',
    hookState === 'error'
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hook State
          </label>
          <select 
            className="border border-gray-300 rounded-md px-3 py-2"
            value={hookState}
            onChange={(e) => setHookState(e.target.value as any)}
          >
            <option value="default">Success (Default)</option>
            <option value="loading">Loading</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        {hookState === 'error' && !isLoading && (
          <div className="flex items-end">
            <button
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              onClick={() => retry()}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
      </div>
      
      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">useCommitData Hook Result</h2>
        
        {isLoading ? (
          <EntityLoadingSkeleton entityType="commit" />
        ) : error ? (
          <EntityErrorState entityType="commit" error={error} retry={retry} isRetrying={isRetrying} />
        ) : data ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg break-all">{data.sha}</h3>
              <p className="font-bold mt-1">{data.message}</p>
            </div>
            
            <div className="flex items-center">
              {data.author_avatar_url && (
                <img 
                  src={data.author_avatar_url} 
                  alt={data.author_name} 
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <div>
                <div className="font-medium">{data.author_name}</div>
                <div className="text-sm text-gray-500">{data.author_email}</div>
              </div>
              <div className="ml-auto text-gray-500 text-sm">
                {new Date(data.committed_date).toLocaleString()}
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Changed Files ({data.files.length})</h4>
              
              <div className="flex border-b mb-4">
                {data.files.map((file, index) => (
                  <button
                    key={index}
                    className={`mr-4 py-2 border-b-2 ${
                      activeFile === index ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
                    }`}
                    onClick={() => setActiveFile(index)}
                  >
                    {file.filename}
                  </button>
                ))}
              </div>
              
              {data.files[activeFile] && (
                <div>
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      data.files[activeFile].status === 'added' ? 'bg-green-100 text-green-800' : 
                      data.files[activeFile].status === 'removed' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {data.files[activeFile].status}
                    </span>
                    <span className="text-sm">
                      <span className="text-green-600">+{data.files[activeFile].additions}</span>
                      {' / '}
                      <span className="text-red-600">-{data.files[activeFile].deletions}</span>
                    </span>
                  </div>
                  
                  {data.files[activeFile].patch && (
                    <div className="bg-gray-50 p-3 rounded font-mono text-sm overflow-auto whitespace-pre-wrap">
                      {data.files[activeFile].patch}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No commit data available</div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your component:
const { 
  data, 
  isLoading, 
  error, 
  retry, 
  isRetrying 
} = useCommitData(
  "react-facebook-123456",
  "abc123def456",
  "src-render-js-789012" // Optional file slug
);

// Then in your JSX:
if (isLoading) {
  return <CommitLoadingSkeleton />;
}

if (error) {
  return <EntityErrorState entityType="commit" error={error} retry={retry} isRetrying={isRetrying} />;
}

return (
  <div>
    <h1>{data.message}</h1>
    <div>SHA: {data.sha}</div>
    <div>Author: {data.author_name}</div>
    {/* ... */}
    
    {/* If you provided a file slug, you can use data.filteredFiles */}
    {data.filteredFiles && data.filteredFiles.map(file => (
      <div key={file.filename}>
        <h2>{file.filename}</h2>
        <pre>{file.patch}</pre>
      </div>
    ))}
  </div>
);`}
        </pre>
      </div>
    </div>
  );
} 