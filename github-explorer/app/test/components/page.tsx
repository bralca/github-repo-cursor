'use client';

import { useState } from 'react';
import { 
  GenericErrorState, 
  NotFoundErrorState, 
  PermissionDeniedErrorState, 
  EntityErrorState,
  GenericLoadingSkeleton,
  RepositoryLoadingSkeleton,
  ContributorLoadingSkeleton,
  MergeRequestLoadingSkeleton,
  CommitLoadingSkeleton,
  EntityLoadingSkeleton
} from '@/components/shared';
import { EntityWrapper } from '@/components/entity';
import { generateEntityMetadata } from '@/components/seo';

export default function ComponentsTestPage() {
  const [activeTab, setActiveTab] = useState<string>('errorStates');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Components Testing Page</h1>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'errorStates' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('errorStates')}
          >
            Error States
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'loadingStates' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('loadingStates')}
          >
            Loading States
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'entityWrapper' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('entityWrapper')}
          >
            Entity Wrapper
          </button>
          <button 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'seoMetadata' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('seoMetadata')}
          >
            SEO Metadata
          </button>
        </nav>
      </div>
      
      {/* Content Sections */}
      <div className="space-y-8">
        {activeTab === 'errorStates' && <ErrorStatesTest />}
        {activeTab === 'loadingStates' && <LoadingStatesTest />}
        {activeTab === 'entityWrapper' && <EntityWrapperTest />}
        {activeTab === 'seoMetadata' && <SEOMetadataTest />}
      </div>
    </div>
  );
}

