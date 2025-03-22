'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, ArrowDown, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableHead, TableCell } from '@/components/ui/table';
import { generateContributorSlug, generateRepositorySlug, generateMergeRequestSlug } from '@/lib/url-utils';
import { Avatar } from '@/components/ui/avatar';

// Interfaces for type safety
interface ContributorRanking {
  id: string;
  contributor_id: string;
  contributor_github_id: string;
  rank_position: number;
  username: string;
  name?: string;
  avatar?: string;
  total_score: number;
  code_volume_score: number;
  code_efficiency_score: number;
  commit_impact_score: number;
  collaboration_score: number;
  repo_popularity_score: number;
  repo_influence_score: number;
  followers_score: number;
  profile_completeness_score: number;
  followers_count: number;
  repositories_contributed: number;
  raw_commits_count: number;
  raw_lines_added: number;
  raw_lines_removed: number;
  calculation_timestamp: string;
  location?: string;
  twitter_username?: string;
  top_languages?: string; // JSON string of top languages
  most_popular_repository?: {
    name: string;
    full_name: string;
    url: string;
    stars: number;
    github_id?: string;
  }
  most_collaborative_merge_request?: {
    id?: string;
    github_id?: string;
    title: string;
    repository_url: string;
    repository_name?: string;
    repository_github_id?: string;
    collaborators: {
      id: string;
      github_id: string;
      name: string;
      username: string;
      avatar: string;
    }[];
    collaborator_count: number;
  }
}

type Timeframe = '24h' | '7d' | '30d' | 'all';

// Mock data for initial development
const mockRankings: ContributorRanking[] = [];

// Avatar component with fallback
function AvatarImage({ src, alt }: { src?: string, alt: string }) {
  // Use a colored div with initials as fallback
  const initials = alt
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Generate a random but consistent color based on the initials
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];
  const colorIndex = initials.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex] || 'bg-gray-500';

  if (!src) {
    return (
      <div className={`${bgColor} h-full w-full flex items-center justify-center text-white font-semibold`}>
        {initials || '?'}
      </div>
    );
  }

  // If there's a src, still attempt to load the image
  return (
    <Image 
      src={src} 
      alt={alt} 
      fill 
      className="object-cover"
    />
  );
}

