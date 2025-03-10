# GitHub Explorer

A modern application for exploring GitHub data, including repositories, contributors, merge requests, and commits.

## Project Overview

GitHub Explorer provides analytics and visualization for GitHub data, helping users understand repository trends, contributor activities, and codebase evolution.

## Technology Stack

- **Frontend**: Next.js 14+ with App Router
- **Backend**: Node.js with Express (for data pipeline processing only)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query for server state, React Context for local state
- **Language**: TypeScript

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd github-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the required environment variables (see `.env.example`)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/`: Next.js App Router pages
- `components/`: Reusable UI components
- `lib/`: Utility functions and helpers
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions
- `integrations/`: External service integrations
- `styles/`: Global styles and Tailwind configuration

## Usage

[To be updated with specific usage instructions once the application is developed]

## Contributing

[To be updated with contribution guidelines]
