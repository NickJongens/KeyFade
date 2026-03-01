const { SecretClient } = require('@azure/keyvault-secrets');
const { ClientSecretCredential } = require('@azure/identity');
const cron = require('node-cron');
const winston = require('winston');
const { sendWebhookNotification } = require('../services/webhookService'); // Assuming a webhookService exists for notifications
const { syncTrackedSecretsFromVaultNames } = require('../telemetry/abuseTelemetry');

// Setup Azure Key Vault connection
const credential = new ClientSecretCredential(
  process.env.TENANT_ID,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);
const client = new SecretClient(`https://${process.env.KEY_VAULT_NAME}.vault.azure.net`, credential);

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

// In-memory cache to store the secrets and their expiration dates
let secretCache = {};

// Function to delete expired keys from Azure Key Vault
const deleteExpiredKeys = async () => {
  try {
    logger.info('Checking for expired keys...');
    const discoveredSecretIds = new Set();
    const activeSecretIds = new Set();
    const now = new Date();

    // Fetch all secrets in the Key Vault
    for await (const secretProperties of client.listPropertiesOfSecrets()) {
      const secretId = secretProperties.name;
      discoveredSecretIds.add(secretId);
      const expiresOn = secretProperties.expiresOn || null;
      const isEnabled = secretProperties.enabled !== false;

      try {
        if (!isEnabled) {
          delete secretCache[secretId];
          logger.info(`Secret ${secretId} is disabled. Excluding from active inventory.`);
          continue;
        }

        // Check if the secret is already in cache
        if (secretCache[secretId] && secretCache[secretId].expiresOn > now) {
          logger.info(`Secret ${secretId} is still valid (cached). Skipping...`);
          activeSecretIds.add(secretId);
          continue;
        }

        // Check if the secret is expired
        if (expiresOn && expiresOn <= now) {
          logger.info(`Secret ${secretId} has expired. Deleting...`);

          // Delete the expired secret
          await client.beginDeleteSecret(secretId);
          logger.info(`Secret ${secretId} deleted successfully.`);

          // Remove the secret from the cache after deletion
          delete secretCache[secretId];
        } else {
          // Cache the valid secret's expiration date
          secretCache[secretId] = {
            expiresOn,
          };
          logger.info(`Secret ${secretId} is still valid. Cached expiration date: ${expiresOn}`);
          activeSecretIds.add(secretId);
        }
      } catch (error) {
        logger.error(`Failed to check or delete secret: ${secretId}`, error);
      }
    }

    // Drop cache entries for secrets that are no longer listed in Key Vault.
    for (const cachedSecretId of Object.keys(secretCache)) {
      if (!discoveredSecretIds.has(cachedSecretId)) {
        delete secretCache[cachedSecretId];
      }
    }

    // Sync telemetry inventory from already-known active names (no additional Key Vault calls).
    syncTrackedSecretsFromVaultNames([...activeSecretIds]);
  } catch (error) {
    logger.error('Failed to retrieve secrets from Key Vault', error);
  }
};

// Function to schedule the daily cleanup job
const scheduleKeyVaultCleanup = () => {
  // Notify server start and cleanup schedule initiation
  const startMessage = 'Server started, initiating immediate cleanup and scheduling daily key vault cleanup.';
  logger.info(startMessage);
  
  // Optional: Send server start notification via webhook
  sendWebhookNotification('Server Start', {
    message: startMessage,
    timestamp: new Date().toISOString(),
  });

  // Run cleanup immediately on server start
  logger.info('Running immediate cleanup for expired secrets...');
  deleteExpiredKeys();

  // Schedule the daily cleanup job at midnight
  cron.schedule('0 0 * * *', () => {
    logger.info('Running daily job to delete expired keys...');
    deleteExpiredKeys();
  });
};

module.exports = { scheduleKeyVaultCleanup };
