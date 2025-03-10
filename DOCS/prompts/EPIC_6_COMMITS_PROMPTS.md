# Epic 6: Commits Page Integration Prompts

This document outlines the specific prompts needed to implement Epic 6, categorized by user story and with AI recommendations for each task.

## IMPORTANT: Build Upon Existing Code

**All implementation work must build upon the existing codebase. Do NOT rebuild functionality from scratch.**
- Review the existing code structure before making changes
- Extend current patterns and implementations rather than replacing them
- Maintain consistency with existing naming conventions and architecture
- Use existing utility functions where available
- Preserve existing functionality when refactoring
- The UI components in src/components/commits/ should be connected to real data, not redesigned

## Story 6.1: Commit Data Infrastructure

### Database Tasks (Lovable AI) 🔴 Not Started

1. Enhance commits table schema:
```sql
ALTER TABLE commits 
ADD COLUMN IF NOT EXISTS repository_id UUID REFERENCES repositories(id),
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS parent_hash TEXT,
ADD COLUMN IF NOT EXISTS stats_summary JSONB;

CREATE INDEX IF NOT EXISTS idx_commits_repository_id ON commits(repository_id);
CREATE INDEX IF NOT EXISTS idx_commits_branch ON commits(branch);
CREATE INDEX IF NOT EXISTS idx_commits_parent_hash ON commits(parent_hash);
```

2. Create commit relationships view:
```sql
CREATE OR REPLACE VIEW commit_relationships AS
SELECT c.hash, 
       c.parent_hash,
       c.repository_id,
       c.branch,
       (SELECT hash FROM commits WHERE hash = c.parent_hash) AS parent_exists
FROM commits c;
```

### Core Commits Data Hooks (Lovable AI) 🔴 Not Started

1. Implement `useCommit` hook:
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Commit } from '@/types';

export function useCommit(commitHash: string | undefined) {
  return useQuery({
    queryKey: ['commit', commitHash],
    queryFn: async () => {
      if (!commitHash) throw new Error('Commit hash is required');
      
      const { data, error } = await supabase
        .from('commits')
        .select(`
          *,
          repository:repositories(id, name),
          author:contributors(id, name, avatar_url)
        `)
        .eq('hash', commitHash)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Commit not found');

      return data as Commit;
    },
    enabled: Boolean(commitHash)
  });
}
```

2. Implement `useCommitsList` hook:
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Commit } from '@/types';

export function useCommitsList({
  repositoryId,
  authorId,
  branch,
  dateRange,
  page = 1,
  limit = 20
}: {
  repositoryId?: string;
  authorId?: string;
  branch?: string;
  dateRange?: { from: Date; to: Date };
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['commits', { repositoryId, authorId, branch, dateRange, page, limit }],
    queryFn: async () => {
      let query = supabase
        .from('commits')
        .select(`
          *,
          repository:repositories(id, name),
          author:contributors(id, name, avatar_url)
        `, { count: 'exact' });

      if (repositoryId) query = query.eq('repository_id', repositoryId);
      if (authorId) query = query.eq('author_id', authorId);
      if (branch) query = query.eq('branch', branch);
      if (dateRange) {
        query = query
          .gte('date', dateRange.from.toISOString())
          .lte('date', dateRange.to.toISOString());
      }

      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        commits: data as Commit[],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    }
  });
}
```

3. Build CommitSelector component:
```typescript
import React from 'react';
import { useCommitsList } from '@/hooks/useCommitsList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';

export const CommitSelector: React.FC<{
  onSelect: (commitHash: string) => void;
  repositoryId?: string;
  authorId?: string;
  branch?: string;
}> = ({ onSelect, repositoryId, authorId, branch }) => {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');

  const { data, isLoading, error } = useCommitsList({
    repositoryId,
    authorId,
    branch,
    page
  });

  if (isLoading) return <div>Loading commits...</div>;
  if (error) return <div>Error loading commits: {error.message}</div>;
  if (!data?.commits.length) return <div>No commits found</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search commits..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={branch || ''}
          onValueChange={(value) => setBranch(value)}
          options={[
            { label: 'All branches', value: '' },
            { label: 'main', value: 'main' },
            { label: 'develop', value: 'develop' }
          ]}
        />
      </div>

      <div className="space-y-2">
        {data.commits
          .filter(commit => 
            !search || 
            commit.title.toLowerCase().includes(search.toLowerCase()) ||
            commit.hash.includes(search)
          )
          .map(commit => (
            <Button
              key={commit.hash}
              variant="ghost"
              className="w-full text-left"
              onClick={() => onSelect(commit.hash)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{commit.title}</span>
                <span className="text-sm text-gray-500">
                  {commit.hash.substring(0, 7)} • {commit.author.name}
                </span>
              </div>
            </Button>
          ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={data.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};
```

[The rest of the code continues with the same level of detail for each section, but I'll stop here due to length limits. Let me know if you want me to continue with the next sections.]
