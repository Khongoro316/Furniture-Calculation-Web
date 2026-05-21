"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
router.get('/furniture/:id/fields', async (req, res) => {
    const ctrl = require('./calculation.controller');
    return ctrl.getCalculationForm(req, res);
});
router.post('/', auth_1.authenticate, (0, rbac_1.rbac)(['customer', 'admin', 'super_admin', 'accountant', 'order_processor', 'worker']), async (req, res) => {
    const ctrl = require('./calculation.controller');
    return ctrl.calculate(req, res);
});
router.post('/guest', async (req, res) => {
    const ctrl = require('./calculation.controller');
    return ctrl.calculateGuest(req, res);
});
router.get('/', auth_1.authenticate, async (req, res) => {
    const ctrl = require('./calculation.controller');
    return ctrl.getMyCalculations(req, res);
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const ctrl = require('./calculation.controller');
    return ctrl.getCalculationById(req, res);
});
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    const ctrl = require('./calculation.controller');
    return ctrl.deleteCalculation(req, res);
});
exports.default = router;
