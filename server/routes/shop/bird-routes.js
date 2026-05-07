const express = require('express');
const {
  registerBird,
  getBirdDetails,
  getMemberBirds,
} = require('../../controllers/shop/bird-controller');

const router = express.Router();

router.post('/register', registerBird);
router.get('/:id', getBirdDetails);
router.get('/member/:memberId', getMemberBirds);

module.exports = router;
