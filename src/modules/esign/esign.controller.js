const service = require('./esign.service');

exports.createRequest = async (req, res) => {
  try {
    const result = await service.createRequest(req.body, req.user);
    res.status(201).json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const data = await service.getRequests(req.query);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const data = await service.getRequestById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Request not found' });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.signNative = async (req, res) => {
  try {
    const { signature_data_url } = req.body;
    const data = await service.signNative(req.params.id, signature_data_url);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const data = await service.handleWebhook(req.body, req.params.provider);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
