import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import express from 'express';
import path from 'path';

const router = Router();

// ── СТАТИК ЗУРАГНЫ ЗАМ ───────────────────────────────────────────────────────
// index.ts дотор нэмнэ: app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── АНГИЛАЛ ──────────────────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.getCategories(req, res);
});

router.post('/categories', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createCategory(req, res);
});

// ── ТӨРӨЛ ─────────────────────────────────────────────────────────────────────
router.get('/types', async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.getTypes(req, res);
});

router.post('/types', authenticate, rbac(['super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.createType(req, res);
});

// ── МАТЕРИАЛ ──────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.getMaterials(req, res);
});

// Зураг upload дэмжсэн POST
router.post(
  '/',
  authenticate,
  rbac(['accountant', 'admin', 'super_admin']),
  (req, res, next) => {
    const ctrl = require('./material.controller');
    ctrl.upload.array('images', 10)(req, res, (err: any) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.createMaterial(req, res);
  }
);

// Зураг upload дэмжсэн PUT
router.put(
  '/:id',
  authenticate,
  rbac(['accountant', 'admin', 'super_admin']),
  (req, res, next) => {
    const ctrl = require('./material.controller');
    ctrl.upload.array('images', 10)(req, res, (err: any) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },
  async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.updateMaterial(req, res);
  }
);

router.delete('/:id', authenticate, rbac(['admin', 'super_admin']), async (req, res) => {
  const ctrl = require('./material.controller');
  return ctrl.deleteMaterial(req, res);
});

// ── ЗУРАГ ENDPOINT-УУД ───────────────────────────────────────────────────────
router.delete(
  '/images/:imageId',
  authenticate,
  rbac(['accountant', 'admin', 'super_admin']),
  async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.deleteImage(req, res);
  }
);

router.patch(
  '/:materialId/images/:imageId/primary',
  authenticate,
  rbac(['accountant', 'admin', 'super_admin']),
  async (req, res) => {
    const ctrl = require('./material.controller');
    return ctrl.setPrimaryImage(req, res);
  }
);

export default router;