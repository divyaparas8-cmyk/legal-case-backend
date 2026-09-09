const chatService = require('./team-chat.service');

const getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.query);
    res.json({ success: true, data: messages });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const msg = await chatService.sendMessage(req.body, req.user);
    res.status(201).json({ success: true, data: msg });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const result = await chatService.deleteMessage(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

const getChannels = async (req, res) => {
  try {
    const channels = await chatService.getChannels();
    res.json({ success: true, data: channels });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

const getOnlineMembers = async (req, res) => {
  try {
    const members = await chatService.getOnlineMembers(req.user);
    res.json({ success: true, data: members });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, message: e.message });
  }
};

module.exports = { getMessages, sendMessage, deleteMessage, getChannels, getOnlineMembers };
