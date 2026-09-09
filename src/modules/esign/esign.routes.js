const express = require('express');
const router = express.Router();
const controller = require('./esign.controller');

router.post('/requests', controller.createRequest);
router.get('/requests', controller.getRequests);
router.get('/requests/:id', controller.getRequestById);
router.post('/requests/:id/sign', controller.signNative);
router.post('/webhook', controller.handleWebhook);
router.post('/webhook/:provider', controller.handleWebhook);

module.exports = router;
