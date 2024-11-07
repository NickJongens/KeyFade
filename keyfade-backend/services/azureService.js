const { SecretClient } = require('@azure/keyvault-secrets');
const { ClientSecretCredential } = require('@azure/identity');
const logger = require('../config/logger');

const credential = new ClientSecretCredential(
  process.env.TENANT_ID,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

const client = new SecretClient(`https://${process.env.KEY_VAULT_NAME}.vault.azure.net`, credential);

// Store a secret in Azure Key Vault
exports.storeSecretInVault = async (name, value, expiresOn) => {
  try {
    const secretResponse = await client.setSecret(name, value, { expiresOn });
    logger.info(`Secret stored in Key Vault with name: ${name}`);
    return secretResponse;
  } catch (error) {
    logger.error(`Failed to store secret in Key Vault. Name: ${name}, Error: ${error.message}`);
    throw new Error(`Failed to store secret in Key Vault: ${error.message}`);
  }
};

// Retrieve a secret from Azure Key Vault
exports.getSecretFromVault = async (name) => {
  try {
    const secretResponse = await client.getSecret(name);
    
    // Log and handle missing secrets
    if (!secretResponse || !secretResponse.value) {
      logger.warn(`No secret found in Key Vault for name: ${name}`);
      return null;
    }
    
    logger.info(`Secret retrieved from Key Vault with name: ${name}`);
    return secretResponse.value;
  } catch (error) {
    logger.error(`Failed to retrieve secret from Key Vault. Name: ${name}, Error: ${error.message}`);
    throw new Error(`Failed to retrieve secret from Key Vault: ${error.message}`);
  }
};

// Delete a secret from Azure Key Vault
exports.deleteSecretFromVault = async (name) => {
  try {
    const deleteOperation = await client.beginDeleteSecret(name);
    logger.info(`Secret deletion started for name: ${name}`);
    return deleteOperation;
  } catch (error) {
    logger.error(`Failed to delete secret from Key Vault. Name: ${name}, Error: ${error.message}`);
    throw new Error(`Failed to delete secret from Key Vault: ${error.message}`);
  }
};
