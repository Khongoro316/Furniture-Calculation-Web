"use strict";
// backend/src/modules/material/material.routes.ts
// БҮТНИЙГ НЬ СОЛИХ
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Multer тохиргоо
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'materials');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `mat-${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname)}`),
});
const upload = (0, multer_1.default)({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
// ── PUBLIC routes (нэвтрэлтгүй хэрэглэгч харж болно) ──────────────────────
// Ангилалуудыг public-аар татах
router.get('/categories', async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.getCategories(req, res);
});
router.get('/types', async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.getTypes(req, res);
});
// Материалын жагсаалт
router.get('/', async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.getMaterials(req, res);
});
// ⚠️ ЧУХАЛ: GET /:id нь router.get('/') -аас ДООР байх ёстой
// Тодорхой материалыг ID-аар татах — public
router.get('/:id', async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.getMaterialById(req, res);
});
// ── AUTH шаардах routes ────────────────────────────────────────────────────
router.post('/categories', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.createCategory(req, res);
});
router.post('/types', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.createType(req, res);
});
router.post('/', auth_1.authenticate, (0, rbac_1.rbac)(['accountant', 'admin', 'super_admin']), upload.array('images', 10), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.createMaterial(req, res);
});
router.put('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['accountant', 'admin', 'super_admin']), upload.array('images', 10), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.updateMaterial(req, res);
});
router.delete('/:id/images/:imageId', auth_1.authenticate, (0, rbac_1.rbac)(['accountant', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.deleteImage(req, res);
});
router.put('/:id/images/:imageId/primary', auth_1.authenticate, (0, rbac_1.rbac)(['accountant', 'admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.setPrimaryImage(req, res);
});
router.delete('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.deleteMaterial(req, res);
});
exports.default = router;
