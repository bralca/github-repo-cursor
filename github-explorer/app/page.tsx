'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, ArrowDown, TrendingUp, BarChart3, Zap, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { TableHead } from '@/components/ui/table';

// Interfaces for type safety
interface ContributorRanking {
  rank_position: number;
  contributor_id: string;
  total_score: number;
  code_volume_score: number;
  code_efficiency_score: number;
  commit_impact_score: number;
  repo_influence_score: number;
  followers_score: number;
  profile_completeness_score: number;
  followers_count: number;
  raw_lines_added: number;
  raw_lines_removed: number;
  raw_commits_count: number;
  repositories_contributed: number;
  calculation_timestamp: string;
  username?: string;
  name?: string;
  avatar?: string;
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

// Custom hook for contributor rankings
function useContributorRankings() {
  const [rankings, setRankings] = useState<ContributorRanking[]>(mockRankings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('7d');
  
  const timeframes: Timeframe[] = ['24h', '7d', '30d', 'all'];
  
  React.useEffect(() => {
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
  
  const setTimeframe = (timeframe: Timeframe) => {
    // In a real implementation, we would refetch the data for the selected timeframe
    setSelectedTimeframe(timeframe);
  };
  
  return {
    rankings,
    isLoading,
    error,
    timeframes,
    selectedTimeframe,
    setTimeframe,
  };
}

export default function HomePage() {
  const [showHighlights, setShowHighlights] = useState(true);
  const { rankings, isLoading, timeframes, selectedTimeframe, setTimeframe } = useContributorRankings();
  
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Developer Dominance Card */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="font-semibold">Developer Dominance</h3>
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">64.8%</span>
                <span className="ml-2 text-sm text-red-500 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" /> 0.23%
                </span>
              </div>
            </div>
            
            <div className="h-16 w-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded flex items-end">
              {/* Simple chart visualization */}
              <div className="w-4 h-10 bg-blue-400 rounded-t mx-[2px]"></div>
              <div className="w-4 h-12 bg-blue-500 rounded-t mx-[2px]"></div>
              <div className="w-4 h-8 bg-blue-300 rounded-t mx-[2px]"></div>
              <div className="w-4 h-14 bg-blue-600 rounded-t mx-[2px]"></div>
              <div className="w-4 h-11 bg-blue-400 rounded-t mx-[2px]"></div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            <span>7D</span>
          </div>
        </Card>
        
        {/* Community Sentiment Index */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-yellow-500" />
                <h3 className="font-semibold">Community Sentiment Index</h3>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">42</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Contributor happiness is moderately positive
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-xs">
                <span className="w-16">Yesterday</span>
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
                  31
                </div>
                <span className="ml-2 text-yellow-700">Fear</span>
              </div>
              
              <div className="flex items-center text-xs">
                <span className="w-16">7d ago</span>
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                  25
                </div>
                <span className="ml-2 text-red-700">Anxiety</span>
              </div>
              
              <div className="flex items-center text-xs">
                <span className="w-16">1m ago</span>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                  58
                </div>
                <span className="ml-2 text-green-700">Optimism</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div className="flex">
              <div className="bg-red-500 h-full" style={{ width: '25%' }}></div>
              <div className="bg-orange-500 h-full" style={{ width: '15%' }}></div>
              <div className="bg-yellow-500 h-full" style={{ width: '20%' }}></div>
              <div className="bg-green-400 h-full" style={{ width: '20%' }}></div>
              <div className="bg-green-500 h-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </Card>
        
        {/* Hot Events Card */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 mr-2 text-orange-500" />
            <h3 className="font-semibold">Hot Contributions</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 mr-3">
                <AvatarImage alt="React Developer" />
              </div>
              <div>
                <div className="font-medium flex items-center">
                  React Component Library
                  <div className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                    Fill
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Top quality work
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-green-600 flex items-center text-sm">
                  <ArrowUp className="h-3 w-3 mr-1" />
                </span>
                <span className="text-xs text-muted-foreground">
                  $ 7.75M
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-100 mr-3">
                <AvatarImage alt="Performance Engineer" />
              </div>
              <div>
                <div className="font-medium flex items-center">
                  Performance Optimization
                  <div className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                    Fix
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Critical improvements
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end">
                <span className="text-green-600 flex items-center text-sm">
                  <ArrowUp className="h-3 w-3 mr-1" />
                </span>
                <span className="text-xs text-muted-foreground">
                  $ 5.23M
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-devs">All Developers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="gainers">Gainers</TabsTrigger>
          <TabsTrigger value="losers">Losers</TabsTrigger>
          <TabsTrigger value="ido">New Contributors</TabsTrigger>
          <TabsTrigger value="all-categories">All Categories</TabsTrigger>
          <TabsTrigger value="ecosystems">Ecosystems</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Filter bar */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Filter developers..." 
                  className="pl-9 w-[250px]" 
                />
              </div>
              
              <Button variant="outline" size="sm">
                Layout
              </Button>
              
              <Button variant="outline" size="sm">
                Filters
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">USD</span>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Developers Table */}
          <div className="bg-card rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Developer</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Impact Score</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Chg (24h)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total Contribs</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Volume (24h)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Efficiency</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Chart (7d)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Followers</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span className="ml-2">Loading rankings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rankings && rankings.length > 0 ? (
                    rankings.slice(0, 10).map((dev: ContributorRanking, index: number) => (
                      <tr key={dev.contributor_id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-4 text-sm">{dev.rank_position}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-100 mr-3">
                              <AvatarImage 
                                src={dev.avatar} 
                                alt={dev.name || dev.username || 'Developer'} 
                              />
                            </div>
                            <div>
                              <div className="font-medium">{dev.name || dev.username || 'Anonymous'}</div>
                              <div className="text-xs text-muted-foreground">@{dev.username || 'unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{dev.total_score.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="text-green-600 flex items-center justify-end">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            {/* Placeholder change value */}
                            <span>{(Math.random() * 5).toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{dev.raw_commits_count}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{dev.raw_lines_added + dev.raw_lines_removed}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{dev.code_efficiency_score.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-10 bg-muted rounded flex items-end">
                            {/* Randomly generated mini chart for visual effect */}
                            {Array.from({ length: 7 }).map((_, i) => {
                              const height = 5 + Math.random() * 5;
                              return (
                                <div 
                                  key={i} 
                                  className="w-1.5 bg-green-500 rounded-t mx-px" 
                                  style={{ height: `${height}px` }}
                                ></div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{dev.followers_count || 0}</div>
                          <div className="text-xs text-muted-foreground">{dev.followers_score.toFixed(1)}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-medium">{dev.profile_completeness_score.toFixed(1)}%</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        No rankings available. Run the ranking calculation in the admin panel first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="all-devs">
          <div className="p-4 text-center">
            Full developer listing with detailed metrics will be available here
          </div>
        </TabsContent>
        
        {/* Other tab contents would go here */}
      </Tabs>
    </div>
  );
}
