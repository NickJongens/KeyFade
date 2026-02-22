const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');
const { sendWebhookNotification } = require('../services/webhookService');
const { recordAbuseEvent } = require('../telemetry/abuseTelemetry');
const { getClientIp, getSanitizedPath } = require('../utils/requestMeta');

const rateLimitCache = new Map(); // In-memory cache to track IPs that triggered rate limit

const createRateLimiter = () => {
  return rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each Secret ID to 10 requests per window
    keyGenerator: (req) => getClientIp(req),
    handler: (req, res) => {
      const clientIp = getClientIp(req);
      const secretId = req.params.id || 'undefined'; // Default to 'undefined' if no ID in params
      const path = getSanitizedPath(req);
      const method = req.method;

      recordAbuseEvent('rate_limit_hit', {
        ip: clientIp,
        secretId,
        path,
        method,
        reason: 'Rate limit exceeded',
      });

      // Check if we've already sent a notification for this IP in the last 15 minutes
      if (rateLimitCache.has(clientIp)) {
        logger.warn('Rate limit exceeded but already notified recently', {
          secretId,
          clientIp,
          path,
          method,
        });
      } else {
        const errorMessage = `Rate limit exceeded for Secret ID: ${secretId} from IP: ${clientIp}`;
        logger.warn('Rate limit exceeded', { errorMessage, secretId, clientIp, path, method });

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
