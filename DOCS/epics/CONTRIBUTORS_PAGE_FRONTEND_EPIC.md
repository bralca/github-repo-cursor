# Epic: Contributors Page Frontend Implementation

## Overview

This epic covers the frontend implementation required for the Contributors Page based on the provided design architecture. The existing Contributors Page needs to be updated to match the new design while maintaining compatibility with the current URL structure and data fetching patterns.

## Data Loading Strategy

### Server-Side Rendering (SSR)
The following data should be loaded via SSR because it's critical for SEO:
- Contributor basic profile information (name, username, avatar, bio) - `/api/contributors/id/:id`
- Profile metadata (active period, organizations, top languages) - `/api/contributors/:id/profile-metadata`
- Repository associations - `/api/contributors/:id/repositories` (first page only)
- Basic activity metrics (commit count, PR count)

These should be loaded in the page's `getServerSideProps` to ensure they're available on initial page load and visible to search engines.

### Client-Side Rendering (CSR)
The following data should be loaded via CSR using React Query or similar for efficient caching:
- Activity heatmap data - `/api/contributors/:id/activity?timeframe=1year`
- Code impact metrics - `/api/contributors/:id/impact`
- Detailed merge request data - `/api/contributors/:id/merge-requests`
- Recent activity timeline - `/api/contributors/:id/recent-activity`
- Rankings and detailed metrics - `/api/contributors/:id/rankings`
- Any data that requires filtering or sorting on the client

This approach ensures critical data appears immediately while deferring less SEO-critical interactive elements to client-side loading.

> **Note:** Throughout this document, we've provided detailed API implementation guidance for each component, including specific endpoint usage, response structure, and React Query implementation examples. These specifications ensure consistent implementation and alignment with the backend endpoints that have been completed in the CONTRIBUTORS_PAGE_BACKEND_EPIC.

## Acceptance Criteria

1. All components are implemented according to the design architecture document
2. UI follows the established design guidelines
3. Data is fetched from the backend API endpoints
4. The page maintains backward compatibility with existing URL structures
5. All components are responsive across device sizes
6. Loading states and error handling are implemented for all components
7. All user interactions work as expected

## Stories

### Story 1: Update Page Container and Layout

Update the Contributors Page container component to match the new design architecture.

#### Task 1.1: Update Page Container Structure

**Description:**  
Restructure the existing Contributors page container to follow the new component hierarchy.

**Acceptance Criteria:**
- Page container uses the layout structure defined in the architecture document
- Page maintains existing URL structure and routing
- Container properly manages state for selected contributors
- Container orchestrates data fetching for all child components

**Implementation Notes:**
- Maintain the current URL pattern: `/contributors/[contributorSlug]`
- Keep using the existing page component in the app router
- Update the layout to use a three-column grid on desktop as per design
- Use GitHub ID as the identifier in the URL, not UUID
- Implement getServerSideProps for SSR data fetching:

```javascript
export async function getServerSideProps({ params }) {
  const { contributorSlug } = params;
  
  try {
    // Main contributor data (SSR)
    const contributorData = await fetch(`${process.env.API_URL}/api/contributors/id/${contributorSlug}`);
    const contributor = await contributorData.json();
    
    // Profile metadata (SSR)
    const metadataData = await fetch(`${process.env.API_URL}/api/contributors/${contributorSlug}/profile-metadata`);
    const metadata = await metadataData.json();
    
    // First page of repositories (SSR)
    const reposData = await fetch(`${process.env.API_URL}/api/contributors/${contributorSlug}/repositories?limit=5&offset=0`);
    const repositories = await reposData.json();
    
    return {
      props: {
        contributor,
        metadata,
        repositories,
        contributorId: contributorSlug
      }
    };
  } catch (error) {
    console.error("Error fetching contributor:", error);
    return {
      notFound: true
    };
  }
}
```

**Implementation Prompt:**
```
Review the existing `ContributorContent.tsx` component and update it to follow the new architecture:

1. Maintain the same data fetching pattern but update the layout structure
2. Structure the component to include all the required child components:
   - ContributorSelector
   - ContributorHero
   - ContributorActivityHeatmap
   - ContributorMergeRequests
   - RecentActivity
3. Set up the appropriate state management for:
   - Selected contributor
   - UI states (loading, error)
   - Time frame selections
4. Ensure the page layout follows the design guidelines with:
   - Three-column layout on desktop
   - Single column on mobile
   - Proper spacing and container styles using Tailwind CSS

The implementation should maintain all existing functionality while updating the visual structure.
```

