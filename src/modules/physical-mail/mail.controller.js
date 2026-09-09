const service = require('./mail.service');

exports.sendMail = async (req, res) => {
  try {
    const result = await service.sendMail(req.body, req.user);
    res.status(201).json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getDispatches = async (req, res) => {
  try {
    const data = await service.getDispatches(req.query);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getDispatchById = async (req, res) => {
  try {
    const data = await service.getDispatchById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Dispatch record not found' });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
