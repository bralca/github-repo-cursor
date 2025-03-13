
# Repository Page Architecture

## Overview

The Repository page serves as the central hub for viewing and analyzing GitHub repositories. It provides a comprehensive dashboard-like interface that displays repository metadata, contributor information, code change metrics, repository health statistics, and recent development activity. This document outlines the architecture, components, data flow, and implementation details of the Repository page.

## Key Features

- Repository selection and metadata display
- Contributor statistics and visualization
- Code contribution heatmap
- Repository health metrics dashboard
- Recent merge request activity timeline
- Commit history visualization

## Component Hierarchy

```
Repositories (Page Container)
├── Navigation
├── RepositorySelector
├── Repository Metadata Display
│   ├── CompactStatCard (multiple instances)
│   └── MetadataGrid
├── Contributors
│   ├── ContributorCard (multiple instances)
│   └── ContributorSkeleton (loading state)
├── ContributionHeatmap
│   ├── TimeframeSelector
│   └── HeatmapGrid
├── HealthMetrics
│   ├── CodeChangesChart
│   ├── CycleTimeStats
│   └── ComplexityAnalysis
├── MergeRequestsTable
│   ├── MergeRequestBranchInfo
│   └── ScrollableTable (responsive)
└── CommitTimeline
    └── CommitTimelineItem (multiple instances)
```

## Component Details

### 1. Repositories (Page Container)

**File Path**: `src/pages/Repositories.tsx`

**Purpose**: Serves as the main container for the repository dashboard, orchestrating data fetching and component composition.

**State Management**:
- `selectedRepositoryId`: Tracks the currently selected repository
- Uses location state to handle direct navigation to specific repositories

**Data Sources**:
- Primary data: `useRepositoryData` hook fetching from `repositories` and `merge_requests` tables
- Fallback to mock data when no repository is selected

**Key UI Elements**:
- Overall page layout with responsive design
- Navigation header
- Repository selector dropdown
- Content sections for different repository aspects

**Interactions**:
- Repository selection
- Tab switching between user and developer views
- Copy repository ID functionality

### 2. RepositorySelector

**File Path**: `src/components/repository/RepositorySelector.tsx`

**Purpose**: Provides UI for selecting a repository to view

**Props**:
- `selectedRepositoryId`: Currently selected repository ID
- `onSelectRepository`: Callback function for repository selection

**Data Sources**:
- Fetches repository list from `repositories` table

**Key UI Elements**:
- Dropdown menu with repository names
- Search functionality

**Data Flow**:
- When a repository is selected, passes the ID back to the parent component
- Updates the repository context across the application

### 3. Contributors Component

**File Path**: `src/components/repository/Contributors.tsx`

**Purpose**: Displays top contributors for the selected repository

**Props**:
- `repositoryId`: ID of the selected repository

**Data Flow**:
- Fetches data using `useRepositoryContributors` hook
- Transforms contributor data for display
- Renders loading state during data fetch

**Database Queries**:
- Queries `repository_top_contributors` table with:
  - `contributor_id`
  - `username`
  - `name`
  - `avatar`
  - `role_classification`
  - `impact_score`
  - `contribution_count`
  - `lines_added`
  - `lines_removed`

**UI Elements**:
- Contributor cards with avatar, name, and contribution statistics
- Role classification badges
- Contribution metrics visualization

### 4. ContributionHeatmap

**File Path**: `src/components/repository/ContributionHeatmap.tsx`

**Purpose**: Visualizes commit activity over time in a heatmap/calendar view

**Props**:
- `repositoryId`: ID of the selected repository

**State Management**:
- `timeFrame`: Selected time range (year, month, week)

**Data Sources**:
- Uses `useRepositoryActivity` hook to fetch activity data from `commits` table

**Key UI Elements**:
- Time frame selector
- Heatmap grid showing activity density
- Tooltips showing detailed contribution information

