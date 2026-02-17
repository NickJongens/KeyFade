const express = require('express');
const cors = require('cors');
const { scheduleKeyVaultCleanup } = require('./cleanup/keyVaultCleanup');
const secretRoutes = require('./routes/secretRoutes');
const { corsOptions } = require('./config/cors');
const logger = require('./config/logger');

require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use('/api', secretRoutes); // Handle all secret operations under /api/

// Schedule regular Key Vault cleanup
scheduleKeyVaultCleanup();

module.exports = app;
