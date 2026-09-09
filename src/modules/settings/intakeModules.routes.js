const express = require('express');
const router = express.Router();
const controller = require('./intakeModules.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');

router.use(protect);
router.get('/enabled', controller.getEnabled);
router.get('/', controller.getAll);

// Admin only mutation routes
router.use(authorize('admin'));
router.post('/', controller.create);
router.put('/reorder', controller.reorder);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
