import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.get('/furniture/:id/fields', async (req, res) => {
  const ctrl = require('./calculation.controller');
  return ctrl.getCalculationForm(req, res);
});

router.post('/', authenticate, rbac(['customer', 'admin', 'super_admin', 'accountant', 'order_processor', 'worker']), async (req, res) => {
  const ctrl = require('./calculation.controller');
  return ctrl.calculate(req, res);
});

router.post('/guest', async (req, res) => {
  const ctrl = require('./calculation.controller');
  return ctrl.calculateGuest(req, res);
});

router.get('/', authenticate, async (req, res) => {
  const ctrl = require('./calculation.controller');
  return ctrl.getMyCalculations(req, res);
});

router.get('/:id', authenticate, async (req, res) => {
  const ctrl = require('./calculation.controller');
  return ctrl.getCalculationById(req, res);
});

router.delete('/:id', authenticate, async (req, res) => {
  const ctrl = require('./calculation.controller');
  return ctrl.deleteCalculation(req, res);
});

export default router;