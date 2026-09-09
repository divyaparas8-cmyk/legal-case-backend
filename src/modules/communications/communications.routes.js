const express = require('express');
const router = express.Router();
const controller = require('./communications.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

// Routes for general & matter-specific communications
router.get('/communications', controller.getAllCommunications);
router.post('/communications', controller.createCommunication);
router.get('/matters/:matterId/communications', controller.getMatterCommunications);
router.post('/matters/:matterId/communications', controller.createCommunication);

// Mark read routes
router.patch('/communications/matter/:matterId/read', controller.markMatterRead);
router.post('/communications/matter/:matterId/read', controller.markMatterRead);
router.patch('/matters/:matterId/communications/read', controller.markMatterRead);
router.patch('/communications/:id/read', controller.markRead);

// Routes for individual communication record actions
router.put('/communications/:id', controller.updateCommunication);
router.delete('/communications/:id', controller.deleteCommunication);

module.exports = router;