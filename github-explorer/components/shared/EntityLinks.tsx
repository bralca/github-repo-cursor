'use client';

import { ReactNode } from 'react';
import { 
  Repository, 
  Contributor, 
  MergeRequest, 
  File 
} from '@/lib/url-utils';
import { EntityLink } from './EntityLink';

// Common props for all link components
interface CommonLinkProps {
  children: ReactNode;
  className?: string;
  title?: string;
  ariaLabel?: string;
}

/**
 * Repository link component
 */
export function RepositoryLink({ 
  repository, 
  children, 
  className, 
  title, 
  ariaLabel 
}: { repository: Repository } & CommonLinkProps) {
  return (
    <EntityLink
      entityType="repository"
      entity={repository}
      className={className}
      title={title || repository.name}
      ariaLabel={ariaLabel || `View repository: ${repository.name}`}
    >
      {children}
    </EntityLink>
  );
}

/**
 * Contributor link component
 */
export function ContributorLink({ 
  contributor, 
  children, 
  className, 
  title, 
  ariaLabel 
}: { contributor: Contributor } & CommonLinkProps) {
  const displayName = contributor.name || contributor.username || `Contributor ${contributor.github_id}`;
  
  return (
    <EntityLink
      entityType="contributor"
      entity={contributor}
      className={className}
      title={title || displayName}
      ariaLabel={ariaLabel || `View contributor: ${displayName}`}
    >
      {children}
    </EntityLink>
  );
}

/**
 * Merge Request link component
 */
export function MergeRequestLink({ 
  mergeRequest, 
  repository,
  children, 
  className, 
  title, 
  ariaLabel 
}: { 
  mergeRequest: MergeRequest;
  repository: Repository;
} & CommonLinkProps) {
  return (
    <EntityLink
      entityType="mergeRequest"
      entity={mergeRequest}
      repository={repository}
      className={className}
      title={title || mergeRequest.title}
      ariaLabel={ariaLabel || `View merge request: ${mergeRequest.title}`}
    >
      {children}
    </EntityLink>
  );
}

/**
 * Commit link component
 */
export function CommitLink({ 
  file,
  repository,
  mergeRequest,
  contributor,
  children, 
  className, 
  title, 
  ariaLabel 
}: { 
  file: File;
  repository: Repository;
  mergeRequest: MergeRequest;
  contributor: Contributor;
} & CommonLinkProps) {
  return (
    <EntityLink
      entityType="commit"
      entity={file}
      repository={repository}
      mergeRequest={mergeRequest}
      contributor={contributor}
      className={className}
      title={title || `${file.filename}`}
      ariaLabel={ariaLabel || `View commit for file: ${file.filename}`}
    >
      {children}
    </EntityLink>
  );
} 