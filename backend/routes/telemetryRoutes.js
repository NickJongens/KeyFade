const express = require('express');
const { getAbuseTelemetrySnapshot } = require('../telemetry/abuseTelemetry');

const router = express.Router();

router.get('/abuse', (req, res) => {
  const snapshot = getAbuseTelemetrySnapshot({
    recentLimit: req.query.recentLimit,
    hotLimit: req.query.hotLimit,
    targetLimit: req.query.targetLimit,
  });

  res.status(200).json(snapshot);
});

module.exports = router;
