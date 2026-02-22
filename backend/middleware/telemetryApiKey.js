const logger = require('../config/logger');

const buildTelemetryApiKeyMiddleware = () => {
  const configuredKey = process.env.TELEMETRY_API_KEY || process.env.TELEMETRY_API_TOKEN;

  return (req, res, next) => {
    if (!configuredKey) {
      return next();
    }

    const xApiKey = (req.headers['x-api-key'] || '').trim();
    const xTelemetryApiKey = (req.headers['x-telemetry-api-key'] || '').trim();
    const bearerToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const providedKey = xApiKey || xTelemetryApiKey || bearerToken;

    if (providedKey === configuredKey) {
      return next();
    }

    logger.warn('Unauthorized telemetry access attempt');
    return res.status(401).json({ error: 'Unauthorized telemetry access' });
  };
};

module.exports = {
  buildTelemetryApiKeyMiddleware,
};
