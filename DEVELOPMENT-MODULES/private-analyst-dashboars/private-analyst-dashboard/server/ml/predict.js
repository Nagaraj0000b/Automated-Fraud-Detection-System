const { RandomForestClassifier } = require('ml-random-forest');
const { extractFeatures } = require('./features');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, 'artifacts');
let model = null, scaler = null, metrics = null;

function loadArtifacts() {
  try {
    const modelJSON = JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, 'model.json')));
    scaler  = JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, 'scaler.json')));
    metrics = JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, 'metrics.json')));
    model   = RandomForestClassifier.load(modelJSON);
    console.log('ML model loaded successfully');
    return true;
  } catch (e) {
    console.warn('ML model not found. Run: node ml/train.js');
    return false;
  }
}

function scaleFeatures(features) {
  return features.map((v, i) => (v - scaler.means[i]) / (scaler.stds[i] || 1));
}

function predict(transaction) {
  if (!model) return null;
  try {
    const raw    = extractFeatures(transaction);
    const scaled = [scaleFeatures(raw)];
    const pred   = model.predict(scaled)[0];
    const probas = model.predictProbability(scaled)[0];
    const fraudProb = probas[1] ?? (pred === 1 ? 0.85 : 0.15);
    return {
      isFraud:          pred === 1,
      fraudProbability: parseFloat((fraudProb * 100).toFixed(2)),
      riskScore:        parseFloat((fraudProb * 100).toFixed(2)),
      confidence:       parseFloat((Math.max(...Object.values(probas)) * 100).toFixed(2)),
    };
  } catch (e) {
    console.error('Prediction error:', e.message);
    return null;
  }
}

function getMetrics() { return metrics; }
function isLoaded()   { return model !== null; }

loadArtifacts();
module.exports = { predict, getMetrics, isLoaded, loadArtifacts };
