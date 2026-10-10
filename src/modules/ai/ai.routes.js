const express = require('express');
const router = express.Router();
const controller = require('./ai.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/status', controller.getStatus);
router.post('/chat', controller.chat);
router.get('/context/:matterId', controller.getMatterContext);

module.exports = router;
