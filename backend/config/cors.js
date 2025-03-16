// keyfade-backend/config/cors.js

const cors = require('cors');
const logger = require('../config/logger');
const { sendWebhookNotification } = require('../services/webhookService');

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigin = process.env.FRONTEND_URL; // e.g. "http://localhost:9001"

    // Allow if the origin matches our FRONTEND_URL or if there's no origin (e.g. server-to-server)
    if (origin === allowedOrigin || !origin) {
      callback(null, true);
    } else {
      const errorMessage = `CORS access denied for origin: ${origin}`;
      logger.warn(errorMessage);
      sendWebhookNotification('CORS Error', { errorMessage, origin }); 
      callback(new Error(errorMessage));
    }
  },
  optionsSuccessStatus: 200,
};

// Middleware to handle CORS errors and log them
const handleCorsErrors = (err, req, res, next) => {
  // Check if it's a CORS error
  if (err && err.message.includes('CORS')) {
    const errorDetails = {
      errorMessage: err.message,
      origin: req.get('origin'),
      path: req.path,
      method: req.method,
    };
    logger.error(`CORS error: ${err.message}`, errorDetails);
    return res.status(403).json({ error: 'CORS access denied' });
  }
  next(); // No CORS error, move on
};

module.exports = {
  corsOptions,
  handleCorsErrors,
};
