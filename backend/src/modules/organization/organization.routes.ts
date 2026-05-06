import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads', 'organizations');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `org-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Зөвхөн зураг файл хүлээж авна'));
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
router.get('/', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./organization.controller');
  return ctrl.getAll(req, res);
});

router.post('/', authenticate, rbac(['super_admin']),
  (req, res, next) => { upload.single('image')(req, res, (err: any) => { if (err) return res.status(400).json({ message: err.message }); next(); }); },
  async (req, res) => { const ctrl = require('./organization.controller'); return ctrl.create(req, res); }
);

router.put('/:id', authenticate, rbac(['super_admin']),
  (req, res, next) => { upload.single('image')(req, res, (err: any) => { if (err) return res.status(400).json({ message: err.message }); next(); }); },
  async (req, res) => { const ctrl = require('./organization.controller'); return ctrl.update(req, res); }
);

router.get('/stats', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./organization.controller');
  return ctrl.getStats(req, res);
});




router.get('/stats', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./organization.controller');
  return ctrl.getStats(req, res);
});
export default router;