const express = require('express');
const { getSettings, updateSettings } = require('../../controllers/admin/settings-controller');

const router = express.Router();

router.get('/', getSettings);
router.post('/update', updateSettings);

module.exports = router;
