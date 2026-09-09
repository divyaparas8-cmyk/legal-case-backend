const express = require('express');
const router = express.Router();
const controller = require('./relationships.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

// Routes for matter-specific relationships
router.get('/matters/:matterId/relationships', controller.getMatterRelationships);
router.post('/matters/:matterId/relationships', controller.createRelationship);

// Routes for individual relationship actions
router.put('/relationships/:id', controller.updateRelationship);
router.delete('/relationships/:id', controller.deleteRelationship);

module.exports = router;
