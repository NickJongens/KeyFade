const express = require('express');
const cors = require('cors');
const { scheduleKeyVaultCleanup } = require('./cleanup/keyVaultCleanup');
const secretRoutes = require('./routes/secretRoutes');
const { corsOptions } = require('./config/cors');
const logger = require('./config/logger');
const verifyHMAC = require('./services/hmacService'); // Import HMAC service

require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Apply HMAC verification middleware to all routes under /api/secrets
app.use('/api/secrets', verifyHMAC);

// Routes
app.use('/api', secretRoutes); // Handle all secret operations under /api/

// Schedule regular Key Vault cleanup
scheduleKeyVaultCleanup();

module.exports = app;
