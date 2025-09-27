const express = require('express');
const router = express.Router();
const controller = require('../controllers/containersController');

router.post('/fetch', controller.fetchAndStore);
router.get('/points', controller.getPoints);
router.get('/:cntrNo/summary', controller.summary);

module.exports = router;
