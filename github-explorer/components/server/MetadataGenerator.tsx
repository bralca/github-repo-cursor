import { Metadata } from 'next';
import { 
  generateRepositoryMetadata, 
  generateContributorMetadata, 
  generateMergeRequestMetadata, 
  generateCommitMetadata,
  RepositorySEOData,
  ContributorSEOData,
  MergeRequestSEOData,
  CommitSEOData
} from '@/lib/metadata-utils';

/**
 * MetadataGenerator component
 * 
 * This is a server component that accepts entity data and generates
 * appropriate metadata for Next.js pages. It should be used in the
 * generateMetadata function of page.tsx files.
 */

export interface MetadataGeneratorProps {
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
  data: RepositorySEOData | ContributorSEOData | MergeRequestSEOData | CommitSEOData | null;
  relatedData?: {
    repository?: RepositorySEOData;
  };
}

export function generateMetadata({ 
  entityType, 
  data, 
  relatedData 
}: MetadataGeneratorProps): Metadata {
  switch (entityType) {
    case 'repository':
      return generateRepositoryMetadata(data as RepositorySEOData | null);
    
    case 'contributor':
      return generateContributorMetadata(data as ContributorSEOData | null);
    
    case 'mergeRequest':
      return generateMergeRequestMetadata(
        data as MergeRequestSEOData | null, 
        relatedData?.repository
      );
    
    case 'commit':
      return generateCommitMetadata(
        data as CommitSEOData | null,
        relatedData?.repository
      );
    
    default:
      // Default metadata if entity type is not recognized
      return {
        title: 'GitHub Explorer',
        description: 'Explore GitHub repositories, contributors, and activity.'
      };
  }
} 