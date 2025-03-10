
# GitHub Explorer Documentation

This directory contains comprehensive documentation for the GitHub Explorer application. These documents provide detailed information about the application's architecture, components, data flow, and design guidelines.

## Documentation Files

### System Architecture

- [Database Schema](DATABASE_SCHEMA.md) - Detailed database structure and relationships
- [Data Pipeline Architecture](DATA_PIPELINE_ARCHITECTURE.md) - End-to-end data processing flow
- [Edge Functions Documentation](EDGE_FUNCTIONS_DOCUMENTATION.md) - Backend serverless functions
- [Rebuild Guide](REBUILD_GUIDE.md) - Comprehensive roadmap for rebuilding the application
- [Next.js Architecture](NEXT_JS_ARCHITECTURE.md) - Frontend architecture using Next.js
- [Node.js Server Architecture](NODE_SERVER_ARCHITECTURE.md) - Backend architecture using Node.js
- [Supabase Integration](SUPABASE_INTEGRATION.md) - Database integration details

### UI Architecture

- [Repository Page Architecture](REPOSITORY_PAGE_ARCHITECTURE.md) - Repository page components and data flow
- [Contributors Page Architecture](CONTRIBUTORS_PAGE_ARCHITECTURE.md) - Contributors page components and data flow
- [Merge Requests Architecture](MERGE_REQUESTS_ARCHITECTURE.md) - Merge requests page components and data flow
- [Commits Page Architecture](COMMITS_PAGE_ARCHITECTURE.md) - Commits page components and data flow
- [Admin Page Architecture](ADMIN_PAGE_ARCHITECTURE.md) - Admin interface components and functionality
- [Homepage Architecture](HOMEPAGE_ARCHITECTURE.md) - Homepage components and structure
- [Top Bar Architecture](TOPBAR_ARCHITECTURE.md) - Navigation component implementation

### Project Management

- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Development roadmap and priorities
- [Epic Implementation Sequence](epics/EPIC_IMPLEMENTATION_SEQUENCE.md) - Sequence for implementing epics
- Individual Epic Documents:
  - [Epic 1: Foundation & Infrastructure](epics/EPIC_1_FOUNDATION.md)
  - [Epic 2: Homepage Integration](epics/EPIC_2_HOMEPAGE.md)
  - [Epic 3: Repository Page Integration](epics/EPIC_3_REPOSITORY.md)
  - [Epic 4: Contributors Page Integration](epics/EPIC_4_CONTRIBUTORS.md)
  - [Epic 5: Merge Requests Page Integration](epics/EPIC_5_MERGE_REQUESTS.md)
  - [Epic 6: Commits Page Integration](epics/EPIC_6_COMMITS.md)
  - [Epic 7: Performance & Refinement](epics/EPIC_7_PERFORMANCE.md)

### Design System

- [Design Guidelines](DESIGN_GUIDELINES.md) - UI styling patterns and visual language

### Security and Configuration

- [Secrets](SECRETS.md) - Secret management and access patterns

## How To Use This Documentation

### For New Developers

1. Start with the [Rebuild Guide](REBUILD_GUIDE.md) for a complete overview of the project structure
2. Review the [Database Schema](DATABASE_SCHEMA.md) and [Data Pipeline Architecture](DATA_PIPELINE_ARCHITECTURE.md) to understand the data flow
3. Explore individual page architecture documents based on your area of focus
4. Reference the [Design Guidelines](DESIGN_GUIDELINES.md) for UI implementation

### For Project Planning

1. Review the [Implementation Plan](IMPLEMENTATION_PLAN.md) for high-level priorities
2. Consult the [Epic Implementation Sequence](epics/EPIC_IMPLEMENTATION_SEQUENCE.md) for dependency management
3. Refer to individual epic documents for detailed implementation tasks

### For Maintenance and Extension

1. Use the [Secrets](SECRETS.md) document for managing API keys and credentials
2. Reference specific component architecture documents when extending functionality
3. Follow patterns in the [Design Guidelines](DESIGN_GUIDELINES.md) for UI consistency

## Documentation Maintenance

When making significant changes to the application:

1. Update the relevant documentation files to reflect the changes
2. Ensure any new components or data flows are properly documented
3. Maintain the same level of detail and structure in documentation updates
