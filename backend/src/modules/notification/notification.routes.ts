import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const ctrl = require('./notification.controller');
  return ctrl.getMyNotifications(req, res);
});

router.put('/read-all', authenticate, async (req, res) => {
  const ctrl = require('./notification.controller');
  return ctrl.readAllNotifications(req, res);
});

router.put('/:id/read', authenticate, async (req, res) => {
  const ctrl = require('./notification.controller');
  return ctrl.readNotification(req, res);
});

export default router;
