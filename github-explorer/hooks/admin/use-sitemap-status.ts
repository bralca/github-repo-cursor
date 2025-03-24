import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, SitemapStatusResponse } from '@/lib/client/api-client';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to fetch and manage sitemap status
 * @returns Sitemap status data, loading state, error, and function to generate a new sitemap
 */
export function useSitemapStatus() {
  const queryClient = useQueryClient();
  
  // Query for fetching sitemap status
  const { data, isLoading, error, refetch } = useQuery<SitemapStatusResponse>({
    queryKey: ['sitemap-status'],
    queryFn: async () => {
      try {
        return await apiClient.sitemap.getStatus();
      } catch (error: any) {
        console.error('Error fetching sitemap status:', error);
        throw new Error(error.message || 'Failed to fetch sitemap status');
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
  
  // Mutation for generating a new sitemap
  const generateSitemapMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.sitemap.generate();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "Sitemap Generation Started",
        description: "Sitemap generation has been initiated",
        variant: "default"
      });
      
      // Invalidate sitemap status query to refresh data
      queryClient.invalidateQueries({ queryKey: ['sitemap-status'] });
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: "Sitemap Generation Failed",
        description: `Failed to generate sitemap: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  return {
    status: data,
    isLoading,
    error,
    refetch,
    generateSitemap: generateSitemapMutation.mutate,
    isGenerating: generateSitemapMutation.isPending
  };
} 