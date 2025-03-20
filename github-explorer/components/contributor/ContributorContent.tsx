'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  useContributorDetails,
  useContributorRepositories,
  useContributorActivities,
  useContributorStats,
  useContributorLanguages,
  ContributorDetailData,
  ContributorRepository,
  ContributorActivity
} from '@/lib/client/fetchContributorData';

// Types for tabs
type TabType = 'overview' | 'repositories' | 'activity' | 'stats';

// Types for activity filters
type ActivityFilterType = 'all' | 'commit' | 'pull_request' | 'review';

interface ContributorContentProps {
  contributor: ContributorDetailData;
}

// Component for rendering contribution chart
function ContributionChart({ data }: { data: Record<string, number> }) {
  const maxValue = Math.max(...Object.values(data));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Contribution Activity</h3>
      <div className="flex items-end h-40 gap-1">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-blue-500 rounded-t" 
              style={{ 
                height: `${(value / maxValue) * 100}%`,
                minHeight: value > 0 ? '4px' : '0'
              }}
            ></div>
            <span className="text-xs mt-1 text-gray-600">{key}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-500 text-center">
        Contribution activity over the past 6 months
      </div>
    </div>
  );
}

// Component for language distribution chart
function LanguageDistributionChart({ languages }: { languages: string[] }) {
  // Create a simple frequency map
  const languageMap: Record<string, number> = {};
  
  languages.forEach(lang => {
    languageMap[lang] = (languageMap[lang] || 0) + 1;
  });

  const colors = {
    'JavaScript': 'bg-yellow-400',
    'TypeScript': 'bg-blue-500',
    'Python': 'bg-green-500',
    'Java': 'bg-orange-500',
    'C#': 'bg-purple-500',
    'HTML': 'bg-red-500',
    'CSS': 'bg-pink-500',
    'Other': 'bg-gray-400'
  } as Record<string, string>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Language Distribution</h3>
      <div className="flex flex-col gap-3">
        {Object.keys(languageMap).map(language => (
          <div key={language} className="flex items-center">
            <div className="w-24 font-medium text-sm">{language}</div>
            <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${colors[language] || 'bg-gray-400'}`}
                style={{ width: `${(languageMap[language] / languages.length) * 100}%` }}
              ></div>
            </div>
            <div className="ml-3 text-sm text-gray-600">
              {Math.round((languageMap[language] / languages.length) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab Navigation Component
function TabNavigation({ activeTab, onChangeTab }: { activeTab: TabType, onChangeTab: (tab: TabType) => void }) {
  const tabs: { id: TabType, label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'repositories', label: 'Repositories' },
    { id: 'activity', label: 'Activity' },
    { id: 'stats', label: 'Statistics' }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex -mb-px space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Activity Filter Component
function ActivityFilter({ 
  activeFilter, 
  onChangeFilter 
}: { 
  activeFilter: ActivityFilterType, 
  onChangeFilter: (filter: ActivityFilterType) => void 
}) {
  const filters: { id: ActivityFilterType, label: string }[] = [
    { id: 'all', label: 'All Activity' },
    { id: 'commit', label: 'Commits' },
    { id: 'pull_request', label: 'Pull Requests' },
    { id: 'review', label: 'Reviews' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onChangeFilter(filter.id)}
          className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${activeFilter === filter.id 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

// Component that can be used to load more items when scrolling
function LoadMoreButton({ onClick, loading, hasMore }: { onClick: () => void, loading: boolean, hasMore: boolean }) {
  if (!hasMore) return <div className="text-center text-gray-500 py-4">No more items to load</div>;
  
  return (
    <div className="flex justify-center mt-4 mb-6">
      <button
        onClick={onClick}
        disabled={loading}
        className={`
          px-4 py-2 rounded-md font-medium
          ${loading 
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}
        `}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          'Load more'
        )}
      </button>
    </div>
  );
}

/**
 * Client component for rendering detailed contributor content
 * This component loads additional data and provides interactive elements
 */
export default function ContributorContent({ contributor: initialData }: ContributorContentProps) {
  // State for tabs and filters
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activityFilter, setActivityFilter] = useState<ActivityFilterType>('all');
  
  // Use data fetching hooks
  const { 
    contributor,
    loading: detailsLoading,
    error: detailsError
  } = useContributorDetails(initialData.github_id, initialData);
  
  const {
    repositories,
    loading: reposLoading,
    error: reposError,
    hasMore: hasMoreRepos,
    loadMore: loadMoreRepos
  } = useContributorRepositories(initialData.github_id);
  
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    hasMore: hasMoreActivities,
    loadMore: loadMoreActivities
  } = useContributorActivities(initialData.github_id, activityFilter);
  
  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useContributorStats(initialData.github_id);
  
  const {
    languages,
    loading: languagesLoading,
    error: languagesError
  } = useContributorLanguages(initialData.github_id);

  // Handle change of activity filter
  useEffect(() => {
    // This will trigger a refetch through the dependency array in the hook
  }, [activityFilter]);

  // Show loading state if all data is loading
  const isInitialLoading = detailsLoading && reposLoading && activitiesLoading && statsLoading && languagesLoading;
  
  if (isInitialLoading) {
    return (
      <div className="my-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Repositories Contributed To</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show error state if any error occurred
  if (detailsError || reposError || activitiesError || statsError || languagesError) {
    const error = detailsError || reposError || activitiesError || statsError || languagesError;
    return (
      <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
        <h3 className="font-semibold mb-2">Error Loading Contributor Data</h3>
        <p>{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded transition"
          onClick={() => window.location.reload()}
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

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'commit':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case 'pull_request':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 10.414V15a1 1 0 102 0v-4.586l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd"></path>
          </svg>
        );
      case 'review':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
          </svg>
        );
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <>
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Contribution Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {contributor?.direct_commits !== undefined && (
                  <div className="p-6 bg-white rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-2">Commits</h3>
                    <p className="text-2xl font-bold">{contributor.direct_commits}</p>
                  </div>
                )}
                
                {contributor?.pull_requests_merged !== undefined && (
                  <div className="p-6 bg-white rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-2">PRs Merged</h3>
                    <p className="text-2xl font-bold">{contributor.pull_requests_merged}</p>
                  </div>
                )}
                
                {contributor?.code_reviews !== undefined && (
                  <div className="p-6 bg-white rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-2">Code Reviews</h3>
                    <p className="text-2xl font-bold">{contributor.code_reviews}</p>
                  </div>
                )}
                
                {contributor?.top_languages && (
                  <div className="p-6 bg-white rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-2">Top Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {contributor.top_languages.map((language, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {contributor?.first_contribution && contributor?.last_contribution && (
                <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
                  <h3 className="font-semibold text-lg mb-2">Contribution Timeline</h3>
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <p className="text-gray-600 text-sm">First Contribution</p>
                      <p className="font-medium">{formatDate(contributor.first_contribution)}</p>
                    </div>
                    
                    <div className="flex-1 mx-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ 
                          width: '100%' 
                        }}
                      ></div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Latest Contribution</p>
                      <p className="font-medium">{formatDate(contributor.last_contribution)}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {!statsLoading && Object.keys(stats).length > 0 && (
                <ContributionChart data={stats} />
              )}
              {!languagesLoading && languages.length > 0 && (
                <LanguageDistributionChart languages={languages} />
              )}
              {(statsLoading || languagesLoading) && (
                <div className="col-span-2 flex justify-center items-center p-10">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
              <ActivityFilter 
                activeFilter={activityFilter} 
                onChangeFilter={setActivityFilter} 
              />
              
              {activitiesLoading && activities.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-10 flex justify-center">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {activities.slice(0, 3).map((activity) => (
                      <li key={activity.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <Link href={activity.url} className="text-blue-600 hover:text-blue-800 font-medium">
                              {activity.title}
                            </Link>
                            <p className="text-sm text-gray-600">
                              in <span className="font-medium">{activity.repository_name}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {daysAgo(activity.date)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {activities.length === 0 && !activitiesLoading && (
                    <div className="p-6 text-center text-gray-500">
                      No {activityFilter === 'all' ? 'recent' : activityFilter} activity found
                    </div>
                  )}
                </div>
              )}
              
              {activities.length > 3 && (
                <div className="mt-4">
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <span>View all activity</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mb-4">Repositories Contributed To</h2>
              
              {reposLoading && repositories.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-10 flex justify-center">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {repositories.slice(0, 2).map((repo) => (
                    <div key={repo.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        <Link href="#" className="text-blue-600 hover:text-blue-800">
                          {repo.full_name}
                        </Link>
                      </h3>
                      {repo.description && (
                        <p className="text-gray-600 mb-4">{repo.description}</p>
                      )}
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Commits:</span> 
                          <span className="font-medium ml-1">{repo.commit_count}</span>
                        </div>
                        {repo.primary_language && (
                          <div>
                            <span className="text-gray-500">Language:</span>
                            <span className="font-medium ml-1">{repo.primary_language}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Last:</span>
                          <span className="font-medium ml-1">{daysAgo(repo.last_contribution_date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {repositories.length > 2 && (
                <div className="mt-6">
                  <button 
                    onClick={() => setActiveTab('repositories')}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <span>View all repositories</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </section>
          </>
        );
        
      case 'repositories':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">Repositories Contributed To</h2>
            
            {reposLoading && repositories.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-10 flex justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {repositories.map((repo) => (
                    <div key={repo.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        <Link href="#" className="text-blue-600 hover:text-blue-800">
                          {repo.full_name}
                        </Link>
                      </h3>
                      {repo.description && (
                        <p className="text-gray-600 mb-4">{repo.description}</p>
                      )}
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-gray-500">Commits:</span> 
                          <span className="font-medium ml-1">{repo.commit_count}</span>
                        </div>
                        {repo.primary_language && (
                          <div>
                            <span className="text-gray-500">Language:</span>
                            <span className="font-medium ml-1">{repo.primary_language}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Last:</span>
                          <span className="font-medium ml-1">{daysAgo(repo.last_contribution_date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <LoadMoreButton 
                  onClick={loadMoreRepos} 
                  loading={reposLoading} 
                  hasMore={hasMoreRepos} 
                />
              </>
            )}
            
            {repositories.length === 0 && !reposLoading && (
              <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-500">
                No repositories found for this contributor
              </div>
            )}
          </section>
        );
        
      case 'activity':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">Activity Timeline</h2>
            <ActivityFilter 
              activeFilter={activityFilter} 
              onChangeFilter={setActivityFilter} 
            />
            
            {activitiesLoading && activities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-10 flex justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {activities.map((activity) => (
                      <li key={activity.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <Link href={activity.url} className="text-blue-600 hover:text-blue-800 font-medium">
                              {activity.title}
                            </Link>
                            <p className="text-sm text-gray-600">
                              in <span className="font-medium">{activity.repository_name}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {daysAgo(activity.date)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  {activities.length === 0 && !activitiesLoading && (
                    <div className="p-6 text-center text-gray-500">
                      No {activityFilter === 'all' ? 'recent' : activityFilter} activity found
                    </div>
                  )}
                </div>
                
                <LoadMoreButton 
                  onClick={loadMoreActivities} 
                  loading={activitiesLoading} 
                  hasMore={hasMoreActivities} 
                />
              </>
            )}
          </section>
        );
        
      case 'stats':
        return (
          <section>
            <h2 className="text-2xl font-bold mb-4">Contribution Statistics</h2>
            
            {(statsLoading || languagesLoading) && (!Object.keys(stats).length || !languages.length) ? (
              <div className="bg-white rounded-lg shadow-md p-10 flex justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {Object.keys(stats).length > 0 && (
                    <ContributionChart data={stats} />
                  )}
                  {languages.length > 0 && (
                    <LanguageDistributionChart languages={languages} />
                  )}
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">Contribution Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{contributor?.direct_commits || 0}</div>
                      <div className="text-sm text-gray-600">Direct Commits</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{contributor?.pull_requests_merged || 0}</div>
                      <div className="text-sm text-gray-600">PRs Merged</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{contributor?.pull_requests_rejected || 0}</div>
                      <div className="text-sm text-gray-600">PRs Rejected</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{contributor?.code_reviews || 0}</div>
                      <div className="text-sm text-gray-600">Code Reviews</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Impact Score Components</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Code Contribution</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Code Review</span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Issue Management</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Documentation</span>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        );
        
      default:
        return <div>Content not found</div>;
    }
  };

  // Render detailed content with tabs
  return (
    <div className="space-y-6">
      <TabNavigation activeTab={activeTab} onChangeTab={setActiveTab} />
      {renderTabContent()}
    </div>
  );
} 