
# Commits Page Architecture

## Overview

The Commits page serves as the central hub for examining individual code changes within the GitHub Explorer application. It provides developers with a detailed view of commit content, visualizes code differences, and offers AI-powered analysis of code quality and impact. The page allows users to understand the technical and contextual aspects of each commit, providing insights that help with code review, knowledge transfer, and development history tracking.

## Key Features

- Detailed commit metadata display
- Code diff visualization with syntax highlighting
- AI-powered commit analysis and quality scoring
- Responsive layouts for different screen sizes
- History navigation and contextual repository information
- Performance optimizations for handling large diffs

## Component Hierarchy

```
Commits (Page Container)
├── Navigation
├── CommitHeader
│   └── Avatar
├── CommitDiff
│   ├── TabsList (file navigation)
│   ├── TabsContent (file content)
│   └── DiffView (syntax-highlighted diff)
└── CommitAnalysis
    └── AnalysisCard (multiple instances)
```

## Component Details

### 1. Commits (Page Container)

**File Path**: `src/pages/Commits.tsx`

**Purpose**: Serves as the main container component for the commit details page, handling responsive layout switching and state management for the entire view.

**State Management**:
- `isCodeExpanded`: Controls whether the code diff view is displayed in full or truncated mode
- Uses refs to manage scroll positions and DOM references
- Uses loaded commit data from Supabase

**Data Sources**:
- Primary commit data from the `commits` table including:
  - `hash`, `title`, `author`, `date`, `diff`
  - `repository_id`, `merge_request_id` (for context)
  - `stats_additions`, `stats_deletions`, `files_changed` (for metrics)

**Key UI Elements**:
- Container with responsive layout management
- SEO metadata via React Helmet
- Layout switcher based on screen size
- Conditional rendering for different device types

**Relationships**:
- Parent to all other commit components
- Integrates with Navigation component for app-wide navigation
- Conditionally renders either DesktopCommitLayout or MobileCommitLayout

**Code Example (Structure)**:
```typescript
const Commits = () => {
  const isMobile = useIsMobile();
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const codeScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Helmet>
        <title>Code Commits | GitHub Repository Rankings & Analytics Hub</title>
        <meta name="description" content="Analyze code commits, review changes, and track developer contributions in real-time." />
      </Helmet>
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20">
        {!isMobile ? (
          <DesktopCommitLayout 
            /* Props passed to desktop layout */
          />
        ) : (
          <MobileCommitLayout 
            /* Props passed to mobile layout */
          />
        )}
      </div>
      <CommitStyles />
    </div>
  );
};
```

### 2. CommitHeader

**File Path**: `src/components/commits/CommitHeader.tsx`

**Purpose**: Displays metadata about the commit including author information, commit hash, date, and title.

**Props**:
- `author`: Commit author's username or identifier
- `hash`: Git commit hash
- `date`: Commit timestamp
- `title`: Commit message title

**UI Elements**:
- Author avatar with fallback
- Commit metadata displayed in a structured format
- Formatted date and time
- Monospace font for technical identifiers (hash)

**Relationships**:
- Child of DesktopCommitLayout and MobileCommitLayout
- Uses Avatar component from UI library