#### Task 1.2: Implement Navigation and Contributor Selection

**Description:**  
Implement the navigation header and contributor selection component.

**Acceptance Criteria:**
- Navigation header is implemented as per design
- Contributor selector dropdown allows users to select different contributors
- Selection properly updates the page URL and state
- Loading state is shown while contributor data is being fetched

**Implementation Notes:**
- Reuse existing navigation components where possible
- Ensure the selector fetches from the same data source currently in use

**Implementation Prompt:**
```
Update or create the ContributorSelector component:

1. Use the shadcn/ui components for the dropdown interface
2. Fetch contributor data using the existing API pattern
3. Display contributor avatars, names, and basic metrics in the dropdown
4. Handle selection changes by updating the URL and parent component state
5. Implement appropriate loading and error states
6. Follow the design guidelines for styling dropdowns and selection components

The component should maintain compatibility with existing data structures while providing an updated UI.
```

### Story 2: Implement Contributor Hero Section

Create the hero section that displays the contributor's profile and key metrics.

#### Task 2.1: Implement ProfileHeader Component

**Description:**  
Create a component to display the contributor's profile information.

**Acceptance Criteria:**
- Displays contributor avatar, name, and GitHub username
- Shows social links and additional profile information
- Layout matches the design with proper responsiveness
- Displays role classification badge

**Implementation Notes:**
- Use the glass card effect from the design guidelines
- Ensure all profile information from the API is used

**Implementation Prompt:**
```
Create a ProfileHeader component that showcases the contributor's information:

1. Use the glass card effect from the design guidelines with `bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm`
2. Display the contributor's avatar with proper sizing and fallback
3. Show the contributor's name (e.g., "Sarah Johnson") with appropriate typography
4. Show GitHub username (e.g., "sarahcodes") with GitHub icon
5. Include the contributor's bio description
6. Show location information with location icon
7. Include links to GitHub profile and any social media accounts
8. Add a role classification badge with appropriate styling
9. Ensure the component is responsive, condensing appropriately on mobile

Follow the typography and spacing guidelines from the design document to maintain consistency.
```

#### Task 2.2: Implement ContributionSummary Component

**Description:**  
Create a component to display the contributor's summary metrics.

**Acceptance Criteria:**
- Shows key contribution statistics (commits, PRs, etc.)
- Displays visual metrics for lines added/removed
- Layout matches the design with proper responsiveness
- Includes prominent display of key metrics (Impact Score, Followers, Repositories)

**Implementation Notes:**
- Use appropriate card styles from the design guidelines
- Implement responsive grid for metrics display

**Implementation Prompt:**
```
Create a ContributionSummary component that displays key metrics:

1. Use card styling from the design system
2. Prominently display three main metrics with appropriate sizing and layout:
   - Impact Score (e.g., "92")
   - Followers (e.g., "1234")
   - Repositories (e.g., "89")
3. Create a grid layout for the additional metrics display:
   - Direct commits count
   - PRs merged count
   - PRs rejected count
   - Code reviews count
4. Use the appropriate color coding for different metrics
5. Include visual representations (bars or sparklines) where applicable
6. Ensure proper number formatting for large values
7. Make the layout responsive using Tailwind's grid utilities

Follow the color guidelines from the design document for metric indicators and ensure consistent spacing.
```

#### Task 2.3: Implement Developer Profile Metadata Components

**Description:**  
Create components to display developer profile metadata sections shown in the design.

**Acceptance Criteria:**
- Displays "Developer Profile" section with active time period
- Shows "Organizations" section with organization logos and names
- Displays "Contributed Repositories" section
- Shows "Top Languages" section with language tags

**Implementation Notes:**
- Follow the card styling used elsewhere in the design
- Ensure all components are responsive
- Use appropriate icons from the icon system

**Implementation Prompt:**
```
Create the following components for developer profile metadata:

1. Create a DeveloperProfile component that displays:
   - Section heading "Developer Profile" with user icon
   - "Active for X years/months" information (e.g., "almost 3 years") with clock icon
   - Proper typography and styling following design guidelines

2. Create an Organizations component that displays:
   - Section heading with building/organization icon
   - Organization tags (e.g., Microsoft, Google, Meta) in a horizontal list
   - Proper tag/pill styling for each organization

3. Create a ContributedRepositories component that displays:
   - Section heading with repository icon
   - List of repositories or empty state message ("No repository data available")
   - Repository metrics if available

4. Create a TopLanguages component that displays:
   - Section heading with code icon
   - Programming language tags (e.g., TypeScript, JavaScript, Python, Go) in a horizontal list
   - Styling consistent with the organization tags

Ensure all components follow the card and typography styling from design guidelines and are responsive across device sizes.
```

