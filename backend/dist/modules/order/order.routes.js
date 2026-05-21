"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, rbac_1.rbac)(['order_processor', 'admin', 'super_admin', 'worker']), async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.getOrders(req, res);
});
router.get('/my', auth_1.authenticate, async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.getMyOrders(req, res);
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.getOrderById(req, res);
});
router.post('/', auth_1.authenticate, (0, rbac_1.rbac)(['customer', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.createOrder(req, res);
});
router.put('/:id/assign', auth_1.authenticate, (0, rbac_1.rbac)(['order_processor', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.assignOrder(req, res);
});
router.put('/:id/status', auth_1.authenticate, (0, rbac_1.rbac)(['worker', 'order_processor', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.updateStatus(req, res);
});
router.post('/:id/payment', auth_1.authenticate, (0, rbac_1.rbac)(['customer', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./order.controller');
    return ctrl.addPayment(req, res);
});
exports.default = router;
