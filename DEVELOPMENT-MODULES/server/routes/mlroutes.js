
const express = require('express');
const router  = express.Router();
const { predict, getMetrics, isLoaded } = require('../ml/predict');

// GET /api/ml/metrics — real model metrics for dashboard
router.get('/metrics', (req, res) => {
  const metrics = getMetrics();
  if (!metrics) {
    return res.status(503).json({
      error: 'Model not trained yet',
      hint:  'Run: node ml/train.js from the server directory'
    });
  }
  res.json(metrics);
});

// GET /api/ml/status
router.get('/status', (req, res) => {
  res.json({ loaded: isLoaded(), status: isLoaded() ? 'active' : 'not_trained' });
});

// POST /api/ml/predict — score a single transaction
router.post('/predict', (req, res) => {
  if (!isLoaded()) return res.status(503).json({ error: 'Model not loaded' });
  const result = predict(req.body);
  if (!result) return res.status(400).json({ error: 'Prediction failed' });
  res.json(result);
});

// POST /api/ml/batch-predict — score multiple transactions
router.post('/batch-predict', (req, res) => {
  if (!isLoaded()) return res.status(503).json({ error: 'Model not loaded' });
  const { transactions = [] } = req.body;
  const results = transactions.map(tx => ({
    _id:    tx._id,
    ...predict(tx)
  })).filter(r => r.isFraud !== undefined);
  res.json({ results });
});

module.exports = router;
