const express = require('express');
const router = express.Router();
const controller = require('./tasks.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

// Routes for tasks
router.get('/tasks', controller.getAllTasks);
router.post('/tasks', controller.createTask);

// Routes for matter-specific tasks
router.get('/matters/:matterId/tasks', controller.getMatterTasks);
router.post('/matters/:matterId/tasks', controller.createTask);

// Routes for individual task actions
router.put('/tasks/:id', controller.updateTask);
router.put('/tasks/:id/complete', controller.completeTask);
router.post('/tasks/:id/complete', controller.completeTask);
router.delete('/tasks/:id', controller.deleteTask);

module.exports = router;
