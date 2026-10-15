const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { buyStock, sellStock, getPortfolio, getTradeHistory } = require('../controllers/paperController');

router.use(authenticate);
router.post('/buy', buyStock);
router.post('/sell', sellStock);
router.get('/portfolio', getPortfolio);
router.get('/history', getTradeHistory);

module.exports = router;
