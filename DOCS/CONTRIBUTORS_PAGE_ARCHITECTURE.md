
# Contributors Page Architecture

## Overview

The Contributors page serves as a comprehensive profile viewer for developers who have contributed to repositories tracked in the GitHub Explorer application. It presents a detailed view of individual contributor metrics, activity history, and impact across repositories. This page allows users to select different contributors, view their statistics, analyze their contribution patterns, and understand their impact on projects through visualizations and activity feeds.

## Key Features

- Contributor selection and profile display
- Contribution metrics with visual representation
- Historical activity heatmap
- Merge request history and analysis
- Recent activity timeline
- Repository contributions overview

## Component Hierarchy

```
Contributors (Page Container)
├── Navigation
├── ContributorSelector
├── ContributorHero
│   ├── ProfileHeader
│   ├── ContributionSummary
│   └── ContributorStats
├── ContributorActivityHeatmap
│   ├── TimeframeSelector
│   └── HeatmapGrid
├── ContributorMergeRequests
│   ├── MergeRequestCard (multiple instances)
│   └── MergeRequestSkeleton (loading state)
└── RecentActivity
    └── ActivityItem (multiple instances)
```

## Component Details

### 1. Contributors (Page Container)

**File Path**: `src/pages/Contributors.tsx`

**Purpose**: Serves as the main container for the contributors dashboard, orchestrating data fetching and component composition.

**State Management**:
- `selectedContributorId`: Tracks the currently selected contributor
- `isDarkMode`: Manages theme toggle functionality
- Uses various query hooks for data fetching

**Data Sources**:
- Primary data: `useQuery` hooks fetching from `contributors`, `commits`, and `merge_requests` tables
- Fallback to mock data when no contributor is selected

**Key UI Elements**:
- Overall page layout with responsive design
- Navigation header
- Contributor selector dropdown
- Three-column layout (on desktop) with profile and metrics

**Interactions**:
- Contributor selection
- Theme toggling
- Navigation between different views

### 2. ContributorSelector

**File Path**: `src/components/contributors/ContributorSelector.tsx`

**Purpose**: Provides UI for selecting a contributor to view

**Props**:
- `selectedContributorId`: Currently selected contributor ID
- `onSelectContributor`: Callback function for contributor selection

**Data Sources**:
- Uses `useTopContributorsByCommits` hook which queries contributor data and sorts by commit count
- Leverages the custom Supabase database function `get_top_contributors_by_commits`

**Key UI Elements**:
- Dropdown menu with contributor names, avatars, and contribution metrics
- Search functionality (if implemented)
- Loading state indication
- Option for "demo" data

**Data Flow**:
- Fetches top contributors sorted by commit count
- Filters non-bot contributors
- Passes selection back to parent component
- Updates the contributor context across the application

### 3. ContributorHero

**File Path**: `src/components/contributors/ContributorHero.tsx`

**Purpose**: Displays key information about the selected contributor in a hero section

**Props**:
- `contributor`: Contributor object with profile and metrics data

**Data Sources**:
- Receives contributor data from parent component
- Data includes profile information and contribution metrics

**UI Elements**:
- Profile avatar and name display
- GitHub username and link
- Social media links
- Company and location information
- Bio/description
- Contribution summary statistics
- Role classification badge

**Subcomponents**:
- `ContributionSummary`: Displays contribution statistics
- Visual metrics for lines added/removed
- Time-based contribution metrics

### 4. ContributorActivityHeatmap

**File Path**: `src/components/contributors/ContributorActivityHeatmap.tsx`

**Purpose**: Visualizes commit activity over time in a heatmap/calendar view

**Props**:
- `contributorId`: ID of the selected contributor
- `summary`: Object containing contribution summary data

**State Management**:
- `timeFrame`: Selected time range (year, month, week)

**Data Sources**:
- Fetches commits data from `commits` table filtered by `author` (contributor ID)
- Uses date ranges to organize activity data 

**Key UI Elements**:
- Time frame selector
- Heatmap grid showing activity density
- Color legends for activity levels
- Tooltips showing detailed contribution information
- First and last contribution date highlighting

