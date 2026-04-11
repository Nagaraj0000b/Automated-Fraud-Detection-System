const { store } = require('../services/demoStore');

const getModel = (modelId) => store.models.find((model) => model.id === modelId);

exports.getModels = async (req, res) => {
  return res.status(200).json({
    success: true,
    models: store.models,
  });
};

exports.trainModel = async (req, res) => {
  const model = getModel(req.params.id);

  if (!model) {
    return res.status(404).json({ success: false, message: 'Model not found' });
  }

  if (model.status === 'training') {
    return res.status(400).json({ success: false, message: 'Model is already training' });
  }

  model.status = 'training';
  model.progress = 8;

  const interval = setInterval(() => {
    if (model.status !== 'training') {
      clearInterval(interval);
      return;
    }

    model.progress = Math.min(model.progress + 18, 100);

    if (model.progress >= 100) {
      model.status = 'active';
      model.progress = 100;
      model.lastTrainedAt = new Date().toISOString();
      model.accuracy = Number(Math.min(model.accuracy + 0.2, 99.4).toFixed(1));
      clearInterval(interval);
    }
  }, 1500);

  return res.status(200).json({
    success: true,
    model,
    message: 'Model training started',
  });
};

exports.stopModel = async (req, res) => {
  const model = getModel(req.params.id);

  if (!model) {
    return res.status(404).json({ success: false, message: 'Model not found' });
  }

  model.status = 'stopped';
  model.progress = 0;

  return res.status(200).json({
    success: true,
    model,
    message: 'Model stopped successfully',
  });
};
