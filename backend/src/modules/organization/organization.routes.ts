import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.get('/', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./organization.controller');
  return ctrl.getAll(req, res);
});

router.post('/', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./organization.controller');
  return ctrl.create(req, res);
});

router.put('/:id', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./organization.controller');
  return ctrl.update(req, res);
});

export default router;