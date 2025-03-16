// index.js (at the root of your project)
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const logger = require('./backend/config/logger'); // Adjust the path as needed
const { corsOptions, handleCorsErrors } = require('./backend/config/cors');
const secretRoutes = require('./backend/routes/secretRoutes');
const { scheduleKeyVaultCleanup } = require('./backend/cleanup/keyVaultCleanup');
scheduleKeyVaultCleanup();

// -------------------------------
// Start Backend Server (API) on port 9002
// -------------------------------
const backendApp = express();

// Apply CORS with custom options and error handling
backendApp.use(cors(corsOptions));
backendApp.use(handleCorsErrors);

// Parse JSON and URL-encoded data
backendApp.use(express.json());
backendApp.use(express.urlencoded({ extended: true }));

// Mount your API routes under /api
backendApp.use('/api', secretRoutes);

// /status endpoint to check backend health
backendApp.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Catch-all for undefined API routes
backendApp.use('/api', (req, res, next) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

backendApp.listen(9002, () => {
  logger.info('Backend API listening on port 9002');
});

// -------------------------------
// Start Frontend Server (EJS) on port 9001
// -------------------------------
const frontendApp = express();

// Set EJS as the templating engine and set the views folder
frontendApp.set('view engine', 'ejs');
frontendApp.set('views', path.join(__dirname, 'frontend', 'views'));

// Serve static assets (CSS, JS, images, etc.) from the frontend public folder
frontendApp.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Common variables from .env for EJS template rendering
const templateVars = {
  logoUrl: process.env.LOGO_URL,
  expirySliderColor: process.env.EXPIRY_SLIDER_COLOR || '#805ad5',
  HMAC_SECRET: process.env.HMAC_SECRET,
  BACKEND_URL: process.env.BACKEND_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  FAVICON_URL: process.env.FAVICON_URL,
  TITLE_TEXT: process.env.TITLE_TEXT,
  CREATE_PASSWORD_LABEL: process.env.CREATE_PASSWORD_LABEL,
  CREATE_EXPIRY_OPTIONS_LABEL: process.env.CREATE_EXPIRY_OPTIONS_LABEL,
  LINK_GENERATED_LABEL: process.env.LINK_GENERATED_LABEL,
  LINK_COPY_LABEL: process.env.LINK_COPY_LABEL,
  SECRET_LABEL: process.env.SECRET_LABEL,
  LINK_BELOW_TEXT: process.env.LINK_BELOW_TEXT,
  TEXT_COLOR: process.env.TEXT_COLOR,
  BUTTON_COLOR: process.env.BUTTON_COLOR || '#805ad5',
  NOT_FOUND_BUTTON_COLOR: process.env.NOT_FOUND_BUTTON_COLOR,
  DELETE_BUTTON_COLOR: process.env.DELETE_BUTTON_COLOR,
  GENERATE_LINK_LABEL: process.env.GENERATE_LINK_LABEL,
};

// Render the index page (Create and Link states)
frontendApp.get('/', (req, res) => {
  res.render('index', templateVars);
});

// Render the secret view page with dynamic id and key (View state)
frontendApp.get('/:id/:key', (req, res) => {
  const { id, key } = req.params;
  res.render('index', {
    ...templateVars,
    secretId: id,
    secretKey: key,
  });
});

// /status endpoint to check backend health
frontendApp.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Catch-all for undefined frontend routes: Render custom 404 page
frontendApp.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page Not Found', ...templateVars });
});



frontendApp.listen(9001, () => {
  logger.info('Frontend server listening on port 9001');
});

console.log("Servers running: Frontend on port 9001, Backend on port 9002");