**Data Transformations**:
- Aggregates commit data into daily/weekly/monthly buckets
- Maps commit frequency to color intensity
- Calculates active days percentage

### 5. ContributorMergeRequests

**File Path**: `src/components/contributors/ContributorMergeRequests.tsx`

**Purpose**: Displays merge request activity for the selected contributor

**Props**:
- `contributorId`: ID of the selected contributor

**Data Sources**:
- Uses `useQuery` to fetch merge request data with the Supabase database function `get_contributor_merge_requests_with_impact`
- Data includes merge request details and the contributor's impact on each one

**UI Elements**:
- Merge request cards with title, date, and status
- Code impact statistics (lines added/removed)
- Impact percentage visualization
- Branch information
- Status indicators
- Timeline representation
- Responsive design for different screen sizes

**Data Transformations**:
- Calculates contributor impact percentage
- Formats dates for readability
- Transforms raw merge request data for display

### 6. RecentActivity

**File Path**: `src/components/contributors/RecentActivity.tsx`

**Purpose**: Visualizes the most recent commit activity as a vertical timeline

**Props**:
- `activities`: Array of recent activity data
- `contributorId`: ID of the selected contributor

**Data Flow**:
- Directly queries Supabase for commit data when a contributor is selected
- Transforms commit data for display
- Handles loading states and empty data scenarios

**Database Queries**:
- Queries `commits` table for:
  - `id`
  - `hash`
  - `title`
  - `committed_date`
  - `stats_additions`
  - `stats_deletions`
  - `files_changed`

**UI Elements**:
- Vertical timeline with commit entries
- Commit hash and title display
- Relative time indicators
- Code change statistics
- Linked repository information
- Empty state handling

## Hook Details

### 1. useTopContributorsByCommits

**File Path**: `src/components/contributors/ContributorSelector.tsx`

**Purpose**: Fetches top contributors sorted by commit count

**Parameters**:
- `limit`: Maximum number of contributors to fetch (default: 100)

**Data Flow**:
- Calls the Supabase RPC function `get_top_contributors_by_commits`
- Fetches contributor details from the `contributors` table
- Filters out bot accounts and ensures enriched data
- Combines commit counts with contributor profiles
- Returns sorted list by commit count

**Key Transformations**:
- Maps contributor IDs to detailed profile information
- Filters out bot accounts using name/username patterns
- Adds commit count to contributor objects

### 2. Contributor Data Hooks

Several hooks are used in the Contributors page to fetch and process contributor data:

**Commit Dates Query**:
- Fetches first and last commit dates for a contributor
- Used to calculate coding tenure and activity period
- Queries `commits` table ordered by `committed_date`

**Code Stats Query**:
- Calculates total lines added and removed by a contributor
- Aggregates statistics from the `commits` table
- Filters for enriched commits to ensure data quality

**Contributor Profile Query**:
- Fetches detailed contributor profile information
- Combines GitHub profile data with local contribution metrics
- Transforms raw database records into formatted display data

## Data Flow

### Data Fetching Strategy

1. **Initial Load**:
   - Contributors page loads with either:
     - Default view (no contributor selected)
     - Demo data for showcase

2. **Contributor Selection**:
   - User selects a contributor from the dropdown
   - `selectedContributorId` state updates
   - All data hooks are triggered with the new ID

3. **Data Cascade**:
   - Contributor profile data loads first
   - Commit history and statistics are fetched
   - Merge request data loads
   - Activity data is processed and visualized

### Caching Strategy

- React Query is used for data fetching and caching
- Query keys include both the endpoint and contributor ID for cache isolation
- Default stale time settings prevent excessive refetching
- Data is shared between components where appropriate

### Error Handling

- Each hook includes error handling for database query failures
- Components display appropriate UI for error states
- Console logging for detailed error information
- Fallback to mock data when appropriate

## Performance Considerations

### Optimizations

