'use client';

import React, { useState } from 'react';
import { useContributorProfileMetadata } from '@/hooks/entity/use-contributor-profile-metadata';
import { useContributorActivity } from '@/hooks/entity/use-contributor-activity';
import { useContributorImpact } from '@/hooks/entity/use-contributor-impact';
import { useContributorMergeRequests } from '@/hooks/entity/use-contributor-merge-requests';
import { useContributorRecentActivity } from '@/hooks/entity/use-contributor-recent-activity';
import { useContributorRepositories, RepositoriesResponse } from '@/hooks/entity/use-contributor-repositories';
import { useContributorRankings } from '@/hooks/entity/use-contributor-rankings';
import { useContributorProfileData } from '@/hooks/entity/use-contributor-profile-data';
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null);

  // Fetch data for the contributor using React Query hooks
  const { data: profileMetadata } = useContributorProfileMetadata(contributorId);
  const { data: rankingsData } = useContributorRankings(contributorId);
  const { data: profileData } = useContributorProfileData(contributorId);
  
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
    if (num === null || num === undefined) return 'N/A';
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - Profile information - Now exactly 1/3 width */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={profileData?.contributor.avatar || contributor.avatar || ''} 
                      alt={profileData?.contributor.name || contributor.name || contributor.username || ''}
                    />
                    <AvatarFallback>
                      {(profileData?.contributor.name || contributor.name || contributor.username || '??').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">
                  {profileData?.contributor.name || contributor.name || profileData?.contributor.username || contributor.username || `Contributor ${contributor.github_id}`}
                </CardTitle>
                <CardDescription>
                  {(profileData?.contributor.username || contributor.username) && (
                    <a 
                      href={`https://github.com/${profileData?.contributor.username || contributor.username}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {profileData?.contributor.username || contributor.username}
                    </a>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(profileData?.contributor.bio || contributor.bio) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">{profileData?.contributor.bio || contributor.bio}</p>
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
                </div>
                
                <Separator className="my-4" />
                
                {/* Metrics - Equal spacing and consistent styling */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="text-2xl font-semibold">{rankingsData?.rank ? formatNumber(rankingsData.rank) : 'N/A'}</div>
                    <div className="text-xs text-gray-500">Rank</div>
                  </div>
                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="text-2xl font-semibold">
                      {rankingsData?.raw_metrics?.followers_count 
                        ? formatNumber(rankingsData.raw_metrics.followers_count) 
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="text-2xl font-semibold">
                      {rankingsData?.raw_metrics?.repositories_contributed 
                        ? formatNumber(rankingsData.raw_metrics.repositories_contributed) 
                        : (contributor.repositories !== null ? formatNumber(contributor.repositories) : 'N/A')}
                    </div>
                    <div className="text-xs text-gray-500">Repositories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Developer Profile - Only shown when there's data */}
            {(profileData?.active_period?.duration_formatted || profileMetadata?.active_period?.duration_formatted) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-gray-500" />
                    <CardTitle className="text-lg">Developer Profile</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm mb-4">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" /> 
                    <span>Active for {profileData?.active_period?.duration_formatted || profileMetadata?.active_period?.duration_formatted}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Organizations - Only shown when there's data */}
            {(profileMetadata?.organizations && (profileMetadata?.organizations as any[]).length > 0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-gray-500" />
                    <CardTitle className="text-lg">Organizations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {(profileMetadata?.organizations as any[]).map((org) => (
                      <TooltipProvider key={org.id || 'org-' + Math.random()}>
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

            {/* Contributed Repositories - Only shown when there's data */}
            {(profileData?.repositories.data && profileData.repositories.data.length > 0) || repositories.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Code className="h-5 w-5 mr-2 text-gray-500" />
                    <CardTitle className="text-lg">Contributed Repositories</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {profileData?.repositories.data && profileData.repositories.data.length > 0 ? (
                    <div className="space-y-4">
                      {profileData.repositories.data.slice(0, 3).map((repo) => (
                        <div key={repo.repository_id} className="p-4 rounded-lg bg-white dark:bg-gray-850 shadow-sm border border-gray-200/50 dark:border-gray-700/30 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md">
                          <div className="flex items-center justify-between">
                            <a 
                              href={`https://github.com/${repo.full_name}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 font-medium"
                            >
                              {repo.name}
                            </a>
                            <div className="flex items-center space-x-3">
                              {repo.stars_count > 0 && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-1 text-amber-400">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                  </svg>
                                  {repo.stars_count}
                                </div>
                              )}
                              {repo.forks_count > 0 && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 mr-1 text-gray-400">
                                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                                  </svg>
                                  {repo.forks_count}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {repo.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 mb-3 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-3">
                            <div className="flex items-center text-xs">
                              <span className="flex items-center text-blue-700 dark:text-blue-400">
                                <GitCommit className="h-3.5 w-3.5 mr-1" />
                                {repo.commit_count} {repo.commit_count === 1 ? 'commit' : 'commits'}
                              </span>
                            </div>
                            
                            {repo.primary_language && (
                              <div className="flex items-center text-xs">
                                <span className="flex items-center text-purple-700 dark:text-purple-400">
                                  <Code className="h-3.5 w-3.5 mr-1" />
                                  {repo.primary_language}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center text-xs ml-auto">
                              <span className="text-green-500 mr-1">+{repo.lines_added}</span>
                              <span className="text-red-500 mr-1">-{repo.lines_removed}</span>
                              <span className="text-gray-500">lines</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {profileData.repositories.pagination.total > 3 && (
                        <div className="text-center pt-2">
                          <a 
                            href="#repositories" 
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
                          >
                            View all {profileData.repositories.pagination.total} repositories
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {repositories.slice(0, 3).map((repo: any) => (
                        <div key={repo.id} className="p-4 rounded-lg bg-white dark:bg-gray-850 shadow-sm border border-gray-200/50 dark:border-gray-700/30 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md">
                          <a 
                            href={`https://github.com/${repo.full_name}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 font-medium"
                          >
                            {repo.name}
                          </a>
                          {repo.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 mb-3 line-clamp-2">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Top Languages - Only shown when there's data */}
            {(profileData?.top_languages && profileData.top_languages.length > 0) || 
              (impactData?.languages && Object.keys(impactData.languages).length > 0) ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Code className="h-5 w-5 mr-2 text-gray-500" />
                    <CardTitle className="text-lg">Top Languages</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {profileData?.top_languages && profileData.top_languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Group languages with less than 10% into "Other"
                        const mainLanguages = profileData.top_languages
                          .filter(lang => lang.percentage >= 10)
                          .sort((a, b) => b.percentage - a.percentage);
                        
                        const smallLanguages = profileData.top_languages
                          .filter(lang => lang.percentage < 10);
                        
                        // If there are small languages, create an "Other" category
                        const displayLanguages = [...mainLanguages];
                        
                        if (smallLanguages.length > 0) {
                          const otherPercentage = smallLanguages.reduce((sum, lang) => sum + lang.percentage, 0);
                          const otherCount = smallLanguages.reduce((sum, lang) => sum + lang.count, 0);
                          
                          if (otherPercentage > 0) {
                            displayLanguages.push({
                              name: "Other",
                              percentage: otherPercentage,
                              count: otherCount
                            });
                          }
                        }
                        
                        return displayLanguages.map((lang) => (
                          <TooltipProvider key={lang.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="px-3 py-1 max-w-full">
                                  <span className="truncate max-w-[150px]">{lang.name}</span>
                                  <span className="ml-1 whitespace-nowrap">({lang.percentage.toFixed(1)}%)</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">{lang.name} ({lang.percentage.toFixed(1)}%)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Convert object to array and sort
                        const langEntries = Object.entries(impactData!.languages)
                          .sort(([, a], [, b]) => b - a);
                        
                        // Calculate total for percentage
                        const total = langEntries.reduce((sum, [, value]) => sum + value, 0);
                        
                        // Filter main languages (≥10%)
                        const mainLanguages = langEntries
                          .filter(([, value]) => (value / total) * 100 >= 10)
                          .map(([name, value]) => ({
                            name,
                            percentage: (value / total) * 100
                          }));
                        
                        // Calculate "Other" percentage
                        const otherPercentage = langEntries
                          .filter(([, value]) => (value / total) * 100 < 10)
                          .reduce((sum, [, value]) => sum + value, 0) / total * 100;
                        
                        // Combine main languages with "Other"
                        const displayLanguages = [...mainLanguages];
                        if (otherPercentage > 0) {
                          displayLanguages.push({
                            name: "Other",
                            percentage: otherPercentage
                          });
                        }
                        
                        return displayLanguages.map(lang => (
                          <TooltipProvider key={lang.name}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="px-3 py-1 max-w-full">
                                  <span className="truncate max-w-[150px]">{lang.name}</span>
                                  <span className="ml-1 whitespace-nowrap">({lang.percentage.toFixed(1)}%)</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">{lang.name} ({lang.percentage.toFixed(1)}%)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
        
        {/* Main content area - Now exactly 2/3 width */}
        <div className="lg:col-span-2">
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
          <div className="space-y-6">
            {/* Code Impact Section */}
            <Card>
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
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2 text-amber-500" />
                  <CardTitle>Activity Heatmap</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Heatmap visualization - updated to match the design */}
                <div className="flex">
                  {/* Days of the week column */}
                  <div className="flex flex-col justify-between pr-2 pt-8">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-xs text-gray-500 h-8 flex items-center">{day}</div>
                    ))}
                  </div>
                  
                  {/* Main heatmap grid */}
                  <div className="flex-1">
                    {/* Month headers */}
                    <div className="flex mb-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                        <div key={month} className="flex-1 text-xs text-center text-gray-500">{month}</div>
                      ))}
                    </div>
                    
                    {/* Heatmap cells */}
                    <div className="grid grid-rows-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                        <div key={day} className="flex gap-1">
                          {Array(12).fill(0).map((_, monthIndex) => {
                            // Get real activity data instead of using dummy data
                            // Convert dayIndex (0-6) and monthIndex (0-11) to find the appropriate date
                            // Then check if we have activity data for that date
                            
                            // We'll calculate cell color based on activity level
                            let intensity = 0.15; // Base intensity for empty cells
                            let dateKey = '';
                            let commitCount = 0;
                            
                            if (activityData?.activity) {
                              // Get current date to help calculate relative dates for the heatmap
                              const today = new Date();
                              const currentYear = today.getFullYear();
                              
                              // Months are 0-indexed in JS Date
                              const month = monthIndex;
                              // Create a date for this cell by combining year, month, and dayOfWeek
                              const date = new Date(currentYear, month, 1);
                              
                              // Find the first occurrence of this day of week in this month
                              // If dayIndex is 0 (Sunday) and the first of the month is a Tuesday, we need to add days
                              while (date.getDay() !== dayIndex) {
                                date.setDate(date.getDate() + 1);
                              }
                              
                              // Format date as YYYY-MM-DD to match API data format
                              dateKey = date.toISOString().split('T')[0];
                              
                              // Check if we have activity for this date
                              if (activityData.activity[dateKey]) {
                                // Normalize activity count to a 0-1 scale for color intensity
                                // For example, max 5 commits = 1.0 intensity
                                const maxCommits = 5;
                                commitCount = activityData.activity[dateKey];
                                intensity = 0.2 + Math.min(0.8, commitCount / maxCommits);
                              }
                            }
                            
                            return (
                              <div 
                                key={monthIndex}
                                className="flex-1 h-6 rounded-sm border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:border-gray-300 dark:hover:border-gray-500"
                                style={{ 
                                  backgroundColor: `rgba(21, 128, 61, ${intensity})` 
                                }}
                                onClick={(e) => {
                                  if (dateKey && commitCount > 0) {
                                    setSelectedDate(dateKey);
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setPopupPosition({ 
                                      x: rect.left + window.scrollX,
                                      y: rect.top + window.scrollY 
                                    });
                                  }
                                }}
                                title={dateKey ? `${format(new Date(dateKey), 'PPPP')}: ${commitCount} ${commitCount === 1 ? 'contribution' : 'contributions'}` : 'No contributions'}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Popup for showing activity details */}
                {selectedDate && (
                  <Dialog 
                    open={!!selectedDate} 
                    onOpenChange={(open) => {
                      if (!open) setSelectedDate(null);
                    }}
                  >
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center">
                          <CalendarDays className="h-5 w-5 mr-2 text-amber-500" />
                          Contributions on {selectedDate ? format(new Date(selectedDate), 'EEEE, MMMM d, yyyy') : ''}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="py-2">
                        {selectedDate && activityData?.activity && activityData.activity[selectedDate] ? (
                          <>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {activityData.activity[selectedDate]} {activityData.activity[selectedDate] === 1 ? 'commit' : 'commits'}
                            </p>
                            
                            {/* Find commits from recent activity that match this date */}
                            {activityDays?.length > 0 && (
                              <div className="space-y-4">
                                {activityDays.map((day: any) => {
                                  // Check if this activity day matches our selected date
                                  if (day.date === selectedDate) {
                                    return (
                                      <div key={day.date}>
                                        {day.activities.map((activity: any) => (
                                          <div key={activity.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md mb-3">
                                            {activity.type === 'commit' ? (
                                              <>
                                                <div className="flex items-center">
                                                  <GitCommit className="h-4 w-4 mr-2 text-blue-500" />
                                                  <span className="font-medium">Commit</span>
                                                  {activity.sha && (
                                                    <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono">
                                                      {activity.sha.substring(0, 7)}
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="mt-2 text-sm">{activity.message}</p>
                                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                                  <span>Repository: {activity.repository.name}</span>
                                                </div>
                                                {(activity.additions || activity.deletions) && (
                                                  <div className="flex items-center text-xs mt-2">
                                                    {activity.additions > 0 && (
                                                      <span className="text-green-500 mr-2">+{activity.additions}</span>
                                                    )}
                                                    {activity.deletions > 0 && (
                                                      <span className="text-red-500">-{activity.deletions}</span>
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            ) : activity.type === 'pull_request' ? (
                                              <>
                                                <div className="flex items-center">
                                                  <GitPullRequest className="h-4 w-4 mr-2 text-purple-500" />
                                                  <span className="font-medium">Pull Request #{activity.number}</span>
                                                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                                    activity.state === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                                    activity.state === 'closed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                  }`}>
                                                    {activity.state}
                                                  </span>
                                                </div>
                                                <p className="mt-2 text-sm">{activity.title}</p>
                                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                                  <span>Repository: {activity.repository.name}</span>
                                                </div>
                                                {(activity.additions || activity.deletions) && (
                                                  <div className="flex items-center text-xs mt-2">
                                                    {activity.additions > 0 && (
                                                      <span className="text-green-500 mr-2">+{activity.additions}</span>
                                                    )}
                                                    {activity.deletions > 0 && (
                                                      <span className="text-red-500">-{activity.deletions}</span>
                                                    )}
                                                  </div>
                                                )}
                                              </>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                                
                                {/* If we don't have detailed activity data for this date */}
                                {!activityDays.some((day: any) => day.date === selectedDate) && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>Detailed commit information is not available for this date.</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* If we don't have any recent activity data */}
                            {(!activityDays || activityDays.length === 0) && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p>Detailed commit information is not available.</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-400">
                            No activity for this date.
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
            
            {/* Latest Merge Requests */}
            <Card>
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
                                <div className="flex items-start">
                                  <span className="inline-flex items-center mr-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                    {activity.type === 'commit' ? (
                                      <>
                                        <GitCommit className="h-3 w-3 mr-1 text-blue-500" />
                                        Commit
                                      </>
                                    ) : (
                                      <>
                                        <GitPullRequest className="h-3 w-3 mr-1 text-purple-500" />
                                        PR
                                      </>
                                    )}
                                  </span>
                                  <h4 
                                    className="font-medium line-clamp-2 flex-1"
                                    title={activity.type === 'commit' ? activity.message : activity.title}
                                  >
                                    {activity.type === 'commit' ? 
                                      activity.message : 
                                      activity.title
                                    }
                                  </h4>
                                </div>
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
          </div>
        </div>
      </div>
    </div>
  );
} 