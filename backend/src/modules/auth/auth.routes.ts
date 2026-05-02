import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.post('/register', async (req, res) => {
  const controller = require('./auth.controller');
  return controller.register(req, res);
});

router.post('/login', async (req, res) => {
  const controller = require('./auth.controller');
  return controller.login(req, res);
});

router.get('/workers', authenticate, rbac(['order_processor', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.getWorkers(req, res);
});
router.post('/forgot-password', async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.forgotPassword(req, res);
});

router.post('/reset-password', async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.resetPassword(req, res);
});
export default router;