### Story 3: Implement Activity Visualization

Create the activity heatmap and visualization components.

#### Task 3.1: Implement Code Impact Metrics Component

**Description:**  
Create a component to display the contributor's code impact metrics with visualizations.

**Acceptance Criteria:**
- Shows total lines modified across repositories
- Displays specific numbers for added/removed lines
- Includes a visual ratio bar showing additions vs deletions percentage
- Matches the design with correct colors and layout

**Implementation Notes:**
- Use the card component from the design system
- Use appropriate colors for additions (green) and deletions (red)
- Fetch data from the `/api/contributors/:id/impact` endpoint with React Query:
  ```typescript
  const { data, isLoading, error } = useQuery(
    ['contributorImpact', contributorId],
    async () => {
      const response = await fetch(`/api/contributors/${contributorId}/impact`);
      if (!response.ok) throw new Error('Failed to fetch impact data');
      return response.json();
    },
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );
  ```
- The impact endpoint returns:
  - `added`: Total lines added
  - `removed`: Total lines removed
  - `total`: Total lines modified (added + removed)
  - `ratio`: Object with `additions` and `deletions` percentages
  - `repository_breakdown`: Array of repositories with impact metrics

**Implementation Prompt:**
```
Create a CodeImpact component to display contribution metrics:

1. Create a card with "Code Impact" header and "Total lines modified across repositories" subtitle
2. Display three key metrics:
   - Added: X lines (with "+" prefix and green color) - e.g., "+ 8,423"
   - Removed: X lines (with "-" prefix and red color) - e.g., "- 3,127"
   - Total: X lines (e.g., "11,550")
3. Implement a horizontal progress bar showing:
   - Percentage of additions (green portion)
   - Percentage of deletions (red portion)
   - Text labels showing percentages (e.g., "73% additions", "27% deletions")
4. Ensure proper number formatting for large values
5. Create appropriate loading and error states
6. Make the component responsive for all screen sizes

Follow the design guidelines for colors, ensuring the green matches the addition color and red matches the deletion color from the example.
```

#### Task 3.2: Implement ActivityHeatmap Component

**Description:**  
Create a component to visualize the contributor's activity over time in a heatmap format.

**Acceptance Criteria:**
- Displays activity density in a calendar-like heatmap
- Shows days of the week on the y-axis and months on the x-axis
- Supports different time frame selections
- Shows tooltips with detailed information on hover
- Highlights first and last contribution dates

**Implementation Notes:**
- Use an appropriate charting library compatible with the design system
- Use React Query to fetch data from the `/api/contributors/:id/activity` endpoint:
  ```typescript
  const fetchActivityData = async (contributorId, timeframe = '1year') => {
    const response = await fetch(`/api/contributors/${contributorId}/activity?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to fetch activity data');
    return response.json();
  };

  const { data, isLoading, error } = useQuery(
    ['contributorActivity', contributorId, timeframe],
    () => fetchActivityData(contributorId, timeframe),
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );
  ```
- The activity endpoint returns:
  - `total_commits`: Total number of commits in the timeframe
  - `first_commit_date`: Date of first commit (YYYY-MM-DD format)
  - `last_commit_date`: Date of last commit (YYYY-MM-DD format)
  - `activity`: Object with dates as keys and commit counts as values
  - `monthly_averages`: Array of objects with month (YYYY-MM) and average daily commits

- Match the exact layout shown in the design
- Re-fetch data when timeframe changes

**Implementation Prompt:**
```
Create the ContributorActivityHeatmap component:

1. Create a time frame selector component with options for:
   - 30 days
   - 90 days
   - 6 months
   - 1 year (default)
   - All time
2. Implement the heatmap grid using an appropriate library or custom CSS grid
3. Use the exact layout shown in the design:
   - Days of week (Sun-Sat) on the y-axis
   - Months (Jan-Dec) on the x-axis
4. Fetch activity data from the `/api/contributors/:id/activity` endpoint
5. Map activity intensity to color using the design system color palette
6. Add tooltips that show:
   - Date
   - Number of contributions
   - Type of contributions (if available)
