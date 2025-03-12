const { v4: uuidv4 } = require('uuid');
const azureService = require('../services/azureService');
const logger = require('../config/logger');
const crypto = require('crypto');

// Function to generate a secure 16-character key
const generateKey = () => {
  return crypto.randomBytes(8).toString('hex'); // Generates a 16-character hex key
};

// Store a secret
exports.storeSecret = async (req, res) => {
  const { value, expiryDays } = req.body;

  // Validate input
  if (!value || typeof value !== 'string') {
    logger.warn('Invalid input: Secret value is required and must be a string');
    return res.status(400).json({ error: 'Secret value is required and must be a string' });
  }

  const name = uuidv4();
  const key = generateKey();

  // Validate expiryDays
  const validExpiryDays = Math.min(Math.max(expiryDays || 1, 1), 90);
  const expiresOn = new Date();
  expiresOn.setDate(expiresOn.getDate() + validExpiryDays);

  const keyExpiresOn = new Date();
  keyExpiresOn.setDate(keyExpiresOn.getDate() + validExpiryDays);

  logger.info(`Storing secret with ID: ${name}, expiration: ${expiresOn}, key expiration: ${keyExpiresOn}`);

  try {
    // Store the secret with expiration date
    const secretResponse = await azureService.storeSecretInVault(name, value, expiresOn);
    logger.info(`Secret stored successfully: ${JSON.stringify(secretResponse)}`);

    // Store the key as a separate secret with expiration date
    const keyResponse = await azureService.storeSecretInVault(`${name}-key`, key, keyExpiresOn);
    logger.info(`Key stored successfully: ${JSON.stringify(keyResponse)}`);

    // Define the frontend URL (this could also come from an environment variable)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9001';

    // Construct the full URL
    const fullUrl = `${FRONTEND_URL}/${name}/${key}`;

    res.status(201).json({
      message: 'Secret and key stored successfully',
      secretId: name,
      key,
      expiresOn,
      fullUrl, // Include the full URL in the response
    });
  } catch (error) {
    logger.error('Failed to store secret', { errorMessage: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to store secret' });
  }
};

// Retrieve a secret
exports.retrieveSecret = async (req, res) => {
  const { id, key } = req.params;

  logger.info(`Retrieving secret with ID: ${id}, Key: ${key}`);
  
  if (!id || !key) {
    logger.warn('Missing ID or Key in request parameters');
    return res.status(400).json({ error: 'ID and Key are required parameters' });
  }

  try {
    // Retrieve the key for the secret
    const keySecretObj = await azureService.getSecretFromVault(`${id}-key`);
    
    if (!keySecretObj || keySecretObj.value !== key) {
      logger.warn(`Unauthorized access attempt with incorrect key for secret ID: ${id}`);
      return res.status(403).json({ error: 'Unauthorized: Invalid key' });
    }

    // If the key matches, retrieve the actual secret
    const secretObj = await azureService.getSecretFromVault(id);
    
    if (!secretObj) {
      logger.warn(`Secret not found for ID: ${id}`);
      return res.status(404).json({ error: 'Secret not found' });
    }

    // Calculate days left until expiration
    let daysLeft = null;
    if (secretObj.expiresOn) {
      const now = new Date();
      const expiryDate = new Date(secretObj.expiresOn);
      daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    }

    logger.info('Secret retrieved successfully');
    return res.status(200).json({
      name: id,
      value: secretObj.value,
      daysLeft,
    });

  } catch (error) {
    logger.error('Failed to retrieve secret', { errorMessage: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to retrieve secret' });
  }
};

// Delete a secret
exports.deleteSecret = async (req, res) => {
  const { id, key } = req.params;

  logger.info(`Attempting to delete secret with ID: ${id}, Key: ${key}`);

  if (!id || !key) {
    logger.warn('Missing ID or Key in request parameters');
    return res.status(400).json({ error: 'ID and Key are required parameters' });
  }

  try {
    const keySecretObj = await azureService.getSecretFromVault(`${id}-key`);

    if (!keySecretObj || keySecretObj.value !== key) {
      logger.warn(`Unauthorized deletion attempt with incorrect key for secret ID: ${id}`);
      return res.status(403).json({ error: 'Unauthorized: Invalid key' });
    }

    await azureService.deleteSecretFromVault(id);
    await azureService.deleteSecretFromVault(`${id}-key`);

    logger.info(`Secret and key for ID: ${id} deleted successfully`);
    res.json({ message: 'Secret and key deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete secret', { errorMessage: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to delete secret' });
  }
};
