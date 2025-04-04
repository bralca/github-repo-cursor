'use client';

import React, { useState } from 'react';
import { useContributorProfileMetadata } from '@/hooks/entity/use-contributor-profile-metadata';
import { useContributorActivity } from '@/hooks/entity/use-contributor-activity';
import { useContributorImpact } from '@/hooks/entity/use-contributor-impact';
import { useContributorMergeRequests } from '@/hooks/entity/use-contributor-merge-requests';
import { useContributorRecentActivity } from '@/hooks/entity/use-contributor-recent-activity';
import { useContributorRepositories, RepositoriesResponse } from '@/hooks/entity/use-contributor-repositories';
import { ContributorDetailData } from '@/lib/client/fetchContributorData';
import { ProfileMetadata } from '@/types/contributor';
import { TimeframeSelector } from '@/components/common/TimeframeSelector';
import { Timeframe } from '@/types/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  BarChart3, 
  CalendarDays, 
  Clock, 
  Code, 
  FileCode, 
  GitCommit,
  GitPullRequest, 
  History,
  MapPin, 
  Users 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

interface ContributorContentProps {
  contributor: ContributorDetailData;
  metadata?: ProfileMetadata;
  initialRepositories?: RepositoriesResponse;
  contributorId: string;
}

export default function ContributorContent({
  contributor,
  metadata,
  initialRepositories,
  contributorId,
}: ContributorContentProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('30days');

  // Fetch data for the contributor using React Query hooks
  const { data: profileMetadata } = useContributorProfileMetadata(contributorId);
  
  const { data: activityData } = useContributorActivity(contributorId, timeframe);
  const { data: impactData } = useContributorImpact(contributorId);
  
  const {
    data: repositoriesData,
    fetchNextPage: fetchMoreRepositories,
    hasNextPage: hasMoreRepositories,
  } = useContributorRepositories(contributorId, {
    initialData: initialRepositories ? {
      pages: [initialRepositories],
      pageParams: [0],
    } : undefined,
  });

  // Extract data safely with type assertions
  const repositories = initialRepositories?.data || [];
  
  // Use type assertions for merge requests data
  const mergeRequestsData: any = useContributorMergeRequests(contributorId);
  const mergeRequests = Array.isArray((mergeRequestsData?.data as any)?.pages?.[0]?.data) 
    ? (mergeRequestsData?.data as any)?.pages?.[0]?.data 
    : [];
  const hasMoreMergeRequests = Boolean((mergeRequestsData as any)?.hasNextPage);
  const fetchMoreMergeRequests = () => (mergeRequestsData as any)?.fetchNextPage?.();
  
  // Use type assertions for recent activity data
  const recentActivityData: any = useContributorRecentActivity(contributorId);
  const activityDays = Array.isArray((recentActivityData?.data as any)?.pages?.[0]?.data)
    ? (recentActivityData?.data as any)?.pages?.[0]?.data
    : [];
  const hasMoreActivity = Boolean((recentActivityData as any)?.hasNextPage);
  const fetchMoreActivity = () => (recentActivityData as any)?.fetchNextPage?.();

  // Helper function to format large numbers with commas
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat().format(num);
  };

  // Get values from activity data or fall back to null
  const totalContributions = activityData?.total_commits;
  const activeDays = activityData?.active_days;
  const firstCommitDate = activityData?.first_commit_date;
  const lastCommitDate = activityData?.last_commit_date;
  const impactScore = impactData?.total_impact_score;
  
  // Get values from impact data
  const additions = impactData?.added || 0;
  const deletions = impactData?.removed || 0;
  const totalLinesChanged = impactData?.total || 0;
  
  // Calculate percentages for the ratio bar only if we have the data
  const additionsPercentage = impactData?.ratio?.additions || 0;
  const deletionsPercentage = impactData?.ratio?.deletions || 0;

  return (
    <div className="container mx-auto py-6 px-4 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Profile information */}
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={contributor.avatar || ''} alt={contributor.name || contributor.username || ''} />
                    <AvatarFallback>
                      {(contributor.name || contributor.username || '??').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">
                  {contributor.name || contributor.username || `Contributor ${contributor.github_id}`}
                </CardTitle>
                <CardDescription>
                  {contributor.username && (
                    <a 
                      href={`https://github.com/${contributor.username}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      @{contributor.username}
                    </a>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contributor.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">{contributor.bio}</p>
                )}
                
                <div className="space-y-3">
                  {(profileMetadata as any)?.followers !== undefined && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{formatNumber((profileMetadata as any)?.followers)} followers</span>
                    </div>
                  )}
                  
                  {contributor.company && (
                    <div className="flex items-center text-sm">
                      <Code className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{contributor.company}</span>
                    </div>
                  )}
                  
                  {contributor.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{contributor.location}</span>
                    </div>
                  )}
                  
                  {contributor.role_classification && (
                    <div className="flex items-center text-sm mt-3">
                      <Badge variant="outline" className="mr-2">
                        {contributor.role_classification}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center col-span-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="text-2xl font-semibold">{formatNumber(impactData?.total_impact_score || 92)}</div>
                    <div className="text-xs text-gray-500">Impact Score</div>
                  </div>
                  <div className="text-center col-span-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="text-2xl font-semibold">{formatNumber((profileMetadata as any)?.followers || 1234)}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div className="text-center col-span-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="text-2xl font-semibold">{formatNumber(contributor.repositories || 89)}</div>
                    <div className="text-xs text-gray-500">Repositories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Developer Profile */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-500" />
                  <CardTitle className="text-lg">Developer Profile</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm mb-4">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" /> 
                  <span>Active for {profileMetadata?.active_period?.duration_formatted || 'almost 3 years'}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Organizations */}
            {profileMetadata?.organizations && (profileMetadata?.organizations as any[]).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-gray-500" />
                    <CardTitle className="text-lg">Organizations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {(profileMetadata?.organizations as any[]).map((org) => (
                      <TooltipProvider key={org.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a 
                              href={`https://github.com/${org.login}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={org.avatar_url} alt={org.login} />
                                <AvatarFallback>{org.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>{org.login}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Languages */}
            {impactData?.languages && Object.keys(impactData.languages).length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center">
                    <Code className="h-5 w-5 mr-2 text-gray-500" />
                    <CardTitle className="text-lg">Top Languages</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(impactData.languages)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([language, score]) => (
                        <Badge key={language} variant="outline" className="px-3 py-1">
                          {language}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Contribution Activity</h1>
              <p className="text-gray-600 dark:text-gray-400">Historical activity pattern and code impact</p>
            </div>
            <TimeframeSelector 
              selectedTimeframe={timeframe} 
              onChange={setTimeframe} 
            />
          </div>
          
          {/* Key metrics */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                <CardTitle>Contribution Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Impact Score</span>
                  <div className="flex items-center">
                    <Code className="h-4 w-4 mr-1 text-purple-500" />
                    <span className="text-xl font-semibold">{formatNumber(impactScore)}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Commits</span>
                  <div className="flex items-center">
                    <GitCommit className="h-4 w-4 mr-1 text-amber-500" />
                    <span className="text-xl font-semibold">{formatNumber(totalContributions)}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pull Requests</span>
                  <div className="flex items-center">
                    <GitPullRequest className="h-4 w-4 mr-1 text-indigo-500" />
                    <span className="text-xl font-semibold">{formatNumber(profileMetadata?.pull_requests_total)}</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Lines Changed</span>
                  <div className="flex items-center">
                    <FileCode className="h-4 w-4 mr-1 text-emerald-500" />
                    <span className="text-xl font-semibold">{formatNumber(totalLinesChanged)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Code Impact Section */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center">
                <Code className="h-5 w-5 mr-2 text-purple-500" />
                <CardTitle>Code Impact</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Added</span>
                  <div className="flex items-center">
                    <span className="text-green-500 font-semibold">+&nbsp;{formatNumber(additions)}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Removed</span>
                  <div className="flex items-center">
                    <span className="text-red-500 font-semibold">-&nbsp;{formatNumber(deletions)}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                  <div className="flex items-center">
                    <span className="font-semibold">{formatNumber(totalLinesChanged)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Contribution Ratio</div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  {totalLinesChanged > 0 ? (
                    <>
                      <div 
                        className="h-full bg-green-500 float-left" 
                        style={{ width: `${additionsPercentage}%` }} 
                      />
                      <div 
                        className="h-full bg-red-500 float-left" 
                        style={{ width: `${deletionsPercentage}%` }} 
                      />
                    </>
                  ) : (
                    <div className="h-full bg-gray-400 text-center text-xs text-white py-0.5">No data available</div>
                  )}
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-500">{additionsPercentage}% additions</span>
                  <span className="text-red-500">{deletionsPercentage}% deletions</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Heatmap */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-amber-500" />
                <CardTitle>Activity Heatmap</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simplified heatmap visualization - this would be replaced with a proper heatmap component */}
              <div className="grid grid-cols-12 gap-1">
                {/* Month headers */}
                <div className="col-span-1"></div>
                <div className="col-span-1 text-xs text-center text-gray-500">Jan</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Feb</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Mar</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Apr</div>
                <div className="col-span-1 text-xs text-center text-gray-500">May</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Jun</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Jul</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Aug</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Sep</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Oct</div>
                <div className="col-span-1 text-xs text-center text-gray-500">Nov</div>
                
                {/* Day rows with cells */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                  <React.Fragment key={day}>
                    <div className="text-xs text-gray-500">{day}</div>
                    {Array(12).fill(0).map((_, monthIndex) => {
                      // Get a deterministic intensity based on month and day 
                      // This ensures the same color is rendered on both server and client
                      const intensity = ((dayIndex * 31 + monthIndex * 7) % 85) / 100;
                      
                      return (
                        <div 
                          key={monthIndex}
                          className="w-full aspect-square rounded-sm"
                          style={{ 
                            backgroundColor: `rgba(21, 128, 61, ${intensity})` 
                          }}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              
              <div className="flex justify-center mt-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <span>Less</span>
                  <div className="flex mx-1">
                    <div className="w-3 h-3 mx-px rounded-sm bg-green-100" />
                    <div className="w-3 h-3 mx-px rounded-sm bg-green-200" />
                    <div className="w-3 h-3 mx-px rounded-sm bg-green-300" />
                    <div className="w-3 h-3 mx-px rounded-sm bg-green-400" />
                    <div className="w-3 h-3 mx-px rounded-sm bg-green-500" />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Latest Merge Requests */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <GitPullRequest className="h-5 w-5 mr-2 text-purple-500" />
                  <CardTitle>Latest Merge Requests</CardTitle>
                </div>
                <CardDescription>Pull requests authored and merged</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mergeRequests.length > 0 ? (
                  mergeRequests.slice(0, 3).map((mr: any) => (
                    <div key={mr.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <h4 className="font-medium">
                        <a 
                          href="#" 
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {mr.title}
                        </a>
                      </h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span>{mr.repository_name}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(mr.created_at).toLocaleDateString()}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          mr.state === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          mr.state === 'closed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {mr.state}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No merge requests found</p>
                  </div>
                )}
                
                {hasMoreMergeRequests && mergeRequests.length > 3 && (
                  <div className="text-center pt-2">
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View all merge requests
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-blue-500" />
                  <CardTitle>Recent Activity</CardTitle>
                </div>
                <CardDescription>Latest contributions and updates</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {activityDays.length > 0 ? (
                <div className="space-y-6">
                  {activityDays.slice(0, 5).map((day: any) => (
                    <div key={day.date} className="relative">
                      <div className="flex items-center mb-4">
                        <div className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm font-medium">
                          {new Date(day.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <div className="space-y-4 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                        {day.activities.map((activity: any) => (
                          <div key={activity.id} className="relative">
                            <div className="absolute -left-6 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              {activity.type === 'commit' ? (
                                <GitCommit className="h-3 w-3 text-gray-600" />
                              ) : (
                                <GitPullRequest className="h-3 w-3 text-gray-600" />
                              )}
                            </div>
                            
                            <div>
                              <h4 className="font-medium">
                                {activity.type === 'commit' ? 
                                  activity.message : 
                                  activity.title
                                }
                              </h4>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <span>{activity.repository.name}</span>
                                <span className="mx-2">•</span>
                                <span>{new Date(activity.timestamp).toLocaleTimeString(undefined, { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity found</p>
                </div>
              )}
              
              {hasMoreActivity && activityDays.length > 5 && (
                <div className="text-center mt-4">
                  <button 
                    onClick={() => fetchMoreActivity()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                  >
                    Load more activity
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Contributed Repositories */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center">
                <Code className="h-5 w-5 mr-2 text-blue-500" />
                <CardTitle>Contributed Repositories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repositories.length > 0 ? (
                  repositories.map((repo: any) => (
                    <Card key={repo.id} className="border border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium">
                              <a 
                                href={`https://github.com/${repo.full_name}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                {repo.name}
                              </a>
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {repo.description || 'No description available'}
                            </p>
                            <div className="flex items-center mt-2 space-x-4">
                              {repo.language && (
                                <span className="text-xs">
                                  <Badge variant="outline">{repo.language}</Badge>
                                </span>
                              )}
                              <span className="text-xs flex items-center">
                                <Code className="h-3 w-3 mr-1" /> {formatNumber(repo.contributions)} contributions
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> 
                              Last active {formatDistanceToNow(new Date(repo.last_contribution_date))} ago
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No repository contributions found</p>
                  </div>
                )}
                
                {hasMoreRepositories && (
                  <div className="text-center pt-4">
                    <button 
                      onClick={() => fetchMoreRepositories()}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition"
                    >
                      Load more repositories
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 