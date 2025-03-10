
# Epic 6: Commits Page Integration

This epic focuses on integrating real data into the Commits page, replacing mock data with actual commit information from the database, while enhancing the user experience with comprehensive commit analysis and visualization.

## Current State

The Commits page currently displays mock data with the following components:
- CommitHeader: Shows basic commit metadata
- CommitDiff: Displays code changes with syntax highlighting
- CommitAnalysis: Shows AI-generated insights about the commit
- Mobile and Desktop layouts for different screen sizes

The mock data is defined in `src/data/mockCommit.ts` and includes:
- Basic commit metadata (hash, title, author, date)
- Diff content (formatted Git diff)
- AI analysis with multiple assessment criteria and scores

## Goals

- Replace mock commit data with real information from the database
- Implement commit analysis using AI to provide insights
- Enhance diff visualization with improved context and navigation
- Add repository and author contextual information to commits
- Optimize performance for large commits and diffs

## User Stories

### Story 6.1: Commit Data Infrastructure (1-2 days)

**Description**: Set up the database schema, API endpoints, and core data hooks needed to fetch and display commit data.

**Tasks**:
- **Task 6.1.1**: Enhance database schema for commits (3 hours)
  - Add required fields to the commits table (repository_id, branch, parent_hash, stats_summary)
  - Create appropriate indexes for efficient queries
  - Add relationships to repositories and contributors tables

- **Task 6.1.2**: Create core commits data hooks (5 hours)
  - Implement `useCommit` hook for fetching a single commit by hash
  - Create `useCommitsList` hook for fetching paginated commits
  - Add filtering by repository, author, date range
  - Implement proper error handling and loading states

- **Task 6.1.3**: Build commits selector/navigator utility (4 hours)
  - Create a component for navigating between commits
  - Implement filtering by repository, author, branch
  - Add search functionality for commit messages
  - Ensure responsive design for different screen sizes

**Acceptance Criteria**:
- Enhanced database schema is correctly implemented
- Core data hooks fetch real commit data from the database
- Commit selection/navigation works with real data
- Loading and error states are handled gracefully
- Database queries are optimized for performance

**Technical Considerations**:
- Ensure backward compatibility with existing schema
- Use proper indexing for frequently queried fields
- Implement efficient pagination for commits list
- Follow existing patterns for React Query hooks

---

### Story 6.2: Commit Details Integration (2-3 days)

**Description**: Connect the existing CommitHeader component to real data from the database, displaying comprehensive commit details.

**Tasks**:
- **Task 6.2.1**: Implement `useCommitDetails` React Query hook (4 hours)
  - Fetch commit data with author and repository information
  - Include commit statistics (files changed, additions, deletions)
  - Add related commits (parent, children) information
  - Implement error handling and loading states

- **Task 6.2.2**: Update CommitHeader component (6 hours)
  - Connect component to `useCommitDetails` hook
  - Display author information with avatar and name
  - Show repository context and branch information
  - Add timestamp with relative and absolute formats
  - Implement proper error and loading states

- **Task 6.2.3**: Create CommitMetadata component (3 hours)
  - Build component to display technical commit metadata
  - Show hash, parent hash, branch information
  - Add repository context with link to repository page
  - Implement copy-to-clipboard functionality for hashes

**Acceptance Criteria**:
- CommitHeader displays real commit data from the database
- Author information is correctly displayed with avatar
- Repository context is provided for each commit
- All date formats are correctly displayed
- Loading and error states are handled gracefully
- All features work on both mobile and desktop layouts

**Technical Considerations**:
- Preserve existing UI design and component structure
- Use Supabase joins for efficient data fetching
- Add proper caching for repeated commit views
- Ensure responsive design for all screen sizes

---

### Story 6.3: Commit Diff Visualization (2-3 days)

**Description**: Connect the CommitDiff component to real data and enhance the diff visualization with syntax highlighting and navigation features.

