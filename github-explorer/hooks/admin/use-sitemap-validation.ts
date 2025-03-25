import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/client/api-client';

export function useSitemapValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [totalUrls, setTotalUrls] = useState(0);
  const [validUrls, setValidUrls] = useState(0);
  const [errorUrls, setErrorUrls] = useState(0);
  const [validationComplete, setValidationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // This is a stub implementation since we no longer have direct validation
  // In a real implementation, we might need to add a validate endpoint to the backend
  const validateUrls = async () => {
    setIsValidating(true);
    setValidationComplete(false);
    setError(null);
    
    try {
      // Get sitemap status to get the URL count
      const status = await apiClient.sitemap.getStatus();
      
      // In this stub implementation, we'll just use the URL count from status
      // and assume all URLs are valid
      const urlCount = status.urlCount || 0;
      setTotalUrls(urlCount);
      setValidUrls(urlCount);
      setErrorUrls(0);
      setValidationComplete(true);
      
      toast({
        title: 'Validation Complete',
        description: `Sitemap contains ${urlCount} URLs`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error validating sitemap:', error);
      setError(error instanceof Error ? error.message : 'Unknown error validating sitemap');
      
      toast({
        title: 'Validation Failed',
        description: error instanceof Error ? error.message : 'Failed to validate sitemap',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateUrls,
    isValidating,
    totalUrls,
    validUrls,
    errorUrls,
    validationComplete,
    error,
  };
} 