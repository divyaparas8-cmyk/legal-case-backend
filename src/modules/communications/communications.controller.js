const service = require('./communications.service');

const sendResponse = (success, message, data = null) => ({
  success,
  message,
  data
});

const getMatterCommunications = async (req, res, next) => {
  try {
    const data = await service.getMatterCommunications(req.params.matterId, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matter communications fetched successfully', data));
  } catch (err) { next(err); }
};

const getAllCommunications = async (req, res, next) => {
  try {
    const data = await service.getAllCommunications(req.query, req.user);
    res.status(200).json(sendResponse(true, 'All communications fetched successfully', data));
  } catch (err) { next(err); }
};

const createCommunication = async (req, res, next) => {
  try {
    const matterId = req.params.matterId || req.body?.matter_id || req.body?.matterId;
    const data = await service.createCommunication(matterId, req.body, req.user);
    res.status(201).json(sendResponse(true, 'Communication logged successfully', data));
  } catch (err) { next(err); }
};

const updateCommunication = async (req, res, next) => {
  try {
    const data = await service.updateCommunication(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Communication updated successfully', data));
  } catch (err) { next(err); }
};

const deleteCommunication = async (req, res, next) => {
  try {
    const data = await service.deleteCommunication(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Communication deleted successfully', data));
  } catch (err) { next(err); }
};

const markMatterRead = async (req, res, next) => {
  try {
    const matterId = parseInt(req.params.matterId, 10);
    const data = await service.markMatterRead(matterId, req.user);
    res.status(200).json(sendResponse(true, 'Matter communications marked as read', data));
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const commId = parseInt(req.params.id, 10);
    const data = await service.markRead(commId, req.user);
    res.status(200).json(sendResponse(true, 'Communication marked as read', data));
  } catch (err) { next(err); }
};

module.exports = {
  getMatterCommunications,
  getAllCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  markMatterRead,
  markRead
};