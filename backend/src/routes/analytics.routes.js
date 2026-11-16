const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');

router.use(authenticate, authorize('ADMIN'));

router.get('/overview', analyticsController.getOverview);
router.get('/monthly-revenue', analyticsController.getMonthlyRevenue);
router.get('/stage-distribution', analyticsController.getStageDistribution);
router.get('/conversion-funnel', analyticsController.getConversionFunnel);
router.get('/bottlenecks', analyticsController.getBottlenecks);

module.exports = router;