**Tasks**:
- **Task 6.3.1**: Implement `useCommitDiff` React Query hook (5 hours)
  - Fetch diff content with file information
  - Process raw diff content into structured format
  - Add syntax highlighting for different file types
  - Implement chunking for large diffs to improve performance

- **Task 6.3.2**: Update CommitDiff component (6 hours)
  - Connect component to `useCommitDiff` hook
  - Implement file-level navigation for multi-file commits
  - Add line numbers and change indicators
  - Create expand/collapse functionality for diff blocks
  - Implement proper loading and error states

- **Task 6.3.3**: Add diff statistics visualization (3 hours)
  - Create visual representation of changes per file
  - Implement file type distribution chart
  - Add summary statistics display (insertions, deletions, files changed)
  - Ensure responsive design for different screen sizes

**Acceptance Criteria**:
- CommitDiff displays real diff data from the database
- Syntax highlighting works for different programming languages
- File navigation works correctly for multi-file commits
- Expand/collapse functionality works for diff blocks
- Statistics visualization accurately represents commit changes
- All features work on both mobile and desktop layouts

**Technical Considerations**:
- Use parse-diff for processing raw diff content
- Leverage prism or highlight.js for syntax highlighting
- Implement virtual rendering for large diffs
- Ensure responsive design for all screen sizes
- Optimize loading performance for large diffs

---

### Story 6.4: Commit Analysis Integration (3-4 days)

**Description**: Implement AI-powered commit analysis to provide insights and connect the CommitAnalysis component to real data.

**Tasks**:
- **Task 6.4.1**: Create commit_analyses database table (3 hours)
  - Design schema for storing analysis results
  - Add relationships to commits table
  - Create indexes for efficient queries
  - Implement update triggers if needed

- **Task 6.4.2**: Build commit analysis generation service (8 hours)
  - Create analysis prompt templates for different aspects
  - Implement service to process commit content with AI
  - Add scoring system for different assessment criteria
  - Store analysis results in database
  - Implement error handling and retry mechanism

- **Task 6.4.3**: Implement `useCommitAnalysis` React Query hook (4 hours)
  - Fetch analysis data for a specific commit
  - Add on-demand analysis generation functionality
  - Implement loading, generating, and error states
  - Add polling for analysis completion status

- **Task 6.4.4**: Update CommitAnalysis component (6 hours)
  - Connect component to `useCommitAnalysis` hook
  - Display multiple analysis criteria with scores
  - Add detailed explanations for each criterion
  - Implement proper loading, generating, and error states
  - Create UI for requesting new analysis generation

**Acceptance Criteria**:
- CommitAnalysis displays real analysis data from the database
- Analysis is generated on demand when not available
- Multiple assessment criteria are displayed with appropriate scores
- Loading, generating, and error states are handled gracefully
- Users can request new analysis for existing commits
- All features work on both mobile and desktop layouts

**Technical Considerations**:
- Use TypeScript for type-safe analysis data structure
- Implement proper error handling for AI service
- Optimize database queries for performance
- Ensure responsive design for all screen sizes
- Add caching to avoid redundant analysis generation

---

### Story 6.5: Commit in Repository Context (2-3 days)

**Description**: Add contextual information to show how a commit relates to its repository, including timeline, related PRs, and author insights.

**Tasks**:
- **Task 6.5.1**: Implement `useCommitContext` React Query hook (4 hours)
  - Fetch repository information related to the commit
  - Get parent and child commits information
  - Add branch context and position information
  - Include related PR information if applicable

- **Task 6.5.2**: Create CommitTimeline component (6 hours)
  - Build visualization of commit history around current commit
  - Show parent and child commits with relationships
  - Add branch visualization with merge points
  - Implement navigation to other commits
  - Ensure responsive design for different screen sizes