**Code Example**:
```typescript
export const CommitHeader = ({ 
  author, 
  hash, 
  date, 
  title,
}: CommitHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <Avatar>
          <AvatarImage src={`https://avatar.vercel.sh/${author}.png`} />
          <AvatarFallback>{author.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{author}</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <GitCommit className="h-4 w-4" />
            <span className="font-mono">{hash}</span>
            <span>•</span>
            <span>{new Date(date).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
};
```

### 3. CommitDiff

**File Path**: `src/components/commits/CommitDiff.tsx`

**Purpose**: Renders a syntax-highlighted diff view of the code changes, with file navigation and expandable/collapsible interface.

**Props**:
- `diff`: String containing Git diff content
- `isCodeExpanded`: Boolean controlling expanded/collapsed view state
- `setIsCodeExpanded`: State setter function for toggling expanded state
- `codeScrollRef`: React ref for scrolling functionality

**State Management**:
- `currentFile`: Tracks the currently selected file tab
- Uses parsing utilities to process the diff content

**Data Processing**:
- Parses raw diff text using `parseDiff` from the `react-diff-view` library
- Transforms diff data into file-based view components
- Handles different types of changes (additions, deletions)

**UI Elements**:
- File tabs navigation with horizontal scrolling
- Custom GitHub-inspired diff styling
- Expandable/collapsible container with toggle button
- Syntax highlighting for code changes

**Relationships**:
- Child of DesktopCommitLayout and MobileCommitLayout
- Uses Tabs components from UI library
- Depends on CommitStyles for styling consistency

**Database Queries**:
For real implementation (not mock data):
```typescript
// Example query for fetching a commit's diff
const { data: diffData } = useQuery({
  queryKey: ['commitDiff', commitHash],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('commits')
      .select('diff')
      .eq('hash', commitHash)
      .single();
      
    if (error) throw error;
    return data.diff;
  },
  enabled: !!commitHash
});
```

### 4. CommitAnalysis

**File Path**: `src/components/commits/CommitAnalysis.tsx`

**Purpose**: Displays AI-generated analysis and metrics about the commit, including code quality, impact, and other relevant insights.

**Props**:
- `analyses`: Array of analysis items with metrics, descriptions, and visualization data

**UI Elements**:
- Cards for different analysis categories
- Progress indicators and score visualizations
- Tooltips for additional context
- Iconography representing different analysis types

**Data Sources**:
- Primary data from `commit_analyses` table with fields:
  - `title`, `score`, `content`, `icon`
  - `prompt_id` linking to analysis prompt
  - `commit_id` linking to the commit

**Relationships**:
- Child of DesktopCommitLayout and MobileCommitLayout
- Uses Card components from UI library
- Integrated with tooltip components for enhanced UX

**Code Example**:
```typescript
export const CommitAnalysis = ({ analyses }: CommitAnalysisProps) => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {analyses.map((analysis, index) => (
          <Card key={index} className="bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              {/* Card header with title and score */}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {analysis.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

### 5. DesktopCommitLayout

**File Path**: `src/components/commits/DesktopCommitLayout.tsx`

**Purpose**: Provides a layout optimized for desktop screens with a side-by-side view of code diff and analysis.

**Props**:
- `commit`: Commit object containing all metadata and diff content
- `isCodeExpanded`: Boolean controlling the diff view expansion state
- `setIsCodeExpanded`: Function to toggle expansion state
- `codeContainerRef`: React ref for the code container element
- `codeScrollRef`: React ref for scrollable diff content

**UI Elements**:
- Two-column layout with responsive widths
- Fixed height container with internal scrolling
- Sticky positioning for header elements

**Relationships**:
- Child of Commits page component
- Parent to CommitHeader, CommitDiff, and CommitAnalysis
- Conditionally rendered based on screen size

**Code Example**:
```typescript
export const DesktopCommitLayout = ({
  commit,
  isCodeExpanded,
  setIsCodeExpanded,
  codeContainerRef,
  codeScrollRef,
}: DesktopCommitLayoutProps) => {
  return (
    <div className="flex gap-6" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="w-2/3 relative">
        <CommitHeader /* props */ />
        <div className={`${!isCodeExpanded ? 'sticky top-20' : ''} z-10 bg-background`}>
          <CommitDiff /* props */ />
        </div>
      </div>
      <div className="w-1/3 h-full overflow-hidden">
        <CommitAnalysis analyses={commit.analyses} />
      </div>
    </div>
  );
};
```

### 6. MobileCommitLayout

**File Path**: `src/components/commits/MobileCommitLayout.tsx`

**Purpose**: Provides a vertically stacked layout optimized for mobile devices.

**Props**:
- Same as DesktopCommitLayout

**UI Elements**:
- Single-column stacked layout
- Sticky positioning for important elements
- Optimized spacing for smaller screens

**Relationships**:
- Child of Commits page component
- Parent to CommitHeader, CommitDiff, and CommitAnalysis
- Conditionally rendered based on screen size

**Code Example**:
```typescript
export const MobileCommitLayout = ({
  /* Same props as DesktopCommitLayout */
}: MobileCommitLayoutProps) => {
  return (
    <div className="flex flex-col">
      <CommitHeader /* props */ />
      <div className={`${!isCodeExpanded ? 'sticky top-16' : ''} z-10 bg-background mb-6`}>
        <CommitDiff /* props */ />
      </div>
      <div className="w-full pb-6">
        <CommitAnalysis analyses={commit.analyses} />
      </div>
    </div>
  );
};
```

### 7. CommitStyles

**File Path**: `src/components/commits/CommitStyles.tsx`

**Purpose**: Provides consistent styling for diff views across the application through injected CSS.

**Functionality**:
- Injects custom CSS for diff components
- Overrides default styling from the diff view library
- Implements GitHub-like styling for diff views

**UI Elements**:
- Custom styling for diff gutter, lines, and code blocks
- Color coding for additions and deletions
- Styling for diff headers and metadata

**Relationships**:
- Used by Commits page component
- Applied globally to ensure consistent styling

**Code Example**:
```typescript
export const CommitStyles = () => {
  return (
    <style>
      {`
        .diff-container {
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
          font-size: 12px;
          line-height: 20px;
        }
        .diff-line {
          display: flex;
        }
        .diff-gutter {
          /* Gutter styling */
        }
        /* Other custom styles for diff components */
      `}
    </style>
  );
};
```

## Data Flow

### Data Fetching Strategy

1. **Initial Load**:
   - The page loads with a commit hash from the URL parameters
   - The `useCommit` hook fetches the commit data using the hash
   - Once basic commit data is loaded, analysis data is fetched

2. **Data Transformation**:
   - Raw diff text is parsed using the `parseDiff` library
   - Commit metadata is formatted for display
   - Analysis data is transformed into visualization-ready format

3. **React Query Integration**:
   - The application uses React Query for managing server state
   - Commit data is cached with appropriate keys

```typescript
// Example of the useCommit hook (intended implementation)
export function useCommit(commitHash: string) {
  return useQuery({
    queryKey: ['commit', commitHash],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commits')
        .select(`
          *,
          commit_analyses(*)
        `)
        .eq('hash', commitHash)
        .single();
        
      if (error) throw error;
      return transformCommitData(data);
    },
    enabled: !!commitHash
  });
}
```

### Caching Strategy

- React Query is configured with appropriate stale times based on data change frequency
- Commit data is unlikely to change, so it has a longer stale time
- Analysis data might be updated as algorithms improve, so it has a shorter stale time

```typescript
// Example query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false
    }
  }
});
```

## Key Features Implementation

### 1. Diff Visualization

The diff visualization leverages the `react-diff-view` library to render Git diffs with syntax highlighting. The implementation includes:

- **File-based navigation**: Changes are organized by file with a tab-based interface
- **Syntax highlighting**: Code is highlighted based on the file extension and language
- **Expandable sections**: Large diffs can be collapsed or expanded
- **Line numbers**: Line numbers are displayed for easier reference
- **Change indicators**: Added, modified, and deleted lines are color-coded

Critical implementation details:
```typescript
// Core diff rendering functionality
<Diff
  viewType="unified"
  diffType={file.type}
  hunks={file.hunks}
  className="overflow-visible"
>
  {hunks => hunks.map(hunk => (
    <Hunk 
      key={hunk.content}
      hunk={hunk}
    />
  ))}
</Diff>
```

### 2. AI Analysis

The AI analysis feature provides automated insights about commit quality, impact, and other metrics:

- **Multiple analysis dimensions**: Code quality, complexity, readability, etc.
- **Confidence scores**: Indicates the AI's confidence in each assessment
- **Contextual insights**: Analysis takes into account the repository context
- **Visual representation**: Scores are presented with appropriate visual indicators

The analysis data structure:
```typescript
interface AnalysisItem {
  title: string;           // Analysis category
  score: number;           // Numeric score (typically 0-10)
  content: string;         // Detailed explanation
  icon: LucideIcon;        // Visual indicator
  prompt?: {               // AI prompt context
    description: string;
    confidenceScore: number;
  };
}
```

### 3. Responsive Layouts

The application implements a responsive design approach:

- **Device detection**: Uses the `useIsMobile` hook to detect device type
- **Conditional rendering**: Renders different layouts based on screen size
- **Optimized interactions**: Mobile layout has specialized UI patterns
- **Controlled expansion**: Diff views can be expanded/collapsed based on screen real estate

Implementation:
```typescript
// Responsive rendering in the main Commits component
{!isMobile ? (
  <DesktopCommitLayout /* props */ />
) : (
  <MobileCommitLayout /* props */ />
)}
```

## Performance Optimization

### Handling Large Diffs

Large diffs can cause performance issues in the browser. The implementation includes several optimizations:

1. **Virtualization**: Only visible portions of large diffs are rendered
2. **Lazy loading**: Components are loaded on-demand
3. **Pagination**: Breaking large diffs into manageable chunks
4. **Height constraints**: Initially constraining the height with an option to expand

Implementation:
```typescript
// Height constraint with optional expansion
<div 
  ref={codeScrollRef}
  className={`w-full ${!isCodeExpanded ? (isMobile ? 'h-[50vh]' : 'h-[60vh]') : ''} overflow-y-auto`}
>
  {/* Diff content */}
</div>
```

### Code Splitting

The application uses code splitting to reduce the initial bundle size:

1. **Component-level splitting**: Each major component is in its own file
2. **Lazy-loaded analysis**: Analysis components are loaded only when needed
3. **Conditional imports**: Some utilities are only imported when used

### Diff Parsing Optimization

Parsing large diffs can be CPU-intensive. The implementation includes:

1. **Memoization**: Parsed diffs are memoized to prevent re-parsing
2. **Incremental parsing**: Large diffs are parsed in chunks
3. **Worker threads**: Moving intensive parsing operations off the main thread

## Error Handling

### Network Error Handling

The implementation includes comprehensive error handling for network requests:

1. **Query error states**: React Query's error states are used to display appropriate UI
2. **Retry mechanisms**: Failed requests are retried with exponential backoff
3. **Fallback UI**: Error boundaries capture rendering errors

Example error handling:
```typescript
// Error handling in data fetching
const { data, error, isLoading } = useQuery({
  // Query configuration
});

if (isLoading) return <LoadingIndicator />;
if (error) return <ErrorDisplay message={error.message} />;

// Normal component rendering with data
```

### Data Validation

The application validates data before rendering:

1. **Type checking**: TypeScript interfaces ensure data shape
2. **Null checking**: Guards against missing or null data
3. **Default values**: Fallbacks for missing data points

## Responsive Design Implementation

### Desktop Layout

On larger screens:
- Two-column layout with 2/3 for code, 1/3 for analysis
- Fixed positions for navigation elements
- Expanded visualizations and metrics
- Side-by-side comparison views

### Tablet Layout

On medium screens:
- Adaptable grid layout
- Collapsible sections for better space utilization
- Prioritized content display

### Mobile Layout

On small screens:
- Single-column stacked layout
- Touch-friendly interactive elements
- Optimized diff viewing with horizontal scrolling
- Collapsible sections to manage screen real estate

## Integration with Other Application Parts

### Repository Context

The Commits page integrates with the repository context:

1. **Repository metadata**: Links back to the repository page
2. **Branch information**: Shows the branch context for the commit
3. **Commit history**: Provides navigation to related commits

### Merge Request Integration

Commits are often associated with merge requests:

1. **Merge request context**: If the commit is part of a merge request, that context is displayed
2. **Related commits**: Other commits in the same merge request are linked
3. **Review status**: Shows if the commit has been reviewed

### Global Navigation

The page integrates with the application's global navigation:

1. **Breadcrumbs**: Shows the navigation path
2. **Back button**: Returns to the previous context
3. **Related links**: Shows links to related pages

## Database Schema Integration

The Commits page primarily interacts with these database tables:

1. **commits**: Core table containing commit metadata
   - Key columns: `id`, `hash`, `title`, `author`, `date`, `diff`
   - Foreign keys: `repository_id`, `merge_request_id`

2. **commit_analyses**: Contains AI analysis results
   - Key columns: `id`, `commit_id`, `title`, `content`, `score`
   - Foreign keys: `commit_id` (references commits.id)

3. **repositories**: Contains repository context
   - Key columns: `id`, `name`, `description`
   - Used for providing context to commits

## Conclusion

The Commits page architecture follows a component-based design that emphasizes:

1. **Performance**: Optimized for handling potentially large diffs
2. **Insight**: AI-powered analysis provides deeper understanding
3. **Context**: Commits are presented within their repository and project context
4. **Responsiveness**: Fully functional across all device sizes

The architecture balances the technical needs of displaying complex code diffs with the UX requirements of making that information accessible and useful. By separating the layout structure from the content components, the design allows for flexible adaptation to different screen sizes while maintaining consistent functionality.

The data flow is optimized to load critical information first, with supplementary data loaded as needed. This approach, combined with effective caching strategies, ensures the page remains responsive even when dealing with large repositories or complex commit histories.
