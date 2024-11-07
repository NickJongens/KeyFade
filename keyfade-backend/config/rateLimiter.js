const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');
const { sendWebhookNotification } = require('../services/webhookService');

const rateLimitCache = new Map(); // In-memory cache to track IPs that triggered rate limit

const createRateLimiter = () => {
  return rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each Secret ID to 10 requests per window
    keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip, // Use IP as key
    handler: (req, res) => {
      const clientIp = req.headers['cf-connecting-ip'] || req.ip;
      const secretId = req.params.id || 'undefined'; // Default to 'undefined' if no ID in params

      // Check if we've already sent a notification for this IP in the last 15 minutes
      if (rateLimitCache.has(clientIp)) {
        logger.warn(`Rate limit exceeded for Secret ID: ${secretId} from IP: ${clientIp}, but already notified. Skipping further notifications.`);
      } else {
        const errorMessage = `Rate limit exceeded for Secret ID: ${secretId} from IP: ${clientIp}`;
        logger.warn(errorMessage);

        sendWebhookNotification('Rate Limiting Error', {
          errorMessage,
          secretId,
          ip: clientIp,
        });

        // Store the IP and timestamp of the rate limit trigger
        rateLimitCache.set(clientIp, Date.now());

        // Set a timeout to remove the IP from the cache after 15 minutes
        setTimeout(() => {
          rateLimitCache.delete(clientIp);
        }, 15 * 60 * 1000); // 15 minutes
      }

      // Respond with 429 status
      res.status(429).json({
        error: 'Too many requests for this secret. Please try again later.',
      });
    },
  });
};

module.exports = { createRateLimiter };
