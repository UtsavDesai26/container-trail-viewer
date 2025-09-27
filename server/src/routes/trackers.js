const express = require('express');
const router = express.Router();
const controller = require('../controllers/trackersController');

router.post('/', controller.addTracker);
router.get('/', controller.listTrackers);
router.delete('/:cntrNo', controller.removeTracker);

module.exports = router;
