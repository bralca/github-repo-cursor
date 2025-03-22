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
import { TableHead, TableCell } from '@/components/ui/table';
import { generateContributorSlug } from '@/lib/url-utils';

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
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Developer</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Metrics</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Profile</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Followers</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Repos</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span className="ml-2">Loading rankings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : rankings && rankings.length > 0 ? (
                    rankings.map((dev: ContributorRanking, index: number) => {
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
                            
                            {/* Metrics Visualization */}
                            <td className="px-4 py-3">
                              <div>
                                <MetricsVisualization 
                                  codeVolume={dev.code_volume_score} 
                                  codeEfficiency={dev.code_efficiency_score}
                                  commitImpact={dev.commit_impact_score}
                                  repoInfluence={dev.repo_influence_score}
                                  collaboration={dev.collaboration_score}
                                  repoPopularity={dev.repo_popularity_score}
                                />
                              </div>
                            </td>
                            
                            {/* Profile Badges (Location & Languages) */}
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
                              <td colSpan={7} className="px-6 py-4">
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
                                          <td className="py-2 px-4 text-sm">Total amount of code contributed</td>
                                          <td className="py-2 px-4 text-center text-sm">10%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.code_volume_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Code Efficiency</td>
                                          <td className="py-2 px-4 text-sm">How efficiently code moves from commit to final PR</td>
                                          <td className="py-2 px-4 text-center text-sm">15%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.code_efficiency_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Commit Impact</td>
                                          <td className="py-2 px-4 text-sm">Frequency and impact of commits</td>
                                          <td className="py-2 px-4 text-center text-sm">10%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.commit_impact_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Team Collaboration</td>
                                          <td className="py-2 px-4 text-sm">How often they work with other developers</td>
                                          <td className="py-2 px-4 text-center text-sm">20%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.collaboration_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Repository Popularity</td>
                                          <td className="py-2 px-4 text-sm">Contributes to popular repositories (stars/forks)</td>
                                          <td className="py-2 px-4 text-center text-sm">20%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.repo_popularity_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Repository Influence</td>
                                          <td className="py-2 px-4 text-sm">Influence across different repositories</td>
                                          <td className="py-2 px-4 text-center text-sm">10%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.repo_influence_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Followers</td>
                                          <td className="py-2 px-4 text-sm">Social influence based on follower count</td>
                                          <td className="py-2 px-4 text-center text-sm">5%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.followers_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="border-b">
                                          <td className="py-2 px-4 text-sm font-medium">Profile Completeness</td>
                                          <td className="py-2 px-4 text-sm">How complete the developer's profile is</td>
                                          <td className="py-2 px-4 text-center text-sm">10%</td>
                                          <td className="py-2 px-4 text-center font-medium text-sm">{(dev.profile_completeness_score ?? 0).toFixed(1)}</td>
                                        </tr>
                                        <tr className="font-medium bg-muted/30">
                                          <td className="py-2 px-4 text-sm">Total Score</td>
                                          <td className="py-2 px-4 text-sm">Combined weighted score</td>
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
