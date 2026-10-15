const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { runBacktest, getBacktests, getBacktest } = require('../controllers/backtestController');

router.use(authenticate);
router.post('/run', runBacktest);
router.get('/', getBacktests);
router.get('/:id', getBacktest);

module.exports = router;