- **Task 6.5.3**: Implement CommitRelatedPRs component (4 hours)
  - Show pull requests that include the current commit
  - Display PR status, title, and author information
  - Add links to PR pages for further exploration
  - Implement proper loading and error states

**Acceptance Criteria**:
- Repository context is correctly displayed for each commit
- Timeline visualization shows commit relationships accurately
- Related PRs are displayed with correct information
- Navigation between related commits works properly
- All features work on both mobile and desktop layouts

**Technical Considerations**:
- Use efficient database queries to avoid performance issues
- Implement proper caching for repository context
- Use SVG for timeline visualization
- Ensure responsive design for all screen sizes
- Optimize for repositories with many commits

---

### Story 6.6: Author Impact Analysis (2-3 days)

**Description**: Add author-focused analysis to provide insights into the developer's contribution patterns and impact.

**Tasks**:
- **Task 6.6.1**: Implement author contribution metrics calculation (5 hours)
  - Create database function for calculating author metrics
  - Add commit frequency, size, and impact metrics
  - Implement trend analysis over time
  - Add comparison against repository averages

- **Task 6.6.2**: Create `useAuthorImpact` React Query hook (4 hours)
  - Fetch author impact metrics for a specific commit
  - Include historical trend data for the author
  - Add repository context for the author's contributions
  - Implement proper loading and error states

- **Task 6.6.3**: Build DeveloperInsights component (6 hours)
  - Display author contribution patterns visualization
  - Show historical trend charts for the author
  - Add metrics comparison against repository averages
  - Implement responsive design for different screen sizes

**Acceptance Criteria**:
- Author impact metrics are correctly calculated and displayed
- Historical trends are visualized with appropriate charts
- Comparison against repository averages is accurate
- All visualizations are interactive and informative
- All features work on both mobile and desktop layouts

**Technical Considerations**:
- Use efficient database aggregation for metrics calculation
- Implement proper caching for author metrics
- Use Recharts for data visualization
- Ensure responsive design for all screen sizes
- Optimize for authors with many contributions

---

### Story 6.7: Performance Optimization and Testing (2 days)

**Description**: Optimize performance of the Commits page and implement comprehensive testing to ensure reliability.

**Tasks**:
- **Task 6.7.1**: Implement database query optimization (4 hours)
  - Add proper indexing for frequent query patterns
  - Optimize joins and aggregations
  - Implement query result caching
  - Measure and improve query performance

- **Task 6.7.2**: Add frontend optimizations (5 hours)
  - Implement code splitting for large components
  - Add virtual rendering for long lists
  - Optimize rendering performance for diff visualization
  - Implement skeleton loaders for improved UX
  - Add prefetching for linked commits

- **Task 6.7.3**: Implement comprehensive testing (6 hours)
  - Add unit tests for utility functions
  - Implement integration tests for data hooks
  - Create UI component tests with mock data
  - Add end-to-end tests for critical user flows

**Acceptance Criteria**:
- Page load times are under 2 seconds on typical connections
- Large diffs render efficiently without performance issues
- All components handle loading and error states gracefully
- Tests cover all critical functionality
- Code quality meets project standards

**Technical Considerations**:
- Use React Query's built-in caching capabilities
- Implement virtual scrolling for long diffs
- Add memoization for expensive calculations
- Use skeleton loaders for better perceived performance
- Implement proper error boundaries

## Dependencies

- Epic 1: Foundation & Infrastructure (for database schema and API integration)
- Epic 3: Repository Page Integration (for repository context)
- Epic 4: Contributors Page Integration (for author information)

## Definition of Done

- All commit-related components display real data from the database
- Diff visualization works with actual commit changes
- AI analysis provides meaningful insights on commits
- Repository context shows commit relationships accurately
- Author impact analysis shows contribution patterns
- All components handle loading, empty, and error states appropriately
- All functionality works correctly on both mobile and desktop views
- Performance is optimized for loading and rendering large commits
- Documentation is updated with new hooks and components
- Tests are implemented and passing