**Data Transformations**:
- Aggregates commit data into time-based buckets
- Maps commit frequency to color intensity

### 5. HealthMetrics

**File Path**: `src/components/repository/HealthMetrics.tsx`

**Purpose**: Displays repository health statistics in a dashboard format

**Props**:
- `repositoryId`: ID of the selected repository

**Data Sources**:
- `useRepositoryCodeChanges`: Fetches code changes data from `commits` table
- `useRepositoryCycleTime`: Fetches cycle time statistics from `merge_requests` table
- `useRepositoryComplexityScore`: Fetches complexity scores from `merge_requests` table

**UI Elements**:
- Code changes bar chart comparing additions and deletions
- Cycle time statistics display
- Complexity analysis metrics

**Data Transformations**:
- Aggregates raw data into statistical measures (avg, median, min, max)
- Formats data for visualization components

### 6. MergeRequestsTable (Integrated in Repositories page)

**Purpose**: Displays recent merge request activity

**Data Sources**:
- Uses repository data from parent component, specifically the `latestMergeRequests` property
- Falls back to mock data when no real data is available

**UI Elements**:
- Responsive table with merge request details
- Mobile-friendly card view for smaller screens
- Visual indicators for code changes

**Key Columns Displayed**:
- Title
- Branch information
- Code changes (additions/removals)
- Files changed
- Commit count
- Merge date

### 7. CommitTimeline

**File Path**: `src/components/repository/CommitTimeline.tsx`

**Purpose**: Visualizes the most recent commits as a vertical timeline

**Props**:
- `repositoryId`: ID of the selected repository

**Data Flow**:
- Directly queries Supabase for commit data
- Transforms commit data for display
- Handles loading states and empty data scenarios

**Database Queries**:
- Queries `commits` table for:
  - `id`
  - `hash`
  - `title`
  - `author`
  - `committed_date`
  - `author_name`
  - `stats_additions`
  - `stats_deletions`
  - `files_changed`

**UI Elements**:
- Vertical timeline with commit entries
- Author avatar and information
- Commit hash and title
- Code change statistics
- Relative time indicators

## Hook Details

### 1. useRepositoryData

**File Path**: `src/hooks/useRepositoryData.ts`

**Purpose**: Fetches comprehensive data for a selected repository

**Parameters**:
- `repositoryId`: ID of the repository to fetch

**Data Flow**:
- Fetches repository data from `repositories` table
- Fetches related merge requests from `merge_requests` table
- Maps database entities to frontend models using `mapDbRepositoryToRepository`

**Key Transformations**:
- Converts database timestamps to relative time strings
- Structures merge request data for UI consumption
- Handles error cases with appropriate logging

### 2. useRepositoryContributors

**File Path**: `src/hooks/useRepositoryContributors.ts`

**Purpose**: Fetches and processes contributor data for a repository

**Parameters**:
- `repositoryId`: ID of the repository

**Data Flow**:
- Queries `contributor_repository` table for repository-contributor relationships
- Fetches contributor details from `repository_top_contributors` table
- Fetches commit data to calculate contribution metrics
- Processes commit diffs to count lines added/removed

**Key Transformations**:
- Parses diff content to extract line change statistics
- Maps contributor IDs to detailed profile information
- Sorts contributors by contribution count

### 3. useRepositoryCycleTime

**File Path**: `src/hooks/useRepositoryCycleTime.ts`

**Purpose**: Calculates cycle time statistics for merge requests

**Parameters**:
- `repositoryId`: ID of the repository

**Data Flow**:
- Queries `merge_requests` table for cycle time data
- Calculates statistical metrics (avg, median, min, max)
- Formats results for display

**Key Calculations**:
- Average cycle time
- Median cycle time
- Minimum and maximum cycle times

### 4. useRepositoryComplexityScore

**File Path**: `src/hooks/useRepositoryComplexityScore.ts`

**Purpose**: Calculates complexity score statistics for merge requests

