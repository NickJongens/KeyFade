require('dotenv').config();

const app = require('./app');
const logger = require('./config/logger');
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
