import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

router.get('/types', async (req, res) => {
  const controller = require('./service.controller');
  return controller.getServiceTypes(req, res);
});

router.get('/', async (req, res) => {
  const controller = require('./service.controller');
  return controller.getServices(req, res);
});

router.post('/types', authenticate, rbac(['super_admin']), async (req, res) => {
  const controller = require('./service.controller');
  return controller.createServiceType(req, res);
});

router.put('/types/:id', authenticate, rbac(['super_admin']), async (req, res) => {
  const controller = require('./service.controller');
  return controller.updateServiceType(req, res);
});

router.delete('/types/:id', authenticate, rbac(['super_admin']), async (req, res) => {
  const controller = require('./service.controller');
  return controller.deleteServiceType(req, res);
});

router.post('/', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const controller = require('./service.controller');
  return controller.createService(req, res);
});

router.put('/:id', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const controller = require('./service.controller');
  return controller.updateService(req, res);
});

router.delete('/:id', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const controller = require('./service.controller');
  return controller.deleteService(req, res);
});

export default router;