7. Add a legend explaining the color intensity scale
8. Ensure responsive behavior on smaller screens

The component should fetch data only when necessary and handle loading/error states appropriately.
```

#### Task 3.3: Implement TimeframeSelector Component

**Description:**  
Create a component for selecting different time frames for the activity visualization.

**Acceptance Criteria:**
- Provides options for different time periods (30 days, 90 days, 6 months, 1 year, all time)
- Current selection is visually highlighted
- Selection change triggers data refresh
- Design matches the visual style guide

**Implementation Notes:**
- Use the design system's button or tab components
- Ensure the component is reusable across different visualizations
- The timeframe values must match exactly what the API expects:
  - Valid values: `30days`, `90days`, `6months`, `1year`, `all` 
  - Default value: `1year`
- Component should emit changes via callback:
  ```typescript
  interface TimeframeSelectorProps {
    value: '30days' | '90days' | '6months' | '1year' | 'all';
    onChange: (value: '30days' | '90days' | '6months' | '1year' | 'all') => void;
  }
  ```

**Implementation Prompt:**
```
Create a reusable TimeframeSelector component:

1. Use either Tabs or SegmentedControl from shadcn/ui
2. Include options for standard time periods:
   - 30 days
   - 90 days
   - 6 months
   - 1 year (default)
   - All time
3. Style according to the design guidelines
4. Implement an onChange callback for parent components to respond to selection changes
5. Make the component responsive for mobile views
6. Ensure keyboard accessibility for all options

The component should be abstracted enough to be reused in other visualizations that require time filtering.
```

### Story 4: Implement Merge Request History

Create components to display the contributor's merge request history.

#### Task 4.1: Implement MergeRequestsComponent

**Description:**  
Create a component to display the contributor's merge request history.

**Acceptance Criteria:**
- Shows merge request cards with title, date, and status
- Displays code impact statistics
- Shows branch information and status indicators
- Implements proper loading states

**Implementation Notes:**
- Fetch data from the `/api/contributors/:id/merge-requests` endpoint with React Query:
  ```typescript
  const fetchMergeRequests = async (
    contributorId: string, 
    page = 0, 
    state: 'all' | 'open' | 'closed' | 'merged' = 'all'
  ) => {
    const limit = 10;
    const offset = page * limit;
    const response = await fetch(
      `/api/contributors/${contributorId}/merge-requests?limit=${limit}&offset=${offset}&state=${state}`
    );
    if (!response.ok) throw new Error('Failed to fetch merge requests');
    return response.json();
  };

  const { data, isLoading, error } = useQuery(
    ['contributorMergeRequests', contributorId, page, state],
    () => fetchMergeRequests(contributorId, page, state),
    { 
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      keepPreviousData: true // Keep old data while fetching new page
    }
  );
  ```
- The merge-requests endpoint returns:
  - `data`: Array of merge request objects
  - `pagination`: Object with `total`, `limit`, `offset`, and `has_more` properties
- Each merge request object contains:
  - `id`, `github_id`: Identifiers
  - `title`, `description`: Content
  - `state`: Current state (open, closed, merged)
  - `created_at`, `updated_at`, `closed_at`, `merged_at`: Dates
  - `commits_count`, `additions`, `deletions`, `changed_files`: Stats
  - `repository_name`, `repository_description`: Context
  - Other metadata like `labels`, `cycle_time_hours`, etc.
- Use responsive card design for different screen sizes

**Implementation Prompt:**
```
Create the ContributorMergeRequests component:

1. Fetch merge request data from the `/api/contributors/:id/merge-requests` endpoint
2. Create a card-based layout for merge requests with:
   - Title and description
   - Repository name and link
   - Status indicator (open, closed, merged)
   - Date information
   - Branch details (source → target)
3. Include impact metrics:
   - Lines added/removed
   - Files changed
   - Impact percentage visualization
4. Implement skeleton loading states for initial data fetch
5. Create responsive layout that adapts to different screen sizes
6. Add pagination or "load more" functionality for repositories with many merge requests
7. Implement filters for merge request status (if required)

