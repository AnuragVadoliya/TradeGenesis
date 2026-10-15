const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generateStrategy, chat } = require('../controllers/aiController');

router.use(authenticate);
router.post('/generate-strategy', generateStrategy);
router.post('/chat', chat);

module.exports = router;
