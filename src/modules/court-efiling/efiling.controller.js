const service = require('./efiling.service');

exports.submitFiling = async (req, res) => {
  try {
    const result = await service.submitFiling(req.body, req.user);
    res.status(201).json({ data: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const data = await service.getSubmissions(req.query);
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const data = await service.getSubmissionById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Filing submission not found' });
    res.json({ data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
