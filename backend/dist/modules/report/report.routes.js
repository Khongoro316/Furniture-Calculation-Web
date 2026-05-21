"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
const adminRoles = ['admin', 'super_admin', 'accountant', 'order_processor'];
router.get('/orders', auth_1.authenticate, (0, rbac_1.rbac)(adminRoles), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.ordersReport(req, res);
});
router.get('/finance', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin', 'accountant']), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.financeReport(req, res);
});
router.get('/materials', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin', 'accountant']), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.materialsReport(req, res);
});
router.get('/calculations', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.calculationsReport(req, res);
});
router.get('/workers', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin', 'order_processor']), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.workersReport(req, res);
});
router.get('/export/excel', auth_1.authenticate, (0, rbac_1.rbac)(adminRoles), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.exportExcel(req, res);
});
router.get('/audit-logs', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./report.controller');
    return ctrl.getAuditLogs(req, res);
});
exports.default = router;
