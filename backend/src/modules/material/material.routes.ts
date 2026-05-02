import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();
router.post('/categories', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createCategory(req, res);
});

router.post('/types', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createType(req, res);
});
router.get('/categories', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.getCategories(req, res);
});

router.get('/types', async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.getTypes(req, res);
});

router.get('/', async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.getMaterials(req, res);
});

router.post('/', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createMaterial(req, res);
});

router.put('/:id', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.updateMaterial(req, res);
});

router.delete('/:id', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.deleteMaterial(req, res);
});

export default router;