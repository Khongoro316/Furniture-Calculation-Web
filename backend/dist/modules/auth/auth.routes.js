"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    const controller = require('./auth.controller');
    return controller.register(req, res);
});
router.post('/login', async (req, res) => {
    const controller = require('./auth.controller');
    return controller.login(req, res);
});
router.get('/workers', auth_1.authenticate, (0, rbac_1.rbac)(['order_processor', 'admin', 'super_admin']), async (req, res) => {
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
router.put('/users/:id/role', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./auth.controller');
    return ctrl.updateUserRole(req, res);
});
router.get('/workers', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin', 'order_processor']), async (req, res) => {
    const ctrl = require('./auth.controller');
    return ctrl.getWorkers(req, res);
});
// Ажилтан бүртгэх — admin эрхтэй хүн
router.post('/create-worker', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./auth.controller');
    return ctrl.createWorker(req, res);
});
// Байгууллагын хэрэглэгчид
router.get('/org-users', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./auth.controller');
    return ctrl.getOrgUsers(req, res);
});
// Хэрэглэгчийн эрх өөрчлөх
router.put('/users/:id/role', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./auth.controller');
    return ctrl.updateUserRole(req, res);
});
// Хэрэглэгч идэвхжүүлэх/зогсоох
router.put('/users/:id', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./auth.controller');
    return ctrl.updateUser(req, res);
});
exports.default = router;
