const service = require('./relationships.service');

const sendResponse = (success, message, data = null) => ({
  success,
  message,
  data
});

const getMatterRelationships = async (req, res, next) => {
  try {
    const data = await service.getMatterRelationships(req.params.matterId, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matter relationships fetched successfully', data));
  } catch (err) { next(err); }
};

const createRelationship = async (req, res, next) => {
  try {
    const data = await service.createRelationship(req.params.matterId, req.body, req.user);
    res.status(201).json(sendResponse(true, 'Relationship created successfully', data));
  } catch (err) { next(err); }
};

const updateRelationship = async (req, res, next) => {
  try {
    const data = await service.updateRelationship(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Relationship updated successfully', data));
  } catch (err) { next(err); }
};

const deleteRelationship = async (req, res, next) => {
  try {
    const data = await service.deleteRelationship(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Relationship deleted successfully', data));
  } catch (err) { next(err); }
};

module.exports = {
  getMatterRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship
};
