"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
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
router.post('/', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.createFurnitureType(req, res);
});
router.post('/:id/fields', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.createInputField(req, res);
});
router.post('/:id/formulas', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.createFormula(req, res);
});
router.put('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.updateFurnitureType(req, res);
});
router.delete('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.deleteFurnitureType(req, res);
});
router.delete('/:id/fields/:fieldId', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.deleteField(req, res);
});
router.delete('/:id/formulas/:formulaId', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./furniture.controller');
    return ctrl.deleteFormula(req, res);
});
exports.default = router;
