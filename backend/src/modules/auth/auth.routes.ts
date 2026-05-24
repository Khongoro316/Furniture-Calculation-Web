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

router.post('/forgot-password', async (req, res) => {
  const controller = require('./auth.controller');
  return controller.forgotPassword(req, res);
});

router.post('/reset-password', async (req, res) => {
  const controller = require('./auth.controller');
  return controller.resetPassword(req, res);
});

router.get('/workers', authenticate, rbac(['admin', 'super_admin', 'order_processor']), async (req, res) => {
  const controller = require('./auth.controller');
  return controller.getWorkers(req, res);
});

router.get('/users', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const controller = require('./auth.controller');
  return controller.getUsers(req, res);
});

router.post('/create-worker', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const controller = require('./auth.controller');
  return controller.createWorker(req, res);
});

router.put('/users/:id/role', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const controller = require('./auth.controller');
  return controller.updateUserRole(req, res);
});

router.put('/users/:id', authenticate, async (req, res) => {
  const controller = require('./auth.controller');
  return controller.updateUser(req, res);
});
export default router;
