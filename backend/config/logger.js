const winston = require('winston');

const SENSITIVE_KEYS = new Set([
  'secret',
  'secretvalue',
  'value',
  'key',
  'token',
  'password',
  'authorization',
  'clientsecret',
]);

const normalizeKey = (key) => String(key).toLowerCase().replace(/[^a-z0-9]/g, '');

const redact = (input, depth = 0) => {
  if (depth > 6) return '[TRUNCATED]';
  if (input === null || input === undefined) return input;
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map((item) => redact(item, depth + 1));

  const cloned = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(normalizeKey(key))) {
      cloned[key] = '[REDACTED]';
      continue;
    }
    cloned[key] = redact(value, depth + 1);
  }
  return cloned;
};

const redactFormat = winston.format((info) => redact(info));

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactFormat(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
