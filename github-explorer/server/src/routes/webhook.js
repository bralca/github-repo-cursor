import express from 'express';
import { processWebhookPayload } from '../pipeline/stages/webhook-processor-pipeline.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GitHub webhook endpoint
 * 
 * This endpoint receives GitHub webhook payloads and processes them
 * using the webhook processor pipeline.
 */
router.post('/github', async (req, res) => {
  try {
    // Validate GitHub webhook signature if needed
    // This would typically involve checking the X-Hub-Signature header
    
    const payload = req.body;
    
    if (!payload) {
      logger.warn('Received empty webhook payload');
      return res.status(400).json({ error: 'Empty payload' });
    }
    
    logger.info('Received GitHub webhook', {
      event: req.headers['x-github-event'],
      delivery: req.headers['x-github-delivery'],
      repository: payload.repository?.full_name
    });
    
    // Process the webhook payload asynchronously
    // We don't want to block the response to GitHub
    processWebhookPayload(payload)
      .then(result => {
        logger.info('Webhook processing completed successfully', { result });
      })
      .catch(error => {
        logger.error('Webhook processing failed', { error });
      });
    
    // Respond immediately to GitHub
    res.status(202).json({ status: 'accepted' });
  } catch (error) {
    logger.error('Error handling webhook', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook status endpoint
 * 
 * This endpoint provides information about the webhook processor.
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

export default router; 