const service = require('./settlement.service');

const sendResponse = (success, message, data = null) => ({
  success,
  message,
  data
});

const getSettlement = async (req, res, next) => {
  try {
    const data = await service.getSettlement(req.params.matterId, req.user);
    res.status(200).json(sendResponse(true, 'Settlement details fetched successfully', data));
  } catch (err) { next(err); }
};

const createSettlement = async (req, res, next) => {
  try {
    const data = await service.createSettlement(req.params.matterId, req.body, req.user);
    res.status(201).json(sendResponse(true, 'Settlement offer recorded successfully', data));
  } catch (err) { next(err); }
};

const updateSettlement = async (req, res, next) => {
  try {
    const data = await service.updateSettlement(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Settlement offer updated successfully', data));
  } catch (err) { next(err); }
};

const deleteSettlement = async (req, res, next) => {
  try {
    const data = await service.deleteSettlement(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Settlement offer deleted successfully', data));
  } catch (err) { next(err); }
};

module.exports = {
  getSettlement,
  createSettlement,
  updateSettlement,
  deleteSettlement
};