// Language badges component
function LanguageBadges({ languages }: { languages?: string | string[] }) {
  // If no languages or empty array, return null
  if (!languages) return null;
  
  // If languages is a string (JSON), parse it
  const languageArray = typeof languages === 'string' 
    ? JSON.parse(languages) as string[] 
    : languages;
  
  // If empty array after parsing, return null
  if (!languageArray || languageArray.length === 0) return null;
  
  // Language color mapping
  const languageColors: Record<string, string> = {
    JavaScript: 'bg-yellow-100 text-yellow-800',
    TypeScript: 'bg-blue-100 text-blue-800',
    Python: 'bg-green-100 text-green-800',
    Java: 'bg-orange-100 text-orange-800',
    'C#': 'bg-purple-100 text-purple-800',
    PHP: 'bg-indigo-100 text-indigo-800',
    Ruby: 'bg-red-100 text-red-800',
    Go: 'bg-cyan-100 text-cyan-800',
    Rust: 'bg-amber-100 text-amber-800',
    Swift: 'bg-pink-100 text-pink-800',
    Kotlin: 'bg-violet-100 text-violet-800',
    // Default color for other languages
    default: 'bg-gray-100 text-gray-800'
  };

  // Show up to 3 languages, with a +X more for others
  const displayLimit = 2;
  const visibleLanguages = languageArray.slice(0, displayLimit);
  const remaining = languageArray.length - displayLimit;
  
  return (
    <div className="flex gap-1 flex-wrap">
      {visibleLanguages.map((lang, index) => (
        <span 
          key={index}
          className={`text-xs px-1.5 py-0.5 rounded ${languageColors[lang] || languageColors.default}`}
        >
          {lang}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

// Metrics visualization component 
function MetricsVisualization({ 
  codeVolume, 
  codeEfficiency, 
  commitImpact, 
  repoInfluence,
  collaboration,
  repoPopularity
}: { 
  codeVolume?: number;
  codeEfficiency?: number; 
  commitImpact?: number;
  repoInfluence?: number;
  collaboration?: number;
  repoPopularity?: number;
}) {
  // Define colors for each metric
  const colors = {
    codeVolume: 'bg-blue-500',
    codeEfficiency: 'bg-purple-500',
    commitImpact: 'bg-green-500',
    collaboration: 'bg-pink-500',
    repoPopularity: 'bg-yellow-500',
    repoInfluence: 'bg-orange-500'
  };

  // Function to normalize score (cap at 100)
  const normalizeScore = (score?: number) => Math.min(score || 0, 100);

  // Create array of metrics
  const metrics = [
    { key: 'codeVolume', name: 'Volume', value: normalizeScore(codeVolume), color: colors.codeVolume, tooltip: 'Amount of code contributed' },
    { key: 'codeEfficiency', name: 'Efficiency', value: normalizeScore(codeEfficiency), color: colors.codeEfficiency, tooltip: 'How efficiently code moves from commit to final PR' },
    { key: 'commitImpact', name: 'Impact', value: normalizeScore(commitImpact), color: colors.commitImpact, tooltip: 'Frequency and impact of commits' },
    { key: 'collaboration', name: 'Team', value: normalizeScore(collaboration), color: colors.collaboration, tooltip: 'How often they work with other developers' },
    { key: 'repoPopularity', name: 'Popularity', value: normalizeScore(repoPopularity), color: colors.repoPopularity, tooltip: 'Contributes to popular repositories (stars/forks)' },
    { key: 'repoInfluence', name: 'Influence', value: normalizeScore(repoInfluence), color: colors.repoInfluence, tooltip: 'Influence across different repositories' },
  ];

  return (
    <div className="flex items-end h-10 space-x-1">
      {metrics.map((metric) => (
        <div key={metric.key} className="flex flex-col items-center group relative">
          <div 
            className={`${metric.color} rounded-t w-4`} 
            style={{ height: `${metric.value * 0.35}px` }} 
          />
          <span className="text-xs text-gray-500 mt-1">{metric.name}</span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-36">
            <p>{metric.tooltip}</p>
            <p>Score: {metric.value.toFixed(0)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Custom hook for contributor rankings
function useContributorRankings() {
  const [rankings, setRankings] = useState<ContributorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchRankings() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/sqlite/contributor-rankings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'get_latest',
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch rankings');
        }
        
        const data = await response.json();
        setRankings(data.rankings || []);
      } catch (err: any) {
        console.error('Error fetching contributor rankings:', err);
        setError(err.message || 'An error occurred while fetching rankings');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRankings();
  }, []);
  
  const getPopularitySpotlight = () => {
    if (!rankings || rankings.length === 0) return null;
    return rankings.filter(r => r.most_popular_repository).sort((a, b) => b.repo_popularity_score - a.repo_popularity_score)[0];
  };

  const getCollaborationSpotlight = () => {
    if (!rankings || rankings.length === 0) return null;
    return rankings.sort((a, b) => b.collaboration_score - a.collaboration_score)[0];
  };

  const getInfluenceSpotlight = () => {
    if (!rankings || rankings.length === 0) return null;
    return rankings.sort((a, b) => (b.repo_influence_score || 0) - (a.repo_influence_score || 0))[0];
  };

  return {
    rankings,
    isLoading,
    error,
    getPopularitySpotlight,
    getCollaborationSpotlight,
    getInfluenceSpotlight
  };
}

export default function HomePage() {
  const [showHighlights, setShowHighlights] = useState(true);
  const { rankings, isLoading, error, getPopularitySpotlight, getCollaborationSpotlight, getInfluenceSpotlight } = useContributorRankings();
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  const toggleExpandedRow = (id: string) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((i) => i !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };
  
  return (
    <div className="container py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold">Developer Rankings and Analytics</h1>
            <p className="text-muted-foreground">
              TOP Contributors ranked by development impact score
              <Link href="/about" className="text-primary ml-2 underline">
                Read more
          </Link>
            </p>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <span className="mr-2 text-sm">Highlights</span>
            <Switch 
              checked={showHighlights} 
              onCheckedChange={setShowHighlights} 
            />
          </div>
        </div>
      </header>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Star Magnet Card */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <div className="p-1.5 bg-yellow-50 rounded-full border border-yellow-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                </svg>
              </div>
              <h3 className="ml-2 font-bold text-base text-gray-900">Star Magnet</h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-16">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {getPopularitySpotlight() ? (
                  <>
                    <div className="flex items-center mb-3">
                      <Link 
                        href={`/contributors/${generateContributorSlug(
                          getPopularitySpotlight()?.name || '', 
                          getPopularitySpotlight()?.username || '', 
                          getPopularitySpotlight()?.contributor_github_id || ''
                        )}`}
                        className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200"
                      >
                        <AvatarImage 
                          src={getPopularitySpotlight()?.avatar} 
                          alt={getPopularitySpotlight()?.name || 'Developer'} 
                        />
                      </Link>
                      <div className="ml-3">
                        <Link 
                          href={`/contributors/${generateContributorSlug(
                            getPopularitySpotlight()?.name || '', 
                            getPopularitySpotlight()?.username || '', 
                            getPopularitySpotlight()?.contributor_github_id || ''
                          )}`}
                          className="font-bold text-sm text-gray-900 hover:underline"
                        >
                          {getPopularitySpotlight()?.name || getPopularitySpotlight()?.username}
                        </Link>
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-yellow-600">{getPopularitySpotlight()?.repo_popularity_score?.toFixed(1) || '0'}</span>
                          <span className="text-xs ml-1 text-gray-500">Popularity Score</span>
                        </div>
                      </div>
                    </div>
                    
                    {getPopularitySpotlight()?.most_popular_repository && (
                      <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                        <div className="text-xs font-medium text-gray-500 mb-1">Top Repository</div>
                        
                        <Link 
                          href={`/${generateRepositorySlug(
                            getPopularitySpotlight()?.most_popular_repository?.name || 'repository',
                            getPopularitySpotlight()?.most_popular_repository?.github_id || '0'
                          )}`}
                          className="text-sm font-bold text-gray-900 hover:underline block"
                        >
                          {getPopularitySpotlight()?.most_popular_repository?.name || 'Repository'}
              </Link>
                        
                        <div className="flex items-center mt-1">
                          <div className="flex items-center text-xs font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                            </svg>
                            <span className="text-yellow-600">
                              {getPopularitySpotlight()?.most_popular_repository?.stars?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500 italic">
                      Creates work that people love to use and share
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No developer data available
                  </div>
                )}
              </>
            )}
          </div>
          </Card>

        {/* Team Catalyst Card */}
        <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <div className="p-1.5 bg-purple-50 rounded-full border border-purple-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="ml-2 font-bold text-base text-gray-900">Team Catalyst</h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-16">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {getCollaborationSpotlight() ? (
                  <>
                    <div className="flex items-center mb-3">
                      <Link 
                        href={`/contributors/${generateContributorSlug(
                          getCollaborationSpotlight()?.name || '', 
                          getCollaborationSpotlight()?.username || '', 
                          getCollaborationSpotlight()?.contributor_github_id || ''
                        )}`}
                        className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200"
                      >
                        <AvatarImage 
                          src={getCollaborationSpotlight()?.avatar} 
                          alt={getCollaborationSpotlight()?.name || 'Developer'} 
                        />
                      </Link>
                      <div className="ml-3">
                        <Link 
                          href={`/contributors/${generateContributorSlug(
                            getCollaborationSpotlight()?.name || '', 
                            getCollaborationSpotlight()?.username || '', 
                            getCollaborationSpotlight()?.contributor_github_id || ''
                          )}`}
                          className="font-bold text-sm text-gray-900 hover:underline"
                        >
                          {getCollaborationSpotlight()?.name || getCollaborationSpotlight()?.username}
                        </Link>
                        <div className="flex items-center">
                          <span className="text-lg font-bold text-purple-600">{getCollaborationSpotlight()?.collaboration_score?.toFixed(1) || '0'}</span>
                          <span className="text-xs ml-1 text-gray-500">Collaboration Score</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                      <div className="text-xs font-medium text-gray-500 mb-1">Most Collaborative Merge Request</div>
                      
                      {getCollaborationSpotlight()?.most_collaborative_merge_request ? (
                        <>
                          <Link 
                            href={`/${generateRepositorySlug(
                              getCollaborationSpotlight()?.most_collaborative_merge_request?.repository_name || 'repository', 
                              getCollaborationSpotlight()?.most_collaborative_merge_request?.repository_github_id || '0'
                            )}/merge-requests/${generateMergeRequestSlug(
                              getCollaborationSpotlight()?.most_collaborative_merge_request?.title || 'merge-request',
                              getCollaborationSpotlight()?.most_collaborative_merge_request?.github_id || '0'
                            )}`}
                            className="text-sm font-bold text-gray-900 hover:underline block"
                          >
                            {getCollaborationSpotlight()?.most_collaborative_merge_request?.title || 'Merge Request'}
                          </Link>
                          
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">
                              Collaborators ({getCollaborationSpotlight()?.most_collaborative_merge_request?.collaborator_count || 0})
                            </div>
                            <div className="flex -space-x-2 overflow-hidden">
                              {/* Lead developer */}
                              <Link 
                                href={`/contributors/${generateContributorSlug(
                                  getCollaborationSpotlight()?.name || '', 
                                  getCollaborationSpotlight()?.username || '', 
                                  getCollaborationSpotlight()?.contributor_github_id || ''
                                )}`}
                                className="relative z-30 inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-gray-100"
                              >
                                <AvatarImage 
                                  src={getCollaborationSpotlight()?.avatar} 
                                  alt={getCollaborationSpotlight()?.name || 'Developer'} 
                                />
                              </Link>
                              
                              {/* Actual collaborator avatars */}
                              {(getCollaborationSpotlight()?.most_collaborative_merge_request?.collaborators || [])
                                .filter(collab => collab.id !== getCollaborationSpotlight()?.contributor_id)
                                .slice(0, 6)
                                .map((collab, i) => (
                                  <Link 
                                    href={`/contributors/${generateContributorSlug(
                                      collab.name || '', 
                                      collab.username || '', 
                                      collab.github_id || ''
                                    )}`} 
                                    key={collab.id} 
                                    className="relative inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-gray-100" 
                                    style={{zIndex: 25-i}}
                                  >
                                    <AvatarImage 
                                      src={collab.avatar} 
                                      alt={collab.name || collab.username || 'Collaborator'} 
                                    />
              </Link>
                              ))}
                              
                              {/* Additional team members indicator */}
                              {(getCollaborationSpotlight()?.most_collaborative_merge_request?.collaborator_count || 0) > 7 && (
                                <div className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white bg-gray-50 text-xs font-medium">
                                  +{(getCollaborationSpotlight()?.most_collaborative_merge_request?.collaborator_count || 0) - 7}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">No collaborative merge requests found</div>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 italic">
                      Thrives in collaborative environments with many contributors
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No developer data available
                  </div>
                )}
              </>
            )}
          </div>
          </Card>

        {/* Card 3: Previously Code Volume Leader, now Repository Influence */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4 text-primary"
              >
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
              <CardTitle className="text-base font-medium">Network Nexus</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse flex flex-col items-center justify-center space-y-2 p-4">
                <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ) : error ? (
              <div className="text-sm text-destructive">Error loading data</div>
            ) : !getInfluenceSpotlight() ? (
              <div className="text-sm text-muted-foreground">No data available</div>
            ) : (
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-3">
                  <Link 
                    href={`/contributors/${generateContributorSlug(
                      getInfluenceSpotlight()?.name || '', 
                      getInfluenceSpotlight()?.username || '', 
                      getInfluenceSpotlight()?.contributor_github_id || ''
                    )}`}
                    className="relative h-10 w-10 rounded-full overflow-hidden"
                  >
                    <img 
                      src={getInfluenceSpotlight()?.avatar || ''} 
                      alt={getInfluenceSpotlight()?.name || getInfluenceSpotlight()?.username || 'Developer'} 
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div>
                    <Link 
                      href={`/contributors/${generateContributorSlug(
                        getInfluenceSpotlight()?.name || '', 
                        getInfluenceSpotlight()?.username || '', 
                        getInfluenceSpotlight()?.contributor_github_id || ''
                      )}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {getInfluenceSpotlight()?.username}
                    </Link>
                    <div className="text-primary font-bold text-lg">
                      {getInfluenceSpotlight()?.repo_influence_score?.toFixed(1) || '0'} <span className="text-xs font-normal text-muted-foreground">Influence Score</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <div className="font-medium text-gray-900">Repositories</div>
                    <div className="mt-1 text-lg font-bold text-gray-800">{getInfluenceSpotlight()?.repositories_contributed || 0}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Followers</div>
                    <div className="mt-1 text-lg font-bold text-gray-800">{getInfluenceSpotlight()?.followers_count || 0}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-gray-900">Cross-Repository Impact</div>
                    <div className="mt-1 text-sm">Contributions span across multiple projects with significant influence</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            <p>Delivers widespread impact across multiple repositories</p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Developer Table Section */}
      <div className="w-full mb-6 space-y-4">
        {/* Developers Table */}
        <div className="bg-card rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Developer</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">GitHub</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Popular Repo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Followers</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Repos</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <span className="ml-2">Loading rankings...</span>
                      </div>
                    </td>
                  </tr>
                ) : rankings && rankings.length > 0 ? (
                  [...rankings]
                    .sort((a, b) => a.rank_position - b.rank_position)
                    .map((dev: ContributorRanking, index: number) => {
                    // Try to parse top languages
                    let languages: string[] = [];
                    try {
                      if (dev.top_languages) {
                        languages = JSON.parse(dev.top_languages);
                      }
                    } catch (e) {
                      console.error('Failed to parse languages:', e);
                    }
                    
                    const isExpanded = expandedRows.includes(dev.contributor_id);
                    
                    return (
                      <React.Fragment key={dev.contributor_id}>
                        <tr 
                          className={`border-b hover:bg-muted/50 ${isExpanded ? 'bg-muted/30' : ''}`}
                          onClick={() => toggleExpandedRow(dev.contributor_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Rank */}
                          <td className="px-4 py-3 text-center font-medium">
                            {dev.rank_position}
                          </td>
                          
                          {/* Developer */}
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Link 
                                href={`/contributors/${generateContributorSlug(dev.name, dev.username, dev.contributor_github_id)}`}
                                className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 mr-3"
                              >
                                <AvatarImage 
                                  src={dev.avatar} 
                                  alt={dev.name || dev.username || 'Developer'} 
                                />
                              </Link>
                              <div>
                                <Link 
                                  href={`/contributors/${generateContributorSlug(dev.name, dev.username, dev.contributor_github_id)}`} 
                                  className="font-medium hover:underline hover:text-primary transition-colors"
                                >
                                  {dev.name || 'Unknown'}
                                </Link>
                                <div className="text-xs text-muted-foreground">@{dev.username || 'unknown'}</div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Score */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center gap-2 justify-end">
                              {dev.total_score && (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold">{Math.round(dev.total_score)}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Location */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {dev.location && (
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {dev.location}
                                </div>
                              )}
                              <LanguageBadges languages={dev.top_languages} />
                            </div>
                          </td>
                          
                          {/* GitHub URL */}
                          <td className="px-4 py-3">
                            {dev.username && (
                              <a 
                                href={`https://github.com/${dev.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                {dev.username}
                              </a>
                            )}
                          </td>
                          
                          {/* Popular Repository */}
                          <td className="px-4 py-3">
                            {dev.most_popular_repository ? (
                              <Link 
                                href={`/${generateRepositorySlug(
                                  dev.most_popular_repository.name || 'repository',
                                  dev.most_popular_repository.github_id || '0'
                                )}`}
                                className="text-sm hover:underline hover:text-primary transition-colors flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                {dev.most_popular_repository.name}
                                {dev.most_popular_repository.stars > 0 && (
                                  <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1 rounded flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                                    </svg>
                                    {dev.most_popular_repository.stars > 1000 
                                      ? `${(dev.most_popular_repository.stars / 1000).toFixed(1)}k` 
                                      : dev.most_popular_repository.stars}
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <span className="text-sm text-muted-foreground">No repositories</span>
                            )}
                          </td>
                          
                          {/* Followers */}
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium">{dev.followers_count.toLocaleString()}</div>
                          </td>
                          
                          {/* Repos Contributed */}
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium">{dev.repositories_contributed}</div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row Content */}
                        {isExpanded && (
                          <tr className="bg-muted/20 border-b">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* Metrics Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="py-2 px-4 text-left font-medium text-sm">Metric</th>
                                        <th className="py-2 px-4 text-left font-medium text-sm">Definition</th>
                                        <th className="py-2 px-4 text-center font-medium text-sm">Weight</th>
                                        <th className="py-2 px-4 text-center font-medium text-sm">Value</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Code Volume</td>
                                        <td className="py-2 px-4 text-sm">Normalized score (0-100) based on total lines of code added and removed. Calculated as: (developer's total lines / highest total lines) × 100. Higher values indicate more code contributions relative to other developers.</td>
                                        <td className="py-2 px-4 text-center text-sm">5%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.code_volume_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Code Efficiency</td>
                                        <td className="py-2 px-4 text-sm">Measures how closely final PR changes match commit changes. Calculated as: AVG(1 - |PR changes - commit changes| / commit changes) × 100. Perfect 100 means efficient coding with minimal wasted effort between commits and final PR.</td>
                                        <td className="py-2 px-4 text-center text-sm">15%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.code_efficiency_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Commit Impact</td>
                                        <td className="py-2 px-4 text-sm">Normalized score (0-100) based on commit frequency. Calculated as: (developer's commit count / highest commit count) × 100. Higher scores indicate a developer who commits code more frequently than others.</td>
                                        <td className="py-2 px-4 text-center text-sm">10%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.commit_impact_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Team Collaboration</td>
                                        <td className="py-2 px-4 text-sm">Measures work with multiple contributors on PRs. Uses an asymptotic formula: 100 * (1 - 1/(collaborators^0.8)). Solo developers (1 collaborator) score 0, with 2 collaborators scoring 43, 3 collaborators scoring 65, and 10+ collaborators approaching but never exceeding 100. Rewards larger team sizes while maintaining the 0-100 scale.</td>
                                        <td className="py-2 px-4 text-center text-sm">20%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.collaboration_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Repository Popularity</td>
                                        <td className="py-2 px-4 text-sm">Based on stars/forks of contributed repos: 60% from total popularity (log scale) + 40% from # of popular repos (1000+ stars). Formula: (ln(total_popularity+1)/ln(25000)×60) + (min(popular_repos_count,5)×8). Rewards contributing to widely-used projects.</td>
                                        <td className="py-2 px-4 text-center text-sm">20%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.repo_popularity_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Repository Influence</td>
                                        <td className="py-2 px-4 text-sm">Normalized score (0-100) based on number of repositories contributed to. Calculated as: (developer's repos count / highest repos count) × 100. Higher scores indicate contribution across many different repositories.</td>
                                        <td className="py-2 px-4 text-center text-sm">10%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.repo_influence_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Followers</td>
                                        <td className="py-2 px-4 text-sm">Normalized score (0-100) based on GitHub follower count. Calculated as: (developer's followers / highest follower count) × 100. Measures the developer's social influence in the GitHub community.</td>
                                        <td className="py-2 px-4 text-center text-sm">15%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.followers_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="border-b">
                                        <td className="py-2 px-4 text-sm font-medium">Profile Completeness</td>
                                        <td className="py-2 px-4 text-sm">Points-based score (0-100) for GitHub profile completion: username (10), name (10), avatar (10), bio (15), company (10), location (10), blog (10), Twitter (10), languages (15). Complete profiles receive full points in each category.</td>
                                        <td className="py-2 px-4 text-center text-sm">5%</td>
                                        <td className="py-2 px-4 text-center font-medium text-sm">{(dev.profile_completeness_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                      <tr className="font-medium bg-muted/30">
                                        <td className="py-2 px-4 text-sm">Total Score</td>
                                        <td className="py-2 px-4 text-sm">Weighted average of: Code Volume (5%), Code Efficiency (15%), Commit Impact (10%), Team Collaboration (20%), Repo Popularity (20%), Repo Influence (10%), Followers (15%), Profile (5%). Maximum 100 points possible.</td>
                                        <td className="py-2 px-4 text-center text-sm">100%</td>
                                        <td className="py-2 px-4 text-center text-sm">{(dev.total_score ?? 0).toFixed(1)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* View Full Profile Button */}
                                <div className="flex justify-end">
          <Link 
                                    href={`/contributors/${generateContributorSlug(dev.name, dev.username, dev.contributor_github_id)}`}
                                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                                  >
                                    <span>View Full Profile</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
          </Link>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      No rankings available. Run the ranking calculation in the admin panel first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
