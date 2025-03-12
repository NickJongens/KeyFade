const { SecretClient } = require('@azure/keyvault-secrets');
const { ClientSecretCredential } = require('@azure/identity');
const cron = require('node-cron');
const winston = require('winston');
const { sendWebhookNotification } = require('../services/webhookService'); // Assuming a webhookService exists for notifications

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

    // Fetch all secrets in the Key Vault
    for await (const secretProperties of client.listPropertiesOfSecrets()) {
      const secretId = secretProperties.name;

      try {
        // Check if the secret is already in cache
        if (secretCache[secretId] && secretCache[secretId].expiresOn > new Date()) {
          logger.info(`Secret ${secretId} is still valid (cached). Skipping...`);
          continue;
        }

        // Fetch the secret details from Azure Key Vault
        const secret = await client.getSecret(secretProperties.name);

        // Check if the secret is expired
        if (secret.properties.expiresOn && secret.properties.expiresOn <= new Date()) {
          logger.info(`Secret ${secretId} has expired. Deleting...`);

          // Delete the expired secret
          await client.beginDeleteSecret(secret.name);
          logger.info(`Secret ${secretId} deleted successfully.`);

          // Remove the secret from the cache after deletion
          delete secretCache[secretId];
        } else {
          // Cache the valid secret's expiration date
          secretCache[secretId] = {
            expiresOn: secret.properties.expiresOn,
          };
          logger.info(`Secret ${secretId} is still valid. Cached expiration date: ${secret.properties.expiresOn}`);
        }
      } catch (error) {
        logger.error(`Failed to check or delete secret: ${secretId}`, error);
      }
    }
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
