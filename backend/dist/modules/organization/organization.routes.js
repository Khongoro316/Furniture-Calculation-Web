"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'organizations');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `org-${unique}${path_1.default.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (/jpeg|jpg|png|webp/.test(path_1.default.extname(file.originalname).toLowerCase()))
            cb(null, true);
        else
            cb(new Error('Зөвхөн зураг файл хүлээж авна'));
    },
});
// ── PUBLIC (нэвтрэлтгүй) ─────────────────────────────────────────────────────
router.get('/public', async (req, res) => {
    const ctrl = require('./organization.controller');
    return ctrl.getPublicOrgs(req, res);
});
router.get('/public/:id/materials', async (req, res) => {
    const ctrl = require('./organization.controller');
    return ctrl.getOrgMaterials(req, res);
});
// ── PROTECTED ─────────────────────────────────────────────────────────────────
router.get('/', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./organization.controller');
    return ctrl.getAll(req, res);
});
router.post('/', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), (req, res, next) => { upload.single('image')(req, res, (err) => { if (err)
    return res.status(400).json({ message: err.message }); next(); }); }, async (req, res) => { const ctrl = require('./organization.controller'); return ctrl.create(req, res); });
router.put('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), (req, res, next) => { upload.single('image')(req, res, (err) => { if (err)
    return res.status(400).json({ message: err.message }); next(); }); }, async (req, res) => { const ctrl = require('./organization.controller'); return ctrl.update(req, res); });
router.get('/stats', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./organization.controller');
    return ctrl.getStats(req, res);
});
router.get('/stats', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./organization.controller');
    return ctrl.getStats(req, res);
});
router.get('/:id/users', auth_1.authenticate, (0, rbac_1.rbac)(['super_admin']), async (req, res) => {
    const ctrl = require('./organization.controller');
    return ctrl.getOrgUsers(req, res);
});
router.get('/:id', auth_1.authenticate, (0, rbac_1.rbac)(['admin', 'super_admin']), async (req, res) => {
    try {
        const db = (await Promise.resolve().then(() => __importStar(require('../../prisma')))).default;
        const org = await db.organizations.findUnique({
            where: { id: Number(req.params.id) },
        });
        if (!org)
            return res.status(404).json({ message: 'Олдсонгүй' });
        res.json(org);
    }
    catch {
        res.status(500).json({ message: 'Алдаа гарлаа' });
    }
});
exports.default = router;
