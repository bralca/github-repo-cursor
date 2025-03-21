/**
 * GitHub Data Pipeline - Main Index File
 * 
 * This file exports the complete pipeline architecture for processing
 * GitHub data, including core components, processors, stages, and utilities.
 */

// Export core components
export * from './core/index.js';

// Export processors
export * from './processors/index.js';

// Export stages
export * from './stages/index.js';

// Export utilities
export * from './utils/index.js';

// Export sitemap pipeline
export { default as createSitemapPipeline } from './sitemap-pipeline.js'; 