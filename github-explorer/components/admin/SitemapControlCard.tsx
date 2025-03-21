"use client";

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSitemapGeneration } from '@/hooks/admin/use-sitemap-generation';
import { ExternalLink } from 'lucide-react';

export function SitemapControlCard() {
  const {
    status,
    isLoading,
    isGenerating,
    error,
    generateSitemap,
    formattedLastUpdated,
    sitemapExists
  } = useSitemapGeneration();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Sitemap Generation</h3>
        <p className="text-sm text-muted-foreground">
          Generate XML sitemaps for search engines
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading && !status ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm">
                  {sitemapExists ? (
                    <span className="text-green-500 font-medium">Generated</span>
                  ) : (
                    <span>Not generated</span>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm">{formattedLastUpdated}</span>
              </div>
              
              {status?.sitemapMetadata && status.sitemapMetadata.length > 0 && (
                <div className="mt-4 border rounded-md p-2 bg-muted/40">
                  <h4 className="text-sm font-medium mb-2">Entity Counts</h4>
                  {status.sitemapMetadata.map((meta) => (
                    <div key={meta.entity_type} className="flex justify-between text-xs">
                      <span>{meta.entity_type}:</span>
                      <span>{meta.url_count} URLs</span>
                    </div>
                  ))}
                  {status.sitemapMetadata.find(m => m.entity_type === 'commits') && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Note: Commits are grouped by unique commit SHA per repository.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={generateSitemap}
          disabled={isLoading || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Spinner className="mr-2 h-4 w-4" /> 
              Generating Sitemap...
            </>
          ) : (
            'Generate Sitemap'
          )}
        </Button>
        
        {sitemapExists && (
          <Button variant="outline" className="w-full" asChild>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              View Sitemap <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 