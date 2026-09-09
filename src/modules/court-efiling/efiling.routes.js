const express = require('express');
const router = express.Router();
const controller = require('./efiling.controller');

router.post('/submit', controller.submitFiling);
router.get('/submissions', controller.getSubmissions);
router.get('/submissions/:id', controller.getSubmissionById);

module.exports = router;
