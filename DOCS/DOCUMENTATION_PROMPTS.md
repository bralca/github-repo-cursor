
# Documentation Generation Prompts

This document contains a series of prompts designed to generate comprehensive documentation for different aspects of the GitHub Explorer project. Each prompt is focused on a specific area of the application and will help create detailed markdown documentation files.

## How to Use These Prompts

1. Copy each prompt section when you're ready to generate that specific documentation
2. Run the prompt through an AI assistant
3. Save the generated content to the appropriate markdown file in the `docs/` directory
4. Review and edit the generated documentation as needed

## List of Documentation Prompts

1. [Database Schema Documentation](#database-schema-documentation)
2. [Data Pipeline Architecture](#data-pipeline-architecture)
3. [Repository Page Architecture](#repository-page-architecture)
4. [Contributors Page Architecture](#contributors-page-architecture)
5. [Merge Requests Architecture](#merge-requests-architecture)
6. [Commits Page Architecture](#commits-page-architecture)
7. [Admin Page Architecture](#admin-page-architecture)
8. [Edge Functions Documentation](#edge-functions-documentation)
9. [Design Guidelines Documentation](#design-guidelines-documentation)

---

## Database Schema Documentation

```
Generate a comprehensive markdown document titled "DATABASE_SCHEMA.md" that describes in detail the database schema of the GitHub Explorer application. For this, please:

1. List all database tables and their purposes
2. For each table, document:
   - All columns with their data types and constraints
   - Primary keys and foreign key relationships
   - Any default values or special behaviors
   - Indexes and their purposes
   - Row-level security policies if applicable

3. Include a section on database functions and triggers
4. Create an entity-relationship diagram (described in text/markdown format) showing the relationships between tables
5. Explain how different tables relate to major features of the application (repositories, contributors, commits, merge requests)
6. Describe any data integrity constraints or validation rules
7. Document any performance considerations for the schema

Format this as a well-structured markdown document with clear headings, tables for schema definitions, and relationship descriptions.
```

## Data Pipeline Architecture

```
Create a detailed markdown document titled "DATA_PIPELINE_ARCHITECTURE.md" that explains the data pipeline architecture of the GitHub Explorer application. Please include:

1. A high-level overview of the entire data pipeline process flow
2. For each major component of the pipeline, provide:
   - Its purpose and functionality
   - Input and output data formats
   - Dependencies on other components
   - Execution frequency or triggers

3. Detailed pseudo-code explanations of key pipeline processes:
   - GitHub data synchronization
   - Raw data processing
   - Data enrichment processes
   - Analytics calculations

4. Error handling and recovery mechanisms
5. Scalability considerations
6. Performance metrics and optimization strategies
7. A diagram (described in text/markdown format) showing the data flow between components
8. Explanation of how the pipeline integrates with the database schema
9. Details on any scheduled jobs or cron tasks

Format this as a comprehensive technical document with clear section divisions, code blocks for pseudo-code, and visual aids described in markdown.
```

## Repository Page Architecture

```
Generate a detailed markdown document titled "REPOSITORY_PAGE_ARCHITECTURE.md" that thoroughly explains the Repository page architecture of the GitHub Explorer application. Include:

1. An overview of the Repository page purpose and key features
2. Component hierarchy diagram (described in text/markdown format)
3. For each component on the page:
   - Component name and file path
   - Purpose and functionality
   - Props and state management approach
   - Database queries and data sources (table names, columns used)
   - Key UI elements and interactions
   - Relationship to other components

4. Data flow explanation:
   - How data is fetched and transformed
   - Caching strategies
   - Loading states and error handling

5. Hooks and utilities specific to the Repository page
6. Performance considerations and optimizations
7. User interactions and event handling
8. Responsive design implementation
9. Key features implementation details (code structure, not the actual code)

Format this as a well-structured technical document with clear hierarchical organization, using headings, lists, and tables where appropriate.
```

## Contributors Page Architecture

```
Create a comprehensive markdown document titled "CONTRIBUTORS_PAGE_ARCHITECTURE.md" that explains the Contributors page architecture of the GitHub Explorer application in detail. Please include:

1. An overview of the Contributors page purpose and main functionality
2. Component hierarchy diagram (described in text/markdown format)
3. For each component on the page:
   - Component name and file location
   - Purpose and functionality
   - Props, state management, and key hooks used
   - Database queries and data sources (specific tables and columns)
   - UI elements and interactions
   - Connections with other components

4. Data flow patterns:
   - Data fetching mechanisms
   - Data transformation and processing
   - State management approach

5. User interaction patterns:
   - Search and filtering functionality
   - Sorting capabilities
   - Pagination implementation
   - Detail views and drilling down

6. Visualization components and their data requirements
7. Performance optimization strategies
8. Responsive design considerations
9. Key algorithms or calculations specific to contributor analytics

Format this as a well-structured technical document with clear headings, component diagrams described in text, and connection points to the database clearly identified.
```

## Merge Requests Architecture

```
Generate a detailed markdown document titled "MERGE_REQUESTS_ARCHITECTURE.md" that thoroughly explains the Merge Requests page architecture of the GitHub Explorer application. Include:

1. An overview of the Merge Requests page purpose and key features
2. Component hierarchy diagram (described in text/markdown format)
3. For each component on the page:
   - Component name and file path
   - Purpose and functionality
   - Props and state management approach
   - Database queries and data sources (specific tables and columns used)
   - UI elements and interactive features
   - Relationship to parent/child components

4. Data flow patterns:
   - API interaction and data fetching strategy
   - State management and data transformation
   - Caching implementation

5. Key user interactions:
   - Filtering and sorting capabilities
   - Viewing merge request details
   - Pagination or infinite scrolling implementation

6. Visualization components for merge request analytics
7. Performance considerations and optimizations
8. Error handling strategies
9. Responsive design implementation details

Format this as a comprehensive technical document with clear section breakdowns, using appropriate markdown formatting for readability and structure.
```

## Commits Page Architecture

```
Create a comprehensive markdown document titled "COMMITS_PAGE_ARCHITECTURE.md" that explains the Commits page architecture of the GitHub Explorer application in detail. Please include:

1. An overview of the Commits page purpose and functionality
2. Component hierarchy diagram (described in text/markdown format)
3. For each component on the page:
   - Component name and file location
   - Purpose and functionality
   - Props and state management
   - Database queries and data sources (tables and specific columns)
   - Key UI elements and interactions
   - Parent-child component relationships

4. Data flow patterns:
   - How commit data is fetched and processed
   - Handling of diff rendering and code visualization
   - Caching strategies

5. Key features implementation details:
   - Commit history visualization
   - Diff viewing functionality
   - Commit analysis and metrics
   - Search and filtering capabilities

6. Performance optimizations:
   - Handling large diffs
   - Virtualization strategies
   - Code splitting approach

7. Edge cases and error handling
8. Responsive design implementation
9. Integration with other parts of the application

Format this as a well-structured technical document with appropriate sections, code references, and clear explanations of database interactions.
```

## Admin Page Architecture

```
Generate a detailed markdown document titled "ADMIN_PAGE_ARCHITECTURE.md" that thoroughly explains the Admin page architecture of the GitHub Explorer application. Include:

1. An overview of the Admin page purpose and key administrative features
2. Component hierarchy diagram (described in text/markdown format)
3. For each component on the admin page:
   - Component name and file path
   - Purpose and administrative functionality
   - Props and state management approach
   - Database queries, mutations, and data sources (specific tables and columns)
   - Admin-specific UI controls and interactions
   - Security and access control implementation

4. Data pipeline control features:
   - Manual triggering of pipeline processes
   - Monitoring of pipeline status
   - Error handling and recovery options

5. Key administrative workflows:
   - Data synchronization management
   - System status monitoring
   - Configuration management
   - User management (if applicable)

6. Performance monitoring tools and metrics
7. Error logging and troubleshooting features
8. Security considerations specific to admin functionality
9. Integration with edge functions and backend services

Format this as a comprehensive technical document with clear sections distinguishing different administrative areas, security considerations, and data manipulation capabilities.
```

## Edge Functions Documentation

```
Create a detailed markdown document titled "EDGE_FUNCTIONS_DOCUMENTATION.md" that explains all the edge functions used in the GitHub Explorer application. For each edge function, please include:

1. An overview of all edge functions and their integration into the application
2. For each edge function:
   - Function name and file path
   - Purpose and core functionality
   - Input parameters and expected format
   - Output format and data structure
   - Error handling approach
   - Security considerations (authentication, authorization)
   - Integration with database operations

3. For each function, include pseudo-code explaining the main workflow:
   - Key steps in the function execution
   - Decision points and conditional logic
   - Database interactions
   - External API calls
   - Data transformation processes

4. Details on scheduling mechanisms if the function is triggered by cron jobs
5. Performance considerations and optimization techniques
6. Error handling and logging strategies
7. Examples of how each function is called from the frontend
8. Dependencies between different edge functions
9. Deployment and versioning approach

Format this as a comprehensive reference document with clear sections for each function, including pseudo-code blocks, parameter tables, and integration points.
```

## Design Guidelines Documentation

```
Generate a detailed markdown document titled "DESIGN_GUIDELINES.md" that documents all design and styling choices made in the GitHub Explorer application. Include:

1. An overview of the design system and visual language
2. Color palette:
   - Primary, secondary, and accent colors with hex codes
   - Semantic colors (success, warning, error, info)
   - Background and text colors
   - Usage guidelines for each color

3. Typography:
   - Font families used
   - Type scale (heading sizes, body text, captions)
   - Font weights and usage patterns
   - Line heights and spacing guidelines

4. Component styling patterns:
   - Button styles and variants
   - Form elements and input styling
   - Card and container designs
   - Navigation elements
   - Data visualization components

5. Layout principles:
   - Grid system and spacing units
   - Responsive breakpoints
   - Component spacing guidelines
   - Page layout patterns

6. Animation and transition guidelines:
   - Timing functions
   - Duration standards
   - Appropriate use cases

7. Icon system and usage guidelines
8. Accessibility considerations
9. Implementation details:
   - How Tailwind CSS is configured and used
   - Any custom CSS patterns
   - Component composition patterns

Format this as a comprehensive design reference with clear sections, examples of usage, and guidance for maintaining design consistency.
```

## Next Steps

After creating each documentation file, consider:

1. Adding diagrams where appropriate (using tools like Mermaid markdown or including image links)
2. Cross-referencing between documentation files for related concepts
3. Creating an overall project architecture document that ties all components together
4. Updating documentation as the project evolves

