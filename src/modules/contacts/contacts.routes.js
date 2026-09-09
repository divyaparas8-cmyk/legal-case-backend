const express = require('express');
const router = express.Router();
const controller = require('./contacts.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', controller.getAll);
router.get('/search', controller.search);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.post('/:id/reveal-sensitive', controller.revealSensitive);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
