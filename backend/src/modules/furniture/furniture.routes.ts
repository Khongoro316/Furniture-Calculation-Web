import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.get('/', async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.getFurnitureTypes(req, res);
});

router.get('/:id/fields', async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.getInputFields(req, res);
});

router.get('/:id/formulas', async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.getFormulas(req, res);
});

router.post('/', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.createFurnitureType(req, res);
});

router.post('/:id/fields', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.createInputField(req, res);
});

router.post('/:id/formulas', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.createFormula(req, res);
});

router.put('/:id', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.updateFurnitureType(req, res);
});

router.delete('/:id', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.deleteFurnitureType(req, res);
});

router.delete('/:id/fields/:fieldId', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.deleteField(req, res);
});

router.delete('/:id/formulas/:formulaId', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./furniture.controller');
  return ctrl.deleteFormula(req, res);
});

export default router;