1. **Data Fetching**:
   - Queries are enabled only when contributor ID is available
   - Appropriate limits are applied to queries (e.g., most recent commits)
   - Database functions used for complex queries to minimize data transfer

2. **Rendering**:
   - Responsive design with mobile-specific optimizations
   - Lazy loading for certain components and data
   - Skeleton loading states for better perceived performance

3. **Component Structure**:
   - Page divided into focused components with specific responsibilities
   - Each component fetches only the data it needs
   - Custom hooks for reusable data fetching logic

### Potential Bottlenecks

1. **Large Data Sets**:
   - Prolific contributors might have thousands of commits/merge requests
   - Current implementation limits data retrieval and focuses on recent activity
   - Pagination for merge requests and activity timeline

2. **Complex Calculations**:
   - Impact score calculations can be CPU-intensive
   - Implementation performs calculations at the database level where possible
   - Memoization for expensive frontend calculations

## Responsive Design Implementation

The Contributors page employs several techniques to ensure a good experience across device sizes:

1. **Grid System**:
   - Uses responsive Tailwind CSS grid and flexbox layouts
   - Shifts from three-column to single-column layout on mobile

2. **Component Adaptation**:
   - Hero section condenses on mobile
   - Charts and visualizations resize appropriately
   - Data tables convert to cards on smaller screens

3. **Conditional Rendering**:
   - Some detailed information is hidden in collapsible sections on mobile
   - Different component organization on smaller screens
   - Prioritized content display based on screen size

4. **Detection Mechanism**:
   - CSS media queries for responsive layouts
   - Conditional rendering based on screen width

## User Interactions

### Contributor Selection

- User can select contributors from dropdown
- Selection is preserved in state
- UI updates to reflect selected contributor's data
- Default/demo view available

### Data Visualization Interaction

- Heatmap time frame selection
- Tooltips for additional information on hover
- Merge request filtering and sorting (if implemented)

### Drill-Down Capabilities

- Links to repositories the contributor has worked on
- Detailed view of specific merge requests
- Timeline navigation through activity history

## Visualization Components

### 1. Activity Heatmap

**Purpose**: Visualizes contribution frequency over time

**Data Requirements**:
- Commit timestamps grouped by day
- Activity intensity metrics

**Key Features**:
- Color-coded cells representing activity levels
- Time period selection (1 month, 3 months, 1 year, all time)
- Tooltips showing detailed contribution counts
- First/last contribution indicators

### 2. Contribution Statistics

**Purpose**: Shows composition of contributor's work

**Data Requirements**:
- Lines added/removed totals
- Commit counts
- Merge request statistics
- Issue involvement metrics

**Key Features**:
- Bar and pie charts for contribution type breakdown
- Sparklines for trend visualization
- Comparisons with repository averages
- Impact score representation

## Algorithms and Calculations

### 1. Impact Score Calculation

The impact score is a composite metric calculated based on:
- Commit frequency and size
- Code review involvement
- Merge request quality
- Documentation contributions
- Issue resolution rate

The algorithm weights these factors and normalizes the score on a 0-100 scale.

### 2. Activity Density Analysis

Used in the heatmap visualization to:
- Calculate activity frequency per time period
- Map frequency to color intensity
- Identify patterns in contribution timing
- Detect contribution streaks

### 3. Contribution Percentage Calculation

For merge requests:
- Calculates the percentage of each merge request that the contributor was responsible for
- Based on lines of code added/removed by the contributor versus total changes
- Provides insight into the contributor's level of involvement

## Conclusion

The Contributors page architecture follows a component-based approach where each component is responsible for fetching and displaying specific aspects of contributor data. This modular design allows for:

1. **Separation of concerns**: Each component focuses on a specific aspect of contributor data
2. **Efficient data loading**: Components load data independently and only when needed
3. **Flexible UI composition**: Components can be rearranged or modified without affecting others
4. **Progressive enhancement**: Basic functionality works with minimal data, while richer features appear as more data becomes available

The architecture balances between showing comprehensive contributor information and maintaining performance, with a focus on presenting the most relevant and recent activity data to users.
