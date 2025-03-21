import { useState, useCallback } from 'react';
import { fetchFromSQLiteApi } from '@/lib/database/sqlite';

export interface ValidationResult {
  url: string;
  statusCode: number;
  success: boolean;
  error?: string;
}

export interface ValidationSummary {
  total: number;
  successful: number;
  failed: number;
  byStatusCode: Record<string, number>;
  failedUrls: ValidationResult[];
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  summary?: ValidationSummary;
  error?: string;
}

export function useSitemapValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationSummary | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const validateSitemap = useCallback(async () => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const response = await fetchFromSQLiteApi<ValidationResponse>('validate-sitemap-urls', 'POST', undefined, {});
      
      if (response.success && response.summary) {
        setValidationResults(response.summary);
      } else {
        setValidationError(response.error || 'Validation failed with no error message');
      }
    } catch (error) {
      setValidationError((error as Error).message || 'An unknown error occurred');
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const clearValidationResults = useCallback(() => {
    setValidationResults(null);
    setValidationError(null);
  }, []);
  
  return {
    isValidating,
    validationResults,
    validationError,
    validateSitemap,
    clearValidationResults
  };
} 