Follow the card styling from the design guidelines and ensure consistent spacing.
```

#### Task 4.2: Implement MergeRequestCard Component

**Description:**  
Create a reusable card component for individual merge requests.

**Acceptance Criteria:**
- Displays all relevant merge request information
- Shows impact visualization
- Uses consistent styling from the design system
- Handles different states (open, closed, merged)

**Implementation Notes:**
- Use the card component from the design system
- Implement responsive design for different screen sizes
- Component should accept a merge request object from the API with this structure:
  ```typescript
  interface MergeRequest {
    id: string;
    github_id: number;
    title: string;
    description: string;
    state: 'open' | 'closed' | 'merged';
    is_draft: boolean;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
    commits_count: number;
    additions: number;
    deletions: number;
    changed_files: number;
    complexity_score: number | null;
    review_time_hours: number | null;
    cycle_time_hours: number | null;
    repository_name: string;
    repository_description: string;
    labels: string[] | null;
    source_branch: string;
    target_branch: string;
    merged_by_username: string | null;
    merged_by_avatar: string | null;
  }
  ```
- Use different color schemes for each state:
  - Open: blue
  - Closed: grey or red
  - Merged: green

**Implementation Prompt:**
```
Create a reusable MergeRequestCard component:

1. Use the Card component from shadcn/ui as the base
2. Structure the card content with:
   - Header with title and status badge
   - Description section (with truncation for long descriptions)
   - Code impact metrics using small bar or pie visualizations
   - Branch information with clear direction indicators
   - Date information with relative formatting
3. Use color coding for status indicators:
   - Open: blue
   - Merged: green
   - Closed: gray/red
4. Make the entire card clickable to navigate to the merge request detail
5. Ensure responsive layout that works well in grid or list views
6. Add hover effects following the design system guidelines

