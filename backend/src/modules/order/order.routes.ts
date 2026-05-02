import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.get('/', authenticate, rbac(['order_processor', 'admin', 'super_admin', 'worker']), async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.getOrders(req, res);
});

router.get('/my', authenticate, async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.getMyOrders(req, res);
});

router.get('/:id', authenticate, async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.getOrderById(req, res);
});

router.post('/', authenticate, rbac(['customer', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.createOrder(req, res);
});

router.put('/:id/assign', authenticate, rbac(['order_processor', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.assignOrder(req, res);
});

router.put('/:id/status', authenticate, rbac(['worker', 'order_processor', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.updateStatus(req, res);
});

router.post('/:id/payment', authenticate, rbac(['customer', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./order.controller');
  return ctrl.addPayment(req, res);
});

export default router;