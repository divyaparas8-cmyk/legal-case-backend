const aiService = require('./ai.service');
const { sendResponse } = require('../../utils/response');

const chat = async (req, res, next) => {
  try {
    const { messages, matterId, workflowMode } = req.body;
    const result = await aiService.chat({
      messages,
      matterId,
      workflowMode,
      user: req.user
    });
    res.status(200).json(sendResponse(true, 'AI response generated successfully', result));
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await aiService.checkStatus();
    res.status(200).json(sendResponse(true, 'AI status retrieved', status));
  } catch (err) {
    next(err);
  }
};

const getMatterContext = async (req, res, next) => {
  try {
    const context = await aiService.buildMatterDossier(req.params.matterId);
    res.status(200).json(sendResponse(true, 'Matter dossier generated', { context }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat,
  getStatus,
  getMatterContext
};
