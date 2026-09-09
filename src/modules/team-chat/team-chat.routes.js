const express = require('express');
const router = express.Router();
const controller = require('./team-chat.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/messages', controller.getMessages);
router.post('/messages', controller.sendMessage);
router.delete('/messages/:id', controller.deleteMessage);
router.get('/channels', controller.getChannels);
router.get('/members', controller.getOnlineMembers);

module.exports = router;
