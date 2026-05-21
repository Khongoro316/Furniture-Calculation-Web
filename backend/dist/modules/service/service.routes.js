"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const prisma_1 = __importDefault(require("../../prisma"));
const router = (0, express_1.Router)();
router.get('/types', async (req, res) => {
    const ctrl = require('./service.controller');
    return ctrl.getServiceTypes(req, res);
});
router.get('/', async (req, res) => {
    const ctrl = require('./service.controller');
    return ctrl.getServices(req, res);
});
router.post('/types', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./service.controller');
    return ctrl.createServiceType(req, res);
});
router.post('/', auth_1.authenticate, (0, rbac_1.rbac)(['accountant', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./service.controller');
    return ctrl.createService(req, res);
});
router.put('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['accountant', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./service.controller');
    return ctrl.updateService(req, res);
});
router.post('/types', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const { name, description } = req.body;
    const type = await prisma_1.default.service_types.create({ data: { name, description, created_by: 1 } });
    res.status(201).json(type);
});
exports.default = router;
