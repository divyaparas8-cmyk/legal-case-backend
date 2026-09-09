const service = require('./contacts.service');

const sendResponse = (success, message, data = null) => ({
  success,
  message,
  data
});

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query, req.user);
    res.status(200).json(sendResponse(true, 'Contacts fetched successfully', data));
  } catch (err) { next(err); }
};

const search = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const data = await service.search(q, req.user);
    res.status(200).json(sendResponse(true, 'Contact search completed', data));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user);
    if (!data) {
      return res.status(404).json(sendResponse(false, 'Contact not found'));
    }
    res.status(200).json(sendResponse(true, 'Contact details fetched', data));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user);
    if (data && data.duplicate) {
      return res.status(409).json({
        duplicate: true,
        message: data.message,
        contact: data.contact,
        matchedField: data.matchedField
      });
    }
    res.status(201).json(sendResponse(true, 'Contact created successfully', data));
  } catch (err) { next(err); }
};



const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Contact updated successfully', data));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const data = await service.remove(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Contact deleted successfully', data));
  } catch (err) { next(err); }
};

const revealSensitive = async (req, res, next) => {
  try {
    const data = await service.revealSensitiveField(req.params.id, req.body?.field || 'government_id', req.user);
    res.status(200).json(sendResponse(true, 'Sensitive field revealed & audit logged', data));
  } catch (err) { next(err); }
};

module.exports = {
  getAll,
  search,
  getById,
  create,
  update,
  remove,
  revealSensitive
};
