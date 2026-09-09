const service = require('./tasks.service');

const sendResponse = (success, message, data = null) => ({
  success,
  message,
  data
});

const getMatterTasks = async (req, res, next) => {
  try {
    const data = await service.getMatterTasks(req.params.matterId, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matter tasks fetched successfully', data));
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const data = await service.createTask(req.params.matterId, req.body, req.user);
    res.status(201).json(sendResponse(true, 'Task created successfully', data));
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const data = await service.updateTask(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Task updated successfully', data));
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const data = await service.deleteTask(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Task deleted successfully', data));
  } catch (err) { next(err); }
};

const getAllTasks = async (req, res, next) => {
  try {
    const data = await service.getAllTasks(req.query, req.user);
    res.status(200).json(sendResponse(true, 'All tasks fetched successfully', data));
  } catch (err) { next(err); }
};

const completeTask = async (req, res, next) => {
  try {
    const data = await service.completeTask(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Task marked as completed', data));
  } catch (err) { next(err); }
};

module.exports = {
  getMatterTasks,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask
};
