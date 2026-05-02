import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import prisma from '../../prisma';

const router = Router();

router.get('/types', async (req, res) => {
  const ctrl = require('./service.controller');
  return ctrl.getServiceTypes(req, res);
});

router.get('/', async (req, res) => {
  const ctrl = require('./service.controller');
  return ctrl.getServices(req, res);
});

router.post('/types', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./service.controller');
  return ctrl.createServiceType(req, res);
});

router.post('/', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./service.controller');
  return ctrl.createService(req, res);
});

router.put('/:id', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./service.controller');
  return ctrl.updateService(req, res);
});
router.post('/types', authenticate, rbac(['super_admin']), async (req, res) => {
  const { name, description } = req.body;
  const type = await prisma.service_types.create({ data: { name, description, created_by: 1 } });
  res.status(201).json(type);
});
export default router;