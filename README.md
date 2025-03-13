# GitHub Explorer

A modern application for exploring GitHub repositories, analyzing contributors, tracking merge requests, and visualizing commit data.

![GitHub Explorer](https://via.placeholder.com/800x400?text=GitHub+Explorer)

## 🌟 Project Overview

GitHub Explorer is a comprehensive analytics platform that transforms raw GitHub data into actionable insights. The project consists of:

1. **Next.js Frontend**: A modern, responsive web application built with Next.js 14 and App Router
2. **Node.js Data Pipeline**: A backend service that processes GitHub API data and updates the database
3. **Supabase Database**: A PostgreSQL database for storing structured GitHub data

### Key Features

- **Repository Analytics**: Track star count, fork count, issue statistics, and overall activity
- **Contributor Insights**: Visualize contributor activity, code ownership, and collaboration patterns
- **Merge Request Analysis**: Monitor PR cycle time, approval rates, and code review metrics
- **Commit Visualization**: See code changes over time with intuitive visualizations
- **Admin Interface**: Configure data sources, manage users, and customize settings

## 📂 Repository Structure

This repository contains the following key directories:

- `github-explorer/`: The main Next.js application 
- `DOCS/`: Comprehensive documentation for all aspects of the project
- `LEGACY/`: Original Vite implementation for reference
- `.cursor/`: AI development workflow rules and guidance
- `.gitignore`: Git configuration to exclude unnecessary files
- `package.json`: Root dependencies for the monorepo

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (or local Supabase setup)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/github-explorer.git
   cd github-explorer
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install application dependencies:
   ```bash
   cd github-explorer
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env.local` in the github-explorer directory
   - Fill in the required environment variables (see comments in .env.example)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Documentation

Comprehensive documentation is available in the `DOCS/` directory:

- **Core Architecture**: Frontend architecture, data fetching patterns, and component organization
- **Page Architecture**: Implementation details for specific pages
- **Data Systems**: Database schema and data pipeline documentation
- **Server Architecture**: Backend services and serverless functions
- **Implementation Guidelines**: Development roadmap, design principles, and coding standards
- **AI Collaboration**: AI-assisted development workflow and patterns

Start with the [`DOCS/DOCUMENTATION_INDEX.md`](DOCS/DOCUMENTATION_INDEX.md) for a complete overview.

## 🤖 AI-Assisted Development

This project implements a structured approach to AI-assisted development:

- **[AI Collaboration Architecture](DOCS/AI_COLLABORATION_ARCHITECTURE.md)**: Comprehensive documentation of our AI-assisted workflow
- **[Cursor Rules](.cursor/README.md)**: Context-specific guidance for AI tools
- **Documentation as Prompts**: Our documentation is structured to provide optimal context for AI assistance

The AI collaboration system provides:
1. Consistent implementation patterns across the codebase
2. Efficient use of AI capabilities for development tasks
3. Automated context-switching based on development focus
4. Built-in guidance for best practices and error prevention

## 🧪 Development

### Technology Stack

- **Frontend**:
  - Next.js 14+ with App Router
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - React Query for data fetching
  - Context API for state management

- **Backend**:
  - Node.js with Express (data pipeline)
  - Supabase (PostgreSQL database)
  - GitHub API integration

### Project Structure

- `app/`: Next.js App Router pages and routing
- `components/`: Reusable UI components
- `lib/`: Utility functions and helpers
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions
- `providers/`: React context providers
- `public/`: Static assets

## 🤝 Contributing

We welcome contributions to the GitHub Explorer project! 

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For detailed guidance on our development workflow, please review the [AI Collaboration Architecture](DOCS/AI_COLLABORATION_ARCHITECTURE.md) document.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [GitHub API](https://docs.github.com/en/rest) 
