import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';

const router = Router();

const adminRoles = ['admin', 'super_admin', 'accountant', 'order_processor'];

router.get('/orders', authenticate, rbac(adminRoles), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.ordersReport(req, res);
});

router.get('/finance', authenticate, rbac(['admin', 'super_admin', 'accountant']), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.financeReport(req, res);
});

router.get('/materials', authenticate, rbac(['admin', 'super_admin', 'accountant']), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.materialsReport(req, res);
});

router.get('/calculations', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.calculationsReport(req, res);
});

router.get('/workers', authenticate, rbac(['admin', 'super_admin', 'order_processor']), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.workersReport(req, res);
});

router.get('/export/excel', authenticate, rbac(adminRoles), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.exportExcel(req, res);
});
router.get('/audit-logs', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./report.controller');
  return ctrl.getAuditLogs(req, res);
});
export default router;