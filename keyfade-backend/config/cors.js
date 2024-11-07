const cors = require('cors');
const logger = require('../config/logger'); // Assuming you have logger.js in utils
const { sendWebhookNotification } = require('../services/webhookService'); // Webhook logic if moved to services
  
//CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigin = process.env.FRONTEND_URL;

    if (origin === allowedOrigin || !origin) {  // Allow requests from the specified frontend or same-origin
      callback(null, true);
    } else {
      const errorMessage = `CORS access denied for origin: ${origin}`;
      logger.warn(errorMessage);
      sendWebhookNotification('CORS Error', { errorMessage, origin }); // Send webhook notification for CORS errors
      callback(new Error(errorMessage));
    }
  },
  optionsSuccessStatus: 200,
};

// Middleware to handle CORS errors and log them
const handleCorsErrors = (err, req, res, next) => {
  if (err && err.message.includes('CORS')) {
    const errorDetails = {
      errorMessage: err.message,
      origin: req.get('origin'),
      path: req.path,
      method: req.method,
    };
    logger.error(`CORS error: ${err.message}`, errorDetails);
    sendWebhookNotification('CORS Error', errorDetails); // Send webhook notification for CORS errors
    return res.status(403).json({ error: 'CORS access denied' });
  }
  next();  // Continue to the next middleware or route handler if no CORS error
};

module.exports = {
  corsOptions,
  handleCorsErrors,
};
