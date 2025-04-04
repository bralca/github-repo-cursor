# Epic: Contributors Page Frontend Implementation

## Overview

This epic covers the frontend implementation required for the Contributors Page based on the provided design architecture. The existing Contributors Page needs to be updated to match the new design while maintaining compatibility with the current URL structure and data fetching patterns.

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
- Fetch data from the activity endpoint
- Match the exact layout shown in the design

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
- Fetch data from the new merge requests endpoint
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
- Fetch data from the new recent activity endpoint
- Use a vertical timeline layout with appropriate spacing

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
- Fetch data from the new repositories endpoint
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

### Story 7: Implement Rankings and Metrics Display

Create components to display the contributor's ranking and metrics.

#### Task 7.1: Implement ContributorRankings Component

**Description:**  
Create a component to display the contributor's rankings and calculated metrics.

**Acceptance Criteria:**
- Shows the contributor's ranking position
- Displays score breakdown across different metrics
- Uses appropriate visualizations for score components
- Shows percentile information where available

**Implementation Notes:**
- Fetch data from the new rankings endpoint
- Use appropriate charts or gauge visualizations

**Implementation Prompt:**
```
Create the ContributorRankings component:

1. Fetch rankings data from the `/api/contributors/:id/rankings` endpoint
2. Create a card-based layout to display:
   - Overall rank position
   - Composite ranking score
   - Breakdown of score components
   - Percentile information
3. Use appropriate visualizations:
   - Radar chart for score components
   - Bar charts for comparisons
   - Gauge charts for percentile displays
4. Include explanatory tooltips for each metric
5. Use consistent color coding for different metrics
6. Implement skeleton loading states
7. Handle the case where ranking data is not available

Follow the data visualization guidelines and ensure all charts are responsive and accessible.
```

### Story 8: Implement Responsive Design and Optimizations

Ensure the page is responsive and optimized for all device sizes.

#### Task 8.1: Implement Responsive Layout Adjustments

**Description:**  
Ensure all components are properly responsive across different device sizes.

**Acceptance Criteria:**
- Desktop view uses three-column layout as specified
- Tablet view uses appropriate column structure
- Mobile view uses single-column layout
- Components adapt their internal layout based on screen size
- All content is accessible on small screens

**Implementation Notes:**
- Use Tailwind's responsive utilities
- Test on multiple device sizes
- Ensure no content overflow on small screens

**Implementation Prompt:**
```
Review and optimize responsive behavior for all components:

1. Use Tailwind's responsive prefixes consistently:
   - Default: Mobile design
   - md: Tablet design
   - lg: Desktop design
2. Adjust the main page layout:
   - Three-column on large screens
   - Two-column on medium screens
   - Single-column on small screens
3. Adapt component internals:
   - Adjust card layouts for different widths
   - Modify chart sizes based on available space
   - Convert tables to card layouts on mobile
4. Hide less critical information on smaller screens
5. Create expansion patterns for accessing all data on mobile
6. Test on actual devices or accurate device emulators
7. Ensure text remains readable at all screen sizes

Follow the responsive design implementation section from the design guidelines document.
```

#### Task 8.2: Implement Performance Optimizations

**Description:**  
Optimize the page for performance across different network conditions.

**Acceptance Criteria:**
- Data fetching is optimized with appropriate caching
- Page loads quickly even with large data sets
- Skeleton loading states are implemented for all components
- Lazy loading is used for below-the-fold content

**Implementation Notes:**
- Use React Query for data fetching and caching
- Implement pagination for large data sets
- Use virtualization for long lists where appropriate

**Implementation Prompt:**
```
Implement performance optimizations for the Contributors page:

1. Configure React Query for efficient data fetching:
   - Set appropriate stale times for caching
   - Implement retry logic for network failures
   - Use query keys that include contributor ID and filter parameters
2. Optimize component rendering:
   - Memoize expensive calculations with useMemo
   - Prevent unnecessary re-renders with React.memo for pure components
   - Use callback functions appropriately
3. Implement skeleton loading states for all data-dependent components
4. Add lazy loading for:
   - Below-the-fold content
   - Heavyweight visualizations
   - Data-intensive components
5. Implement virtualization for long lists
6. Add pagination or "load more" patterns for large datasets
7. Ensure smooth transitions between loading and loaded states

Focus on maintaining responsive UI even when dealing with large datasets or slow network conditions.
```

### Story 9: Testing and Documentation

Ensure the page is thoroughly tested and documented.

#### Task 9.1: Create Component Tests

**Description:**  
Create comprehensive tests for all new and updated components.

**Acceptance Criteria:**
- Unit tests for all components
- Tests for different data scenarios (empty, partial, full)
- Tests for error states and edge cases
- Responsive behavior tests

**Implementation Notes:**
- Follow established testing patterns
- Use mock data that reflects API structure
- Test loading and error states

**Implementation Prompt:**
```
Create comprehensive tests for all Contributors page components:

1. Write unit tests for each component focusing on:
   - Rendering with different prop combinations
   - User interactions (clicks, hovers, selections)
   - Loading states and error handling
2. Test data scenarios including:
   - Empty data
   - Partial/incomplete data
   - Full data sets
   - Edge cases (extremely large values, missing fields)
3. Test responsive behavior by:
   - Rendering at different viewport sizes
   - Checking conditional rendering logic
4. Mock API responses to test data fetching behavior
5. Create tests for all user interaction flows
6. Implement accessibility tests
7. Test dark mode compatibility

Follow existing testing patterns in the codebase and ensure all tests are meaningful and not just for coverage.
```

#### Task 9.2: Update Component Documentation

**Description:**  
Update or create documentation for all components.

**Acceptance Criteria:**
- Component props and types are documented
- Usage examples are provided
- Component responsibilities are clearly defined
- Data requirements are specified

**Implementation Notes:**
- Follow established documentation patterns
- Include code samples where appropriate
- Document any non-obvious behavior

**Implementation Prompt:**
```
Update or create documentation for all Contributors page components:

1. Document each component with:
   - Purpose and responsibility
   - Props interface with type definitions
   - Data requirements and structures
   - Key behaviors and interactions
2. Include usage examples showing:
   - Basic implementation
   - Common variants
   - Handling of different states
3. Document integration points with:
   - API endpoints used
   - State management
   - Parent-child relationships
4. Add inline code comments for complex logic
5. Create stories that demonstrate component variations

Follow the existing documentation format and ensure all documentation is clear, concise, and helpful for future developers.
```

## Implementation Dependencies

- Backend API endpoints must be available (from Contributors Page Backend Epic)
- Design System components must be implemented
- Data structures must be compatible with new components
- URL routing patterns must be maintained

## Timeline

The estimated timeline for this epic is 1-2 weeks, depending on the complexity of the implementation and availability of backend API endpoints. 