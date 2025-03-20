'use client';

import { useRouter } from 'next/navigation';

/**
 * Generic error state component
 */
export function GenericErrorState({
  title = 'Error',
  message = 'An unexpected error occurred',
  retry,
  isRetrying = false,
}: {
  title?: string;
  message?: string;
  retry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-red-800 mb-2">
        {title}
      </h3>
      <p className="text-sm text-red-600 mb-4">
        {message}
      </p>
      {retry && (
        <button 
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          onClick={retry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </div>
  );
}

/**
 * Not found error state component
 */
export function NotFoundErrorState({
  entityType = 'Item',
  backRoute = '/',
}: {
  entityType?: string;
  backRoute?: string;
}) {
  const router = useRouter();
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-blue-800 mb-2">
        {`${entityType} Not Found`}
      </h3>
      <p className="text-sm text-blue-600 mb-4">
        {`The ${entityType.toLowerCase()} you are looking for could not be found.`}
      </p>
      <button 
        className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        onClick={() => router.push(backRoute)}
      >
        Go Back
      </button>
    </div>
  );
}

/**
 * Permission denied error state component
 */
export function PermissionDeniedErrorState({
  entityType = 'item',
  backRoute = '/',
}: {
  entityType?: string;
  backRoute?: string;
}) {
  const router = useRouter();
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">
        Permission Denied
      </h3>
      <p className="text-sm text-yellow-600 mb-4">
        {`You don't have permission to access this ${entityType.toLowerCase()}.`}
      </p>
      <button 
        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
        onClick={() => router.push(backRoute)}
      >
        Go Back
      </button>
    </div>
  );
}

/**
 * Entity-specific error state component
 */
export function EntityErrorState({ 
  entityType,
  error,
  retry,
  isRetrying = false,
}: { 
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
  error?: Error | null;
  retry?: () => void;
  isRetrying?: boolean;
}) {
  const entityNames = {
    repository: 'Repository',
    contributor: 'Contributor',
    mergeRequest: 'Merge Request',
    commit: 'Commit',
  };

  const title = `Error Loading ${entityNames[entityType]} Data`;
  const message = error?.message || 'An unexpected error occurred';
  
  return (
    <GenericErrorState 
      title={title}
      message={message}
      retry={retry}
      isRetrying={isRetrying}
    />
  );
} 