**Parameters**:
- `repositoryId`: ID of the repository

**Data Flow**:
- Queries `merge_requests` table for complexity scores
- Performs statistical calculations on the scores
- Formats and returns the processed data

### 5. useRepositoryCodeChanges

**File Path**: `src/hooks/useRepositoryCodeChanges.ts`

**Purpose**: Fetches code change metrics for visualization

**Parameters**:
- `repositoryId`: ID of the repository

**Data Flow**:
- Attempts to fetch enriched commit data first
- Falls back to merge request data if needed
- Calculates total lines added and removed

## Data Flow

### Data Fetching Strategy

1. **Initial Load**:
   - Repository page loads with either:
     - Default view (no repository selected)
     - Pre-selected repository from navigation state

2. **Repository Selection**:
   - User selects a repository from the dropdown
   - `selectedRepositoryId` state updates
   - All data hooks are triggered with the new ID

3. **Data Cascade**:
   - Repository metadata loads first
   - Child components receive the repository ID and fetch their specific data
   - Each component manages its own loading state

### Caching Strategy

- React Query is used for data fetching and caching
- Query keys include both the endpoint and repository ID for cache isolation
- Default stale time settings prevent excessive refetching

### Error Handling

- Each hook includes error handling for database query failures
- Components display appropriate UI for error states
- Console logging for detailed error information
- Fallback to mock data when appropriate

## Performance Considerations

### Optimizations

1. **Data Fetching**:
   - Queries are enabled only when repository ID is available
   - Appropriate limits are applied to queries (e.g., top 10 merge requests)
   - Data transformations happen in hooks rather than components

2. **Rendering**:
   - Responsive design with mobile-specific optimizations
   - Mobile view uses simplified card layouts instead of tables
   - Skeleton loading states for better perceived performance

3. **Component Structure**:
   - Page divided into focused components with specific responsibilities
   - Each component fetches only the data it needs

### Potential Bottlenecks

1. **Large Data Sets**:
   - Very active repositories might have thousands of commits/merge requests
   - Current implementation limits data retrieval and focuses on recent activity

2. **Diff Parsing**:
   - Parsing commit diffs is CPU-intensive
   - Implementation uses lightweight parsing and caching

## Responsive Design Implementation

The Repository page employs several techniques to ensure a good experience across device sizes:

1. **Grid System**:
   - Uses responsive Tailwind CSS grid and flexbox layouts
   - Adjusts column counts based on screen size

2. **Component Adaptation**:
   - Table views on desktop convert to card views on mobile
   - Navigation adjusts for smaller screens
   - Font sizes and spacing scale appropriately

3. **Conditional Rendering**:
   - Some detailed information is hidden in collapsible sections on mobile
   - Different component organization on smaller screens

4. **Detection Mechanism**:
   - Custom `useIsMobile` hook detects viewport size
   - Components render different layouts based on device type

## User Interactions

### Repository Selection

- User can select repositories from dropdown
- Selection is preserved in state and reflected in the URL
- Repository ID can be copied to clipboard

### Data Visualization Interaction

- Time frame selection for contribution heatmap
- Tooltips for additional information on hover
- Tab switching between user and developer views

### View Options

- Detail expansion/collapse for mobile views
- Sorting options for data tables
- Responsive navigation between different repository aspects

## Conclusion

The Repository page architecture follows a component-based approach where each component is responsible for fetching and displaying specific aspects of repository data. This modular design allows for:

1. **Separation of concerns**: Each component focuses on a specific aspect of repository data
2. **Efficient data loading**: Components load data independently and only when needed
3. **Flexible UI composition**: Components can be rearranged or modified without affecting others
4. **Progressive enhancement**: Basic functionality works with minimal data, while richer features appear as more data becomes available

The architecture balances between showing comprehensive repository information and maintaining performance, with a focus on presenting the most relevant and recent activity data to users.
