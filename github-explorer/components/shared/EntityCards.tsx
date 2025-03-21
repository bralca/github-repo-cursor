'use client';

import Image from 'next/image';
import { Repository, Contributor, MergeRequest, File } from '@/lib/url-utils';
import { RepositoryLink, ContributorLink, MergeRequestLink, CommitLink } from './EntityLinks';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RepositoryCardProps {
  repository: Repository & {
    description?: string;
    stars?: number;
    forks?: number;
    primary_language?: string;
    last_updated?: string;
  };
  className?: string;
}

/**
 * Repository card component
 */
export function RepositoryCard({ repository, className }: RepositoryCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <RepositoryLink repository={repository}>
            {repository.name}
          </RepositoryLink>
        </CardTitle>
        {repository.description && (
          <CardDescription className="line-clamp-2">{repository.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {repository.primary_language && (
            <Badge variant="outline" className="text-xs">
              {repository.primary_language}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground pt-0 justify-between">
        <div className="flex items-center gap-3">
          {repository.stars !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span>{repository.stars}</span>
            </div>
          )}
          {repository.forks !== undefined && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd"></path>
              </svg>
              <span>{repository.forks}</span>
            </div>
          )}
        </div>
        {repository.last_updated && (
          <div>Updated: {formatDate(repository.last_updated)}</div>
        )}
      </CardFooter>
    </Card>
  );
}

interface ContributorCardProps {
  contributor: Contributor & {
    avatar?: string;
    bio?: string;
    company?: string;
    contributions?: number;
    role_classification?: string;
  };
  className?: string;
}

/**
 * Contributor card component
 */
export function ContributorCard({ contributor, className }: ContributorCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {contributor.avatar ? (
              <Image 
                src={contributor.avatar}
                alt={contributor.name || contributor.username || 'Contributor'}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
            )}
          </div>
          <div>
            <CardTitle className="text-lg">
              <ContributorLink contributor={contributor}>
                {contributor.name || contributor.username || `Contributor ${contributor.github_id}`}
              </ContributorLink>
            </CardTitle>
            {contributor.username && (
              <CardDescription>@{contributor.username}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {contributor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{contributor.bio}</p>
        )}
        {contributor.role_classification && (
          <Badge variant="secondary" className="text-xs">
            {contributor.role_classification}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        {contributor.company && (
          <div className="text-sm text-muted-foreground">{contributor.company}</div>
        )}
        {contributor.contributions !== undefined && (
          <div className="text-sm font-medium">{contributor.contributions} contributions</div>
        )}
      </CardFooter>
    </Card>
  );
}

interface MergeRequestCardProps {
  mergeRequest: MergeRequest & {
    state?: string;
    created_at?: string;
    additions?: number;
    deletions?: number;
    changed_files?: number;
  };
  repository: Repository;
  className?: string;
}

/**
 * Merge Request card component
 */
export function MergeRequestCard({ mergeRequest, repository, className }: MergeRequestCardProps) {
  const daysAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const getStateColor = (state?: string) => {
    if (!state) return 'bg-gray-400';
    switch (state.toLowerCase()) {
      case 'open': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'merged': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            {mergeRequest.state && (
              <div className={`w-3 h-3 rounded-full mr-2 ${getStateColor(mergeRequest.state)}`}></div>
            )}
            <CardTitle className="text-lg">
              <MergeRequestLink mergeRequest={mergeRequest} repository={repository}>
                {mergeRequest.title}
              </MergeRequestLink>
            </CardTitle>
          </div>
          {mergeRequest.state && (
            <Badge variant="outline" className="text-xs capitalize">
              {mergeRequest.state}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {mergeRequest.additions !== undefined && (
            <div className="text-green-600">+{mergeRequest.additions}</div>
          )}
          {mergeRequest.deletions !== undefined && (
            <div className="text-red-600">-{mergeRequest.deletions}</div>
          )}
          {mergeRequest.changed_files !== undefined && (
            <div className="text-muted-foreground">{mergeRequest.changed_files} files</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 text-sm text-muted-foreground">
        {mergeRequest.created_at && (
          <div>Created {daysAgo(mergeRequest.created_at)}</div>
        )}
      </CardFooter>
    </Card>
  );
}

interface CommitCardProps {
  file: File & {
    status?: string;
    additions?: number;
    deletions?: number;
    patch?: string;
  };
  repository: Repository;
  mergeRequest: MergeRequest;
  contributor: Contributor;
  className?: string;
}

/**
 * Commit card component
 */
export function CommitCard({ file, repository, mergeRequest, contributor, className }: CommitCardProps) {
  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-400';
    switch (status.toLowerCase()) {
      case 'added': return 'bg-green-500';
      case 'modified': return 'bg-blue-500';
      case 'deleted': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getShortFilename = (filename: string) => {
    const parts = filename.split('/');
    return parts.length > 1 ? `.../${parts[parts.length - 1]}` : filename;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            {file.status && (
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(file.status)}`}></div>
            )}
            <CardTitle className="text-sm font-medium">
              <CommitLink 
                file={file} 
                repository={repository}
                mergeRequest={mergeRequest}
                contributor={contributor}
              >
                {getShortFilename(file.filename)}
              </CommitLink>
            </CardTitle>
          </div>
          {file.status && (
            <Badge variant="outline" className="text-xs capitalize">
              {file.status}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs truncate">
          {file.filename}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm">
          {file.additions !== undefined && (
            <span className="text-green-600">+{file.additions}</span>
          )}
          {file.deletions !== undefined && (
            <span className="text-red-600">-{file.deletions}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 