The component should handle all possible merge request states and data variations gracefully.
```

### Story 5: Implement Recent Activity Timeline

Create components to display the contributor's recent activity.

#### Task 5.1: Implement RecentActivity Component

**Description:**  
Create a component to display the contributor's recent commit and merge request activity as a timeline.

**Acceptance Criteria:**
- Shows vertical timeline of recent activity
- Displays commit messages and repository context
- Shows appropriate activity icons based on activity type
- Supports pagination for additional items

**Implementation Notes:**
- Fetch data from the `/api/contributors/:id/recent-activity` endpoint with React Query:
  ```typescript
  const fetchRecentActivity = async (contributorId: string, page = 0) => {
    const limit = 20;
    const offset = page * limit;
    const response = await fetch(
      `/api/contributors/${contributorId}/recent-activity?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error('Failed to fetch recent activity');
    return response.json();
  };

  const { data, isLoading, error, fetchNextPage, hasNextPage } = useInfiniteQuery(
    ['contributorRecentActivity', contributorId],
    ({ pageParam = 0 }) => fetchRecentActivity(contributorId, pageParam),
    {
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.pagination.has_more ? allPages.length : undefined;
      },
      staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    }
  );
  ```
- The recent-activity endpoint returns:
  - `data`: Array of activity day objects
  - `pagination`: Object with `total`, `limit`, `offset`, and `has_more` properties
- Each activity day object contains:
  - `date`: The activity date (YYYY-MM-DD)
  - `activities`: Array of activity items for that day
- Activity items can be of different types:
  - `type`: "commit" or "pull_request"
  - Type-specific fields for each activity type
  - All activities include `id`, `timestamp`, and `repository` information
- Use a vertical timeline layout with appropriate spacing
- Implement infinite scroll or "load more" pattern

**Implementation Prompt:**
```
Create the RecentActivity component:

1. Fetch recent activity data from the `/api/contributors/:id/recent-activity` endpoint
2. Implement a vertical timeline layout with:
   - Activity icons that represent the type of activity
   - Commit messages or PR titles
   - Repository context and links
   - Relative timestamps
3. Use appropriate icon system as defined in the design guidelines
4. Implement "load more" functionality for pagination
5. Handle different activity types with appropriate styling
6. Create skeleton loading states for initial data fetch
7. Ensure mobile-responsive design

Follow the established timeline patterns and use the appropriate icons from Lucide React.
```

#### Task 5.2: Implement ActivityItem Component

**Description:**  
Create a reusable component for individual activity items in the timeline.

**Acceptance Criteria:**
- Displays activity type, title, and timestamp
- Shows repository context
- Uses appropriate icons based on activity type
- Handles different activity types (commits, PRs, issues)

**Implementation Notes:**
- Use consistent styling for all activity types
- Ensure component is reusable across different activity feeds
- Component should accept activity items from the API with these structures:
  ```typescript
  // Base interface for all activity types
  interface BaseActivity {
    id: string;
    type: 'commit' | 'pull_request';
    timestamp: string;
    repository: {
      id: string;
      name: string;
      url: string;
    };
  }
  
  // Commit-specific activity
  interface CommitActivity extends BaseActivity {
    type: 'commit';
    message: string;
    sha: string;
    filename: string;
    status: 'added' | 'modified' | 'deleted';
    additions: number;
    deletions: number;
  }
  
  // Pull request-specific activity
  interface PullRequestActivity extends BaseActivity {
    type: 'pull_request';
    title: string;
    number: number;
    state: 'open' | 'closed' | 'merged';
    additions: number;
    deletions: number;
  }
  
  type Activity = CommitActivity | PullRequestActivity;
  ```
- Use different icons for each activity type:
  - Commit: git-commit icon
  - Pull Request: git-pull-request icon
  - Issue: issue-opened icon (if applicable)

**Implementation Prompt:**
```
Create a reusable ActivityItem component for the timeline:

1. Design the component with:
   - Icon section on the left (using Lucide React icons)
   - Content section with title and details
   - Timestamp display using relative time
2. Handle different activity types:
   - Commits: show message and code stats
   - Pull requests: show title and status
   - Issues: show title and status (if applicable)
3. Include repository context with links
4. Make title text area expandable/collapsible for long messages
5. Use consistent typography and spacing from the design system
6. Ensure the component works well in both light and dark modes

The component should be flexible enough to handle all potential activity types while maintaining consistent styling.
```

### Story 6: Implement Repository Contributions Section

Create components to display repositories the contributor has worked on.

#### Task 6.1: Implement RepositoryContributions Component

**Description:**  
Create a component to display repositories the contributor has worked on.

**Acceptance Criteria:**
- Shows grid of repository cards with key information
- Displays contributor-specific metrics for each repository
- Supports sorting and pagination
- Shows repository popularity indicators

**Implementation Notes:**
- The initial repositories data should come from SSR props if available
- For pagination and sorting, fetch additional data from the `/api/contributors/:id/repositories` endpoint with React Query:
  ```typescript
  const fetchRepositories = async (
    contributorId: string, 
    page = 0, 
    sortBy = 'commit_count', 
    sortDirection = 'desc'
  ) => {
    const limit = 9;
    const offset = page * limit;
    const response = await fetch(
      `/api/contributors/${contributorId}/repositories?limit=${limit}&offset=${offset}&sort_by=${sortBy}&sort_direction=${sortDirection}`
    );
    if (!response.ok) throw new Error('Failed to fetch repositories');
    return response.json();
  };

  const { data, isLoading, error } = useQuery(
    ['contributorRepositories', contributorId, page, sortBy, sortDirection],
    () => fetchRepositories(contributorId, page, sortBy, sortDirection),
    { 
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      keepPreviousData: true, // Keep old data while fetching new page
      initialData: props.initialRepositories 
    }
  );
  ```
- The repositories endpoint returns:
  - `data`: Array of repository objects
  - `pagination`: Object with `total`, `limit`, `offset`, and `has_more` properties
- Each repository object contains:
  - `id`, `github_id`: Identifiers
  - `name`, `full_name`: Repository names
  - `description`: Repository description
  - `url`: GitHub URL
  - `stars`, `forks`: Popularity metrics
  - Repository metadata (`primary_language`, `license`, etc.)
  - Contributor-specific metrics:
    - `commit_count`: Number of commits by this contributor
    - `pull_requests`: Number of PRs by this contributor
    - `reviews`: Number of reviews by this contributor
    - `lines_added`, `lines_removed`: Code impact
    - `first_contribution_date`, `last_contribution_date`: Activity timeline
- Support sorting by:
  - `commit_count` (default)
  - `stars`
  - `last_contribution_date`
  - `lines_added`
- Use responsive grid layout for different screen sizes

**Implementation Prompt:**
```
Create the RepositoryContributions component:

1. Fetch repository data from the `/api/contributors/:id/repositories` endpoint
2. Implement a responsive grid layout using Tailwind CSS
3. Create repository cards that show:
   - Repository name and description
   - Primary language
   - Contributor-specific metrics (commits, PRs)
   - Contribution percentage or impact indicators
4. Add sorting options by:
   - Most recently contributed
   - Most commits
   - Star count
5. Add pagination controls for repositories
6. Implement skeleton loading states
7. Create empty state for contributors with no repositories

Follow the card styling from the design guidelines and ensure all interactive elements follow the established patterns.
```