const express = require('express');
const router = express.Router();
const { storeSecret, retrieveSecret, deleteSecret } = require('../controllers/secretController');
const logger = require('../config/logger');
const { createRateLimiter } = require('../config/rateLimiter'); // Import the rate limiter middleware

// Create secret (with rate limiting)
router.post('/create', createRateLimiter(), async (req, res) => {
    try {
        const secretData = req.body;

        // Validate input
        if (!secretData || !secretData.value || typeof secretData.value !== 'string') {
            logger.warn('Invalid secret data received:', { secretData });
            return res.status(400).json({ error: 'Secret value is required and must be a string' });
        }

        logger.info('Creating secret:', { secretData });

        // Call the controller method to store the secret
        await storeSecret(req, res);
    } catch (error) {
        logger.error('Error creating secret:', { error: error.message });
        res.status(500).json({
            message: 'Failed to create secret',
            error: error.message,
        });
    }
});

// Get secret (with rate limiting)
router.get('/secrets/:id/:key', createRateLimiter(), async (req, res) => {
    try {
        const { id, key } = req.params;
        logger.info(`Fetching secret for ID: ${id}, Key: ${key}`);

        // Call the controller method to retrieve the secret
        await retrieveSecret(req, res);
    } catch (error) {
        logger.error('Error fetching secret:', { error: error.message });
        res.status(500).json({
            message: 'Failed to fetch secret',
            error: error.message,
        });
    }
});

// Delete secret (with rate limiting)
router.delete('/secrets/:id/:key', createRateLimiter(), async (req, res) => {
    try {
        const { id, key } = req.params;
        logger.info(`Deleting secret for ID: ${id}, Key: ${key}`);

        // Call the controller method to delete the secret
        await deleteSecret(req, res);
    } catch (error) {
        logger.error('Error deleting secret:', { error: error.message });
        res.status(500).json({
            message: 'Failed to delete secret',
            error: error.message,
        });
    }
});

module.exports = router;
