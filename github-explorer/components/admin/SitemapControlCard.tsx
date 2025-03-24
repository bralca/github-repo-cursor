"use client";

import { useSitemapGeneration } from '@/hooks/admin/use-sitemap-generation';
import { useSitemapValidation } from '@/hooks/admin/use-sitemap-validation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ExternalLinkIcon } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { useState } from 'react';

interface SitemapControlCardProps {
  // Removed useSQLite flag
}

export function SitemapControlCard({}: SitemapControlCardProps) {
  const { generateSitemap, isGenerating, status, isError, lastUpdated, refreshStatus } = useSitemapGeneration();
  const { validateSitemap, isValidating, validationResults, validationError } = useSitemapValidation();
  const [activeTab, setActiveTab] = useState<string>('generation');
  
  const handleGenerateSitemap = async () => {
    await generateSitemap();
    setTimeout(() => {
      refreshStatus();
    }, 2000);
  };
  
  const handleValidateSitemap = async () => {
    await validateSitemap();
  };
  
  return (
    <Card className="w-full max-w-none">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect width="8" height="8" x="8" y="8" rx="2" />
                <path d="M8 2H6a2 2 0 0 0-2 2v2" />
                <path d="M16 2h2a2 2 0 0 1 2 2v2" />
                <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                <path d="M16 16h-4v4" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg">Sitemap Management</CardTitle>
              <CardDescription className="text-sm">Generate and validate XML sitemaps</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">
                {lastUpdated || 'Never'}
              </p>
            </div>
            
            <div>
              {isGenerating ? (
                <Badge variant="outline" className="flex items-center gap-1 py-0.5 px-2">
                  <Spinner className="h-3 w-3" />
                  <span className="font-medium">Generating</span>
                </Badge>
              ) : status?.sitemapExists ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 py-0.5 px-2">
                  <span className="font-medium">Generated</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-0.5 px-2">
                  <span className="font-medium">Not Generated</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 border-b">
          <TabsList className="bg-transparent h-10 p-0">
            <TabsTrigger value="generation" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4">
              Generation
            </TabsTrigger>
            <TabsTrigger value="validation" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4">
              Validation
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="generation" className="pt-4 px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
                <path d="M12 13v8" />
                <path d="M5 13v2a2 2 0 0 0 2 2h5" />
              </svg>
              Entity Counts
            </h3>
            
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateSitemap}
                disabled={isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Spinner className="mr-2 h-3 w-3" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                      <path d="M16 5V3" />
                      <path d="M8 5V3" />
                      <path d="M12 5V3" />
                      <path d="M20 5V3" />
                      <path d="M16 12h-5a1 1 0 0 1-1-1V6" />
                      <path d="M21 8H3" />
                      <path d="M16 16h.01" />
                    </svg>
                    Generate
                  </>
                )}
              </Button>
              
              {status?.sitemapExists && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                    View <ExternalLinkIcon className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          {status?.sitemapMetadata && status.sitemapMetadata.length > 0 ? (
            <>
              <div className="grid grid-cols-6 gap-4 mb-4">
                {status.sitemapMetadata.map((meta) => (
                  <div key={meta.entity_type} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                    <div className="text-xs text-muted-foreground mb-1 capitalize">{meta.entity_type}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">{meta.url_count.toLocaleString()}</span>
                      <span className="text-xs font-medium text-muted-foreground">URLs</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {status.sitemapMetadata.find(m => m.entity_type === 'commits') && (
                <div className="text-xs text-muted-foreground p-3 border rounded-md bg-muted/5 mb-4">
                  <span className="font-medium">Note:</span> Commits are grouped by unique commit SHA per repository.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-32 border rounded-md bg-muted/10 mb-4">
              <p className="text-sm text-muted-foreground">No sitemap data available</p>
            </div>
          )}
          
          {isError && (
            <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded-md mt-4">
              An error occurred while fetching sitemap status.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="validation" className="pt-4 px-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                <path d="M9 11V8a3 3 0 0 1 6 0v3" />
                <path d="M15 11V8a3 3 0 0 1 3 0v3" />
                <path d="M9 11H3v11h6V11Z" />
                <path d="M21 11h-6v11h6V11Z" />
              </svg>
              Validation Results
            </h3>
            
            <Button
              onClick={handleValidateSitemap}
              disabled={isValidating}
              size="sm"
            >
              {isValidating ? (
                <>
                  <Spinner className="mr-2 h-3 w-3" />
                  Validating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {validationResults ? 'Validate Again' : 'Validate URLs'}
                </>
              )}
            </Button>
          </div>
          
          {validationResults ? (
            <>
              <div className="grid grid-cols-6 gap-3 mb-5">
                <div className="border rounded-md p-3 col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">Total URLs</div>
                  <div className="text-lg font-semibold">
                    {validationResults.total.toLocaleString()}
                  </div>
                </div>
                <div className="border rounded-md p-3 col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                  <div className="text-lg font-semibold">
                    {((validationResults.successful / validationResults.total) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-emerald-50/50 col-span-2">
                  <div className="text-xs text-emerald-700 mb-1">Successful</div>
                  <div className="text-lg font-semibold text-emerald-700">
                    {validationResults.successful.toLocaleString()}
                  </div>
                </div>
                <div className={validationResults.failed > 0 ? "border rounded-md p-3 bg-amber-50/50 col-span-2" : "border rounded-md p-3 bg-emerald-50/50 col-span-2"}>
                  <div className={validationResults.failed > 0 ? "text-xs text-amber-700 mb-1" : "text-xs text-emerald-700 mb-1"}>Failed</div>
                  <div className={validationResults.failed > 0 ? "text-lg font-semibold text-amber-700" : "text-lg font-semibold text-emerald-700"}>
                    {validationResults.failed.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {Object.keys(validationResults.byStatusCode).length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-medium mb-3">Status Code Breakdown</h4>
                  <div className="grid grid-cols-12 gap-2">
                    {Object.entries(validationResults.byStatusCode).map(([code, count]) => (
                      <div key={code} className="border rounded-md p-2 flex flex-col items-center col-span-1">
                        <span className={code.startsWith('2') ? 'text-xs text-emerald-600 font-medium mb-1' : 'text-xs text-red-600 font-medium mb-1'}>
                          {code === '0' ? 'Error' : `${code}`}
                        </span>
                        <Badge variant={code.startsWith('2') ? "success" : "destructive"} className="px-1.5 text-xs">
                          {count.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {validationResults.failedUrls.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-3">Failed URLs ({validationResults.failedUrls.length})</h4>
                  <div className="max-h-40 overflow-auto border rounded-md divide-y">
                    {validationResults.failedUrls.slice(0, 5).map((result, index) => (
                      <div key={index} className="p-3 flex items-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 mr-2 shrink-0">
                          {result.statusCode === 0 ? 'Error' : result.statusCode}
                        </Badge>
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary truncate hover:underline flex-1" 
                          title={result.url}
                        >
                          {result.url}
                        </a>
                      </div>
                    ))}
                    {validationResults.failedUrls.length > 5 && (
                      <div className="p-2 text-center">
                        <Button variant="ghost" className="w-full text-xs h-8 hover:bg-muted/30">
                          See all {validationResults.failedUrls.length} failed URLs
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 border rounded-md bg-muted/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50 mb-2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <p className="text-sm text-muted-foreground">No validation data available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run a validation to see results</p>
            </div>
          )}
          
          {validationError && (
            <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded-md mt-4">
              Error: {validationError}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
} 