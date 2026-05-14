// backend/src/modules/material/material.routes.ts
// БҮТНИЙГ НЬ СОЛИХ

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer тохиргоо
const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `mat-${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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

router.post('/categories', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createCategory(req, res);
});

router.post('/types', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createType(req, res);
});

router.post('/', authenticate, rbac(['accountant', 'admin', 'super_admin']),
  upload.array('images', 10), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.createMaterial(req, res);
  }
);

router.put('/:id', authenticate, rbac(['accountant', 'admin', 'super_admin']),
  upload.array('images', 10), async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.updateMaterial(req, res);
  }
);

router.delete('/:id/images/:imageId', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.deleteImage(req, res);
});

router.put('/:id/images/:imageId/primary', authenticate, rbac(['accountant', 'admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.setPrimaryImage(req, res);
});

router.delete('/:id', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.deleteMaterial(req, res);
});

export default router;