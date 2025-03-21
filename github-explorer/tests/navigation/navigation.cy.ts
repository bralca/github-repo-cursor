/// <reference types="cypress" />

describe('Navigation Tests', () => {
  // Sample repository data
  const repository = {
    name: 'React',
    github_id: '10270250',
    slug: 'react-10270250'
  };
  
  // Sample contributor data
  const contributor = {
    name: 'Dan Abramov',
    github_id: '810438',
    slug: 'dan-abramov-810438'
  };
  
  // Sample merge request data
  const mergeRequest = {
    title: 'Add Concurrent Mode',
    github_id: '987654',
    slug: 'add-concurrent-mode-987654'
  };
  
  // Sample file/commit data
  const file = {
    filename: 'src/React.js',
    github_id: '123456',
    slug: 'src-react-js-123456'
  };

  beforeEach(() => {
    // Intercept API calls to return mock data
    cy.intercept('GET', '**/api/sqlite/repositories*', {
      statusCode: 200,
      body: {
        id: repository.github_id,
        name: repository.name,
        description: 'A JavaScript library for building user interfaces',
        stars: 10000,
        forks: 5000
      }
    });
    
    cy.intercept('GET', '**/api/sqlite/contributors*', {
      statusCode: 200,
      body: {
        id: contributor.github_id,
        name: contributor.name,
        username: 'gaearon',
        avatar: 'https://avatars.githubusercontent.com/u/810438'
      }
    });
    
    cy.intercept('GET', '**/api/sqlite/merge-requests*', {
      statusCode: 200,
      body: {
        id: mergeRequest.github_id,
        title: mergeRequest.title,
        description: 'This PR adds concurrent mode to React',
        state: 'merged'
      }
    });
    
    cy.intercept('GET', '**/api/sqlite/commits*', {
      statusCode: 200,
      body: {
        id: file.github_id,
        filename: file.filename,
        additions: 100,
        deletions: 50,
        status: 'modified'
      }
    });
  });

  it('navigates through the complete entity hierarchy', () => {
    // Start from home page
    cy.visit('/');
    cy.contains('GitHub Explorer').should('be.visible');
    
    // Navigate to repository page
    cy.visit(`/${repository.slug}`);
    cy.contains(repository.name).should('be.visible');
    cy.contains('Repository Health').should('be.visible');
    
    // Check breadcrumbs
    cy.get('[data-testid="breadcrumb"]').within(() => {
      cy.contains('Home').should('be.visible');
      cy.contains(repository.name).should('be.visible');
    });
    
    // Navigate to contributor page
    cy.visit(`/contributors/${contributor.slug}`);
    cy.contains(contributor.name).should('be.visible');
    
    // Check breadcrumbs
    cy.get('[data-testid="breadcrumb"]').within(() => {
      cy.contains('Home').should('be.visible');
      cy.contains('Contributors').should('be.visible');
      cy.contains(contributor.name).should('be.visible');
    });
    
    // Navigate back to repository
    cy.get('[data-testid="breadcrumb"]').contains('Home').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // Navigate to merge request page
    cy.visit(`/${repository.slug}/merge-requests/${mergeRequest.slug}`);
    cy.contains(mergeRequest.title).should('be.visible');
    
    // Check breadcrumbs
    cy.get('[data-testid="breadcrumb"]').within(() => {
      cy.contains('Home').should('be.visible');
      cy.contains(repository.name).should('be.visible');
      cy.contains('Merge Requests').should('be.visible');
      cy.contains(mergeRequest.title).should('be.visible');
    });
    
    // Navigate to commit page
    cy.visit(`/${repository.slug}/merge-requests/${mergeRequest.slug}/commits/${contributor.slug}/${file.slug}`);
    cy.contains(file.filename).should('be.visible');
    
    // Check breadcrumbs
    cy.get('[data-testid="breadcrumb"]').within(() => {
      cy.contains('Home').should('be.visible');
      cy.contains(repository.name).should('be.visible');
      cy.contains('Merge Requests').should('be.visible');
      cy.contains(mergeRequest.title).should('be.visible');
      cy.contains('Commits').should('be.visible');
    });
    
    // Test back navigation using breadcrumbs
    cy.get('[data-testid="breadcrumb"]').contains('Merge Requests').click();
    cy.url().should('include', `/${repository.slug}/merge-requests/${mergeRequest.slug}`);
    
    cy.get('[data-testid="breadcrumb"]').contains(repository.name).click();
    cy.url().should('include', `/${repository.slug}`);
    
    cy.get('[data-testid="breadcrumb"]').contains('Home').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('handles 404 pages gracefully', () => {
    // Mock 404 response
    cy.intercept('GET', '**/api/sqlite/repositories*', {
      statusCode: 404,
      body: { error: 'Not found' }
    });
    
    // Visit non-existent repository
    cy.visit('/nonexistent-123456');
    
    // Check for appropriate error message
    cy.contains('Repository Not Found').should('be.visible');
    
    // Check for back link
    cy.contains('Go Back').should('be.visible').click();
    
    // Should navigate back to home
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
  
  it('tests responsive navigation on mobile', () => {
    // Set viewport to mobile size
    cy.viewport('iphone-x');
    
    // Start from home page
    cy.visit('/');
    
    // Mobile menu should be visible
    cy.get('[data-testid="mobile-menu"]').should('be.visible').click();
    
    // Navigation items should be in the drawer
    cy.contains('Repositories').should('be.visible').click();
    
    // Should navigate to repositories page
    cy.url().should('include', '/repositories');
    
    // Check if breadcrumb is responsive
    cy.get('[data-testid="breadcrumb"]').should('have.css', 'overflow-x', 'auto');
  });
}); 