'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  Repository, 
  Contributor, 
  MergeRequest, 
  File,
  buildRepositoryUrl,
  buildContributorUrl,
  buildMergeRequestUrl,
  buildCommitUrl
} from '@/lib/url-utils';

// Entity types that can be linked to
type EntityType = 'repository' | 'contributor' | 'mergeRequest' | 'commit';

// Common link props
interface CommonLinkProps {
  children: ReactNode;
  className?: string;
  title?: string;
  ariaLabel?: string;
}

// Entity-specific link props
interface RepositoryLinkProps extends CommonLinkProps {
  entityType: 'repository';
  entity: Repository;
}

interface ContributorLinkProps extends CommonLinkProps {
  entityType: 'contributor';
  entity: Contributor;
}

interface MergeRequestLinkProps extends CommonLinkProps {
  entityType: 'mergeRequest';
  entity: MergeRequest;
  repository: Repository;
}

interface CommitLinkProps extends CommonLinkProps {
  entityType: 'commit';
  entity: File;
  repository: Repository;
  mergeRequest: MergeRequest;
  contributor: Contributor;
}

// Union type of all possible props
type EntityLinkProps = 
  | RepositoryLinkProps 
  | ContributorLinkProps 
  | MergeRequestLinkProps 
  | CommitLinkProps;

/**
 * EntityLink component that handles entity-specific URL generation
 * 
 * This component extends Next.js Link to provide consistent URL generation
 * for different entity types following our SEO-friendly URL structure.
 */
export function EntityLink(props: EntityLinkProps) {
  const { children, className, title, ariaLabel } = props;
  
  // Generate the appropriate href based on entity type
  const href = generateHref(props);
  
  // Common Link props
  const linkProps = {
    href,
    className,
    title,
    'aria-label': ariaLabel,
  };
  
  return <Link {...linkProps}>{children}</Link>;
}

/**
 * Helper function to generate the appropriate href based on entity type
 */
function generateHref(props: EntityLinkProps): string {
  const { entityType } = props;
  
  switch(entityType) {
    case 'repository':
      return buildRepositoryUrl(props.entity);
      
    case 'contributor':
      return buildContributorUrl(props.entity);
      
    case 'mergeRequest':
      return buildMergeRequestUrl(props.repository, props.entity);
      
    case 'commit':
      return buildCommitUrl(
        props.repository, 
        props.mergeRequest,
        props.contributor,
        props.entity
      );
      
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

/**
 * Type guard for repository links
 */
function isRepositoryLink(props: EntityLinkProps): props is RepositoryLinkProps {
  return props.entityType === 'repository';
}

/**
 * Type guard for contributor links
 */
function isContributorLink(props: EntityLinkProps): props is ContributorLinkProps {
  return props.entityType === 'contributor';
}

/**
 * Type guard for merge request links
 */
function isMergeRequestLink(props: EntityLinkProps): props is MergeRequestLinkProps {
  return props.entityType === 'mergeRequest';
}

/**
 * Type guard for commit links
 */
function isCommitLink(props: EntityLinkProps): props is CommitLinkProps {
  return props.entityType === 'commit';
} 