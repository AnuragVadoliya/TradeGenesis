const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getPortfolio, getTradeHistory } = require('../controllers/paperController');

router.use(authenticate);
router.get('/', getPortfolio);
router.get('/history', getTradeHistory);

module.exports = router;
