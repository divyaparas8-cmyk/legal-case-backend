const express = require('express');
const router = express.Router();
const controller = require('./settlement.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

// Routes for matter-specific settlements
router.get('/matters/:matterId/settlement', controller.getSettlement);
router.post('/matters/:matterId/settlement', controller.createSettlement);

// Routes for individual settlement record actions
router.put('/settlement/:id', controller.updateSettlement);
router.delete('/settlement/:id', controller.deleteSettlement);

module.exports = router;
