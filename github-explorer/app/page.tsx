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
  repoInfluence 
}: { 
  codeVolume: number, 
  codeEfficiency: number, 
  commitImpact: number, 
  repoInfluence: number 
}) {
  // Define colors for different metrics
  const metricColors = {
    codeVolume: 'bg-blue-500',
    codeEfficiency: 'bg-green-500', 
    commitImpact: 'bg-purple-500',
    repoInfluence: 'bg-amber-500'
  };
  
  // Normalize scores for visualization (cap at 100)
  const normalizeScore = (score: number) => Math.min(Math.max(score, 0), 100);
  
  const metrics = [
    { key: 'codeVolume', name: 'Vol', value: normalizeScore(codeVolume), color: metricColors.codeVolume },
    { key: 'commitImpact', name: 'Imp', value: normalizeScore(commitImpact), color: metricColors.commitImpact },
    { key: 'codeEfficiency', name: 'Eff', value: normalizeScore(codeEfficiency), color: metricColors.codeEfficiency },
    { key: 'repoInfluence', name: 'Rep', value: normalizeScore(repoInfluence), color: metricColors.repoInfluence }
  ];
  
  return (
    <div className="flex items-end h-12 gap-1">
      {metrics.map((metric) => (
        <div key={metric.key} className="flex flex-col items-center">
          <div 
            className={`w-4 ${metric.color} rounded-t`} 
            style={{ height: `${metric.value / 100 * 32}px` }}
          ></div>
          <span className="text-xs text-muted-foreground mt-1">{metric.name}</span>
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
                                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-100 mr-3">
                                  <AvatarImage 
                                    src={dev.avatar} 
                                    alt={dev.name || dev.username || 'Developer'} 
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">{dev.name || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground">@{dev.username || 'unknown'}</div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Score */}
                            <td className="px-4 py-3 text-center">
                              <div className="text-xl font-bold">{dev.total_score.toFixed(1)}</div>
                            </td>
                            
                            {/* Metrics Visualization */}
                            <td className="px-4 py-3">
                              <MetricsVisualization 
                                codeVolume={dev.code_volume_score} 
                                codeEfficiency={dev.code_efficiency_score}
                                commitImpact={dev.commit_impact_score}
                                repoInfluence={dev.repo_influence_score}
                              />
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {/* Detailed Metrics */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Metrics Breakdown</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>Code Volume:</div>
                                      <div className="text-right font-medium">{dev.code_volume_score.toFixed(1)}</div>
                                      <div>Code Efficiency:</div>
                                      <div className="text-right font-medium">{dev.code_efficiency_score.toFixed(1)}</div>
                                      <div>Commit Impact:</div>
                                      <div className="text-right font-medium">{dev.commit_impact_score.toFixed(1)}</div>
                                      <div>Repo Influence:</div>
                                      <div className="text-right font-medium">{dev.repo_influence_score.toFixed(1)}</div>
                                      <div>Profile Score:</div>
                                      <div className="text-right font-medium">{dev.profile_completeness_score.toFixed(1)}</div>
                                    </div>
                                  </div>
                                  
                                  {/* Code Stats */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Code Stats</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>Lines Added:</div>
                                      <div className="text-right font-medium">{dev.raw_lines_added.toLocaleString()}</div>
                                      <div>Lines Removed:</div>
                                      <div className="text-right font-medium">{dev.raw_lines_removed.toLocaleString()}</div>
                                      <div>Total Commits:</div>
                                      <div className="text-right font-medium">{dev.raw_commits_count.toLocaleString()}</div>
                                      <div>Total LOC:</div>
                                      <div className="text-right font-medium">{(dev.raw_lines_added + dev.raw_lines_removed).toLocaleString()}</div>
                                    </div>
                                  </div>
                                  
                                  {/* Repository Info */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Repository Contributions</h4>
                                    <div className="text-sm">
                                      <p>Contributing to {dev.repositories_contributed} repositories</p>
                                      
                                      {/* This would ideally show actual repositories */}
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {[1, 2, 3].map((i) => (
                                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100">
                                            repo-{i}
                                          </span>
                                        ))}
                                        {dev.repositories_contributed > 3 && (
                                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                                            +{dev.repositories_contributed - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Social & Links */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Social & Links</h4>
                                    <div className="text-sm space-y-2">
                                      {dev.twitter_username && (
                                        <div className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                          </svg>
                                          <a href={`https://twitter.com/${dev.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            @{dev.twitter_username}
                                          </a>
                                        </div>
                                      )}
                                      
                                      {dev.username && (
                                        <div className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                          </svg>
                                          <a href={`https://github.com/${dev.username}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {dev.username}
                                          </a>
                                        </div>
                                      )}
                                    </div>
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