function ErrorStatesTest() {
  const [activeErrorState, setActiveErrorState] = useState<string>('generic');
  const mockError = new Error('This is a test error message');
  
  const handleRetry = () => {
    console.log('Retry action triggered');
    alert('Retry action triggered');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Error State Components</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className={`px-3 py-1.5 rounded ${
              activeErrorState === 'generic' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveErrorState('generic')}
          >
            Generic Error
          </button>
          <button 
            className={`px-3 py-1.5 rounded ${
              activeErrorState === 'notFound' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveErrorState('notFound')}
          >
            Not Found Error
          </button>
          <button 
            className={`px-3 py-1.5 rounded ${
              activeErrorState === 'permissionDenied' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveErrorState('permissionDenied')}
          >
            Permission Denied
          </button>
          <button 
            className={`px-3 py-1.5 rounded ${
              activeErrorState === 'entity' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveErrorState('entity')}
          >
            Entity Error
          </button>
        </div>
      </div>
      
      <div className="border p-6 rounded-lg">
        {activeErrorState === 'generic' && (
          <GenericErrorState 
            title="Something went wrong" 
            message="An error occurred while processing your request."
            retry={handleRetry}
            isRetrying={false}
          />
        )}
        
        {activeErrorState === 'notFound' && (
          <NotFoundErrorState 
            entityType="Repository" 
          />
        )}
        
        {activeErrorState === 'permissionDenied' && (
          <PermissionDeniedErrorState />
        )}
        
        {activeErrorState === 'entity' && (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Repository Error</h3>
              <EntityErrorState 
                entityType="repository"
                error={mockError}
                retry={handleRetry}
                isRetrying={false}
              />
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Contributor Error</h3>
              <EntityErrorState 
                entityType="contributor"
                error={mockError}
                retry={handleRetry}
                isRetrying={false}
              />
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Merge Request Error</h3>
              <EntityErrorState 
                entityType="mergeRequest"
                error={mockError}
                retry={handleRetry}
                isRetrying={false}
              />
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Commit Error</h3>
              <EntityErrorState 
                entityType="commit"
                error={mockError}
                retry={handleRetry}
                isRetrying={false}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// Generic Error State
<GenericErrorState 
  title="Something went wrong" 
  message="An error occurred while processing your request."
  retry={handleRetry}
  isRetrying={false}
/>

// Not Found Error State
<NotFoundErrorState 
  entityType="Repository" 
/>

// Permission Denied Error State
<PermissionDeniedErrorState />

// Entity Error State
<EntityErrorState 
  entityType="repository" // or "contributor", "mergeRequest", "commit"
  error={error}
  retry={handleRetry}
  isRetrying={false}
/>`}
        </pre>
      </div>
    </div>
  );
}

function LoadingStatesTest() {
  const [activeEntityType, setActiveEntityType] = useState<
    'repository' | 'contributor' | 'mergeRequest' | 'commit'
  >('repository');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Loading State Components</h2>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            className={`px-3 py-1.5 rounded ${
              activeEntityType === 'repository' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveEntityType('repository')}
          >
            Repository
          </button>
          <button 
            className={`px-3 py-1.5 rounded ${
              activeEntityType === 'contributor' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveEntityType('contributor')}
          >
            Contributor
          </button>
          <button 
            className={`px-3 py-1.5 rounded ${
              activeEntityType === 'mergeRequest' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveEntityType('mergeRequest')}
          >
            Merge Request
          </button>
          <button 
            className={`px-3 py-1.5 rounded ${
              activeEntityType === 'commit' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveEntityType('commit')}
          >
            Commit
          </button>
        </div>
      </div>
      
      <div className="border p-6 rounded-lg">
        <EntityLoadingSkeleton entityType={activeEntityType} />
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// Entity Loading Skeleton
<EntityLoadingSkeleton 
  entityType="${activeEntityType}" // "repository", "contributor", "mergeRequest", or "commit"
/>`}
        </pre>
      </div>
    </div>
  );
}

function EntityWrapperTest() {
  // Mock data for repositories and contributors
  const mockRepositoryData = {
    name: "react",
    description: "A JavaScript library for building user interfaces",
    owner: "facebook",
    stars: 150000,
    forks: 30000
  };
  
  const mockContributorData = {
    name: "John Doe",
    username: "johndoe",
    avatar_url: "https://github.com/johndoe.png",
    bio: "Software engineer and open source contributor"
  };
  
  const mockMergeRequestData = {
    title: "Add new feature",
    number: 1234,
    state: "open",
    description: "This PR adds an exciting new feature"
  };
  
  const mockCommitData = {
    sha: "abc123def456",
    message: "Fix critical bug in render method",
    author_name: "John Doe"
  };
  
  const [entityType, setEntityType] = useState<
    'repository' | 'contributor' | 'mergeRequest' | 'commit'
  >('repository');
  
  const [hasError, setHasError] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(true);
  
  // Get mock data based on entity type
  const getMockData = () => {
    switch(entityType) {
      case 'repository':
        return mockRepositoryData;
      case 'contributor':
        return mockContributorData;
      case 'mergeRequest':
        return mockMergeRequestData;
      case 'commit':
        return mockCommitData;
    }
  };
  
  // Mock rendering component for each entity type
  const EntityContent = ({ data }: { data: any }) => {
    switch(entityType) {
      case 'repository':
        return (
          <div>
            <h3 className="text-xl font-bold">{data.name}</h3>
            <p className="text-gray-600">by {data.owner}</p>
            <p className="my-2">{data.description}</p>
            <div className="flex space-x-3 mt-3">
              <span>⭐ {data.stars.toLocaleString()}</span>
              <span>🍴 {data.forks.toLocaleString()}</span>
            </div>
          </div>
        );
      
      case 'contributor':
        return (
          <div className="flex">
            {data.avatar_url && (
              <img 
                src={data.avatar_url} 
                alt={data.name}
                className="w-16 h-16 rounded-full mr-4" 
              />
            )}
            <div>
              <h3 className="text-xl font-bold">{data.name}</h3>
              <p className="text-gray-600">@{data.username}</p>
              {data.bio && <p className="mt-2">{data.bio}</p>}
            </div>
          </div>
        );
      
      case 'mergeRequest':
        return (
          <div>
            <div className="flex items-center">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                data.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {data.state}
              </span>
              <span className="ml-2 text-gray-500">#{data.number}</span>
            </div>
            <h3 className="text-xl font-bold mt-1">{data.title}</h3>
            {data.description && <p className="mt-2">{data.description}</p>}
          </div>
        );
      
      case 'commit':
        return (
          <div>
            <h3 className="text-lg font-medium break-all">{data.sha}</h3>
            <p className="font-bold mt-1">{data.message}</p>
            <p className="text-gray-600 mt-2">Author: {data.author_name}</p>
          </div>
        );
      
      default:
        return <p>Unknown entity type</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">EntityWrapper Component</h2>
        
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
              Component State
            </label>
            <div className="flex items-center space-x-4 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600"
                  checked={hasInitialData}
                  onChange={() => setHasInitialData(!hasInitialData)}
                />
                <span className="ml-2">Has initial data</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600"
                  checked={hasError}
                  onChange={() => setHasError(!hasError)}
                />
                <span className="ml-2">Has error</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border p-6 rounded-lg">
        <EntityWrapper
          entityType={entityType}
          slug="example-slug"
          initialData={hasInitialData ? getMockData() : undefined}
          skipFetch={true}
        >
          {(data) => <EntityContent data={data} />}
        </EntityWrapper>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your component:
import { EntityWrapper } from '@/components/entity';
import { useEntityData } from '@/hooks/entity';

// Inside component:
const { 
  data, 
  isLoading, 
  error, 
  retry, 
  isRetrying 
} = useEntityData('${entityType}', { 
  ${entityType === 'repository' ? 'repositorySlug: "react-facebook-123456"' : ''}
  ${entityType === 'contributor' ? 'contributorSlug: "john-doe-johndoe-789012"' : ''}
  ${entityType === 'mergeRequest' ? 'repositorySlug: "react-facebook-123456", mergeRequestSlug: "add-new-feature-456789"' : ''}
  ${entityType === 'commit' ? 'repositorySlug: "react-facebook-123456", commitSha: "abc123def456"' : ''}
});

// In your JSX:
return (
  <EntityWrapper
    entityType="${entityType}"
    slug="example-slug"
    initialData={data}
    isLoading={isLoading}
    error={error}
    retry={retry}
    isRetrying={isRetrying}
  >
    {(data) => (
      <div>
        {/* Render your entity content here */}
        <h1>{data.name}</h1>
        {/* ... */}
      </div>
    )}
  </EntityWrapper>
);`}
        </pre>
      </div>
    </div>
  );
}

function SEOMetadataTest() {
  const [entityType, setEntityType] = useState<
    'repository' | 'contributor' | 'mergeRequest' | 'commit'
  >('repository');
  
  // Mock data for SEO metadata generation
  const mockData: Record<string, any> = {
    repository: {
      name: "react",
      owner: "facebook",
      description: "A JavaScript library for building user interfaces"
    },
    contributor: {
      name: "John Doe",
      username: "johndoe",
      bio: "Software engineer and open source contributor"
    },
    mergeRequest: {
      title: "Add new feature",
      repository_name: "react",
      repository_owner: "facebook",
      description: "This PR adds an exciting new feature"
    },
    commit: {
      message: "Fix critical bug in render method",
      repository_name: "react",
      repository_owner: "facebook",
      sha: "abc123def456"
    }
  };
  
  const metadata = generateEntityMetadata({
    entityType: entityType,
    data: mockData[entityType]
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">SEO Metadata Generation</h2>
        
        <div className="mb-6">
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
      </div>
      
      <div className="border p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Generated Metadata</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Title</h4>
            <p className="bg-gray-50 p-2 rounded">{typeof metadata.title === 'string' ? metadata.title : String(metadata.title)}</p>
          </div>
          
          <div>
            <h4 className="font-medium">Description</h4>
            <p className="bg-gray-50 p-2 rounded">{typeof metadata.description === 'string' ? metadata.description : String(metadata.description)}</p>
          </div>
          
          <div>
            <h4 className="font-medium">Open Graph / Twitter Card Data</h4>
            <div className="bg-gray-50 p-2 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(metadata.openGraph, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Example</h3>
        <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-auto">
{`// In your page.tsx file:
import { Metadata } from 'next';
import { generateEntityMetadata } from '@/components/seo';
import { getRepositoryBaseDataBySlug } from '@/lib/database/repositories';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { repositorySlug } = params;
  
  // Fetch the data for SEO
  const repository = await getRepositoryBaseDataBySlug(repositorySlug);
  
  // If not found, return basic metadata
  if (!repository) {
    return {
      title: 'Repository Not Found',
      description: 'The requested repository could not be found.'
    };
  }
  
  // Generate metadata using the utility
  return generateEntityMetadata('repository', repository);
}

// Then in your page component:
export default function RepositoryPage({ params }) {
  // ... your page implementation
}`}
        </pre>
      </div>
    </div>
  );
} 