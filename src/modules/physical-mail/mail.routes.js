const express = require('express');
const router = express.Router();
const controller = require('./mail.controller');

router.post('/send', controller.sendMail);
router.get('/dispatches', controller.getDispatches);
router.get('/dispatches/:id', controller.getDispatchById);

module.exports = router;
