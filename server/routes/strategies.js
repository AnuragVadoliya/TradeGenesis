const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createStrategy, getStrategies, getStrategy, updateStrategy, deleteStrategy
} = require('../controllers/strategyController');

router.use(authenticate);
router.post('/', createStrategy);
router.get('/', getStrategies);
router.get('/:id', getStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);

module.exports = router;
