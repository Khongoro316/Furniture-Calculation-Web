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

router.put('/users/:id/role', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.updateUserRole(req, res);
});
 
router.get('/workers', authenticate, rbac(['admin', 'super_admin', 'order_processor']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.getWorkers(req, res);
});

// Ажилтан бүртгэх — admin эрхтэй хүн
router.post('/create-worker', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.createWorker(req, res);
});
 
// Байгууллагын хэрэглэгчид
router.get('/org-users', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.getOrgUsers(req, res);
});
 
// Хэрэглэгчийн эрх өөрчлөх
router.put('/users/:id/role', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.updateUserRole(req, res);
});
 
// Хэрэглэгч идэвхжүүлэх/зогсоох
router.put('/users/:id', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./auth.controller');
  return ctrl.updateUser(req, res);
});
export default router;