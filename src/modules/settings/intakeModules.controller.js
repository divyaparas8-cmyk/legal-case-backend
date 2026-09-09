const service = require('./intakeModules.service');
const { sendResponse } = require('../../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    res.json(sendResponse(true, 'Intake modules fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

exports.getEnabled = async (req, res, next) => {
  try {
    const data = await service.getEnabled();
    res.json(sendResponse(true, 'Enabled intake modules fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await service.createModule(req.body);
    res.status(201).json(sendResponse(true, 'Intake module created successfully', data));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await service.updateModule(req.params.id, req.body);
    res.json(sendResponse(true, 'Intake module updated successfully', data));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const data = await service.deleteModule(req.params.id);
    res.json(sendResponse(true, 'Intake module deleted successfully', data));
  } catch (err) {
    next(err);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    const data = await service.reorderModules(req.body.modules);
    res.json(sendResponse(true, 'Intake modules reordered successfully', data));
  } catch (err) {
    next(err);
  }
};
