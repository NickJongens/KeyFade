// keyfade-backend/config/cors.js

const cors = require('cors');
const logger = require('../config/logger');
const { sendWebhookNotification } = require('../services/webhookService');
const { recordAbuseEvent } = require('../telemetry/abuseTelemetry');
const { getClientIp, getSanitizedPath } = require('../utils/requestMeta');

const frontendUrl = process.env.FRONTEND_URL; // e.g. "http://localhost:9001"
const extraAllowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS; // e.g. "http://localhost:3000,http://example.com"

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // Always allow the frontend URL
    if (origin === frontendUrl) {
      return callback(null, true);
    }
    // Allow all origins if the wildcard is set in extraAllowedOriginsEnv
    if (extraAllowedOriginsEnv === '*') {
      return callback(null, true);
    }
    // If extra allowed origins are provided, check against them
    if (extraAllowedOriginsEnv) {
      const allowedOrigins = extraAllowedOriginsEnv.split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    // Otherwise, deny access and log/send notification
    const errorMessage = `CORS access denied for origin: ${origin}`;
    logger.warn('CORS access denied', { errorMessage, origin });
    callback(new Error(errorMessage));
  },
  optionsSuccessStatus: 200,
};

// Middleware to handle CORS errors and log them
const handleCorsErrors = (err, req, res, next) => {
  if (err && err.message.includes('CORS')) {
    const ip = getClientIp(req);
    const errorDetails = {
      errorMessage: err.message,
      ip,
      origin: req.get('origin'),
      path: getSanitizedPath(req),
      method: req.method,
    };

    recordAbuseEvent('cors_denial', {
      ip,
      path: errorDetails.path,
      method: errorDetails.method,
      origin: errorDetails.origin,
      reason: err.message,
    });

    logger.error('CORS error', errorDetails);
    sendWebhookNotification('CORS Error', errorDetails);
    return res.status(403).json({ error: 'CORS access denied' });
  }
  next();
};

module.exports = {
  corsOptions,
  handleCorsErrors,
};
