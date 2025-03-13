# GitHub Explorer Documentation

This directory contains comprehensive documentation for the GitHub Explorer application. These documents provide detailed information about the application's architecture, components, data flow, and design guidelines.

## Documentation Structure

The documentation is organized into the following categories:

- **Core Architecture** - Fundamental application architecture
- **Page Architecture** - Implementation details for specific pages
- **Data Systems** - Database and data pipeline documentation
- **Server Architecture** - Backend services and serverless functions
- **Implementation Guidelines** - Design principles, roadmap, and security

## Documentation Files

### Core Architecture

- [Next.js Architecture](core-architecture/NEXT_JS_ARCHITECTURE.md) - Frontend architecture using Next.js
- [Supabase Integration](core-architecture/SUPABASE_INTEGRATION.md) - Database integration details

### Data Systems

- [Database Schema](data-systems/DATABASE_SCHEMA.md) - Detailed database structure and relationships
- [Data Pipeline Architecture](data-systems/DATA_PIPELINE_ARCHITECTURE.md) - End-to-end data processing flow
- [Pipeline Architecture](data-systems/PIPELINE_ARCHITECTURE.md) - Pipeline implementation details

### Page Architecture

- [Repository Page Architecture](page-architecture/REPOSITORY_PAGE_ARCHITECTURE.md) - Repository page components and data flow
- [Contributors Page Architecture](page-architecture/CONTRIBUTORS_PAGE_ARCHITECTURE.md) - Contributors page components and data flow
- [Merge Requests Architecture](page-architecture/MERGE_REQUESTS_ARCHITECTURE.md) - Merge requests page components and data flow
- [Commits Page Architecture](page-architecture/COMMITS_PAGE_ARCHITECTURE.md) - Commits page components and data flow
- [Admin Page Architecture](page-architecture/ADMIN_PAGE_ARCHITECTURE.md) - Admin interface components and functionality
- [Homepage Architecture](page-architecture/HOMEPAGE_ARCHITECTURE.md) - Homepage components and structure
- [Top Bar Architecture](page-architecture/TOPBAR_ARCHITECTURE.md) - Navigation component implementation

### Server Architecture

- [Node.js Server Architecture](server-architecture/NODE_SERVER_ARCHITECTURE.md) - Backend architecture using Node.js
- [Edge Functions Documentation](server-architecture/EDGE_FUNCTIONS_DOCUMENTATION.md) - Backend serverless functions

### Implementation Guidelines

- [Design Guidelines](implementation-guidelines/DESIGN_GUIDELINES.md) - UI styling patterns and visual language
- [Implementation Plan](implementation-guidelines/IMPLEMENTATION_PLAN.md) - Development roadmap and priorities
- [Roadmap](implementation-guidelines/ROADMAP.md) - Detailed project roadmap
- [Rebuild Guide](implementation-guidelines/REBUILD_GUIDE.md) - Comprehensive roadmap for rebuilding the application
- [Secrets](implementation-guidelines/SECRETS.md) - Secret management and access patterns

### Project Management

- Individual Epic Documents:
  - [Epic 1: Foundation & Infrastructure](epics/EPIC_1_FOUNDATION.md)
  - [Epic 2: Homepage Integration](epics/EPIC_2_HOMEPAGE.md)
  - [Epic 3: Repository Page Integration](epics/EPIC_3_REPOSITORY.md)
  - [Epic 4: Contributors Page Integration](epics/EPIC_4_CONTRIBUTORS.md)
  - [Epic 5: Merge Requests Page Integration](epics/EPIC_5_MERGE_REQUESTS.md)
  - [Epic 6: Commits Page Integration](epics/EPIC_6_COMMITS.md)
  - [Epic 7: Performance & Refinement](epics/EPIC_7_PERFORMANCE.md)

## How To Use This Documentation

### For New Developers

1. Start with the [Rebuild Guide](implementation-guidelines/REBUILD_GUIDE.md) for a complete overview of the project structure
2. Review the [Database Schema](data-systems/DATABASE_SCHEMA.md) and [Data Pipeline Architecture](data-systems/DATA_PIPELINE_ARCHITECTURE.md) to understand the data flow
3. Explore individual page architecture documents based on your area of focus
4. Reference the [Design Guidelines](implementation-guidelines/DESIGN_GUIDELINES.md) for UI implementation

### For Project Planning

1. Review the [Implementation Plan](implementation-guidelines/IMPLEMENTATION_PLAN.md) for high-level priorities
2. Consult the Epic documents for dependency management and implementation tasks

### For Maintenance and Extension

1. Use the [Secrets](implementation-guidelines/SECRETS.md) document for managing API keys and credentials
2. Reference specific component architecture documents when extending functionality
3. Follow patterns in the [Design Guidelines](implementation-guidelines/DESIGN_GUIDELINES.md) for UI consistency

## Documentation Maintenance

When making significant changes to the application:

1. Update the relevant documentation files to reflect the changes
2. Ensure any new components or data flows are properly documented
3. Maintain the same level of detail and structure in documentation updates
