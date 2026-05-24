// backend/src/modules/material/material.controller.ts
// БҮТЭН ФАЙЛЫГ СОЛИХ

import { Request, Response } from 'express';
import prismaClient from '../../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = prismaClient as any;

// ── Multer ───────────────────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `mat-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

// ── Categories ───────────────────────────────────────────────────────────────
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.material_categories.findMany({
      where: { is_active: true },
      include: { material_types: { where: { is_active: true } } },
    });
    res.json(categories);
  } catch (err) {
    console.error('getCategories алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.material_categories.create({
      data: { name, description },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error('createCategory:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Types ────────────────────────────────────────────────────────────────────
export const getTypes = async (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    const types = await prisma.material_types.findMany({
      where: {
        is_active: true,
        ...(category_id && { category_id: Number(category_id) }),
      },
    });
    res.json(types);
  } catch (err) {
    console.error('getTypes:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createType = async (req: Request, res: Response) => {
  try {
    const { category_id, name, description } = req.body;
    const type = await prisma.material_types.create({
      data: { category_id: Number(category_id), name, description },
    });
    res.status(201).json(type);
  } catch (err) {
    console.error('createType:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Materials ─────────────────────────────────────────────────────────────────
export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { type_id } = req.query;

    const includeImages = await prisma.material_images
      .findFirst()
      .then(() => true)
      .catch(() => false);

    const materials = await prisma.materials.findMany({
      where: {
        is_active: true,
        ...(type_id && { type_id: Number(type_id) }),
      },
      include: {
        material_types: { include: { material_categories: true } },
        ...(includeImages ? { material_images: { orderBy: { sort_order: 'asc' } } } : {}),
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(materials);
  } catch (err) {
    console.error('getMaterials алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const includeImages = await prisma.material_images
      .findFirst()
      .then(() => true)
      .catch(() => false);

    const material = await prisma.materials.findUnique({
      where: { id: Number(id) },
      include: {
        material_types: { include: { material_categories: true } },
        ...(includeImages ? { material_images: { orderBy: { sort_order: 'asc' } } } : {}),
      },
    });

    if (!material) return res.status(404).json({ message: 'Материал олдсонгүй' });

    res.json(material);
  } catch (err) {
    console.error('getMaterialById алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    console.log('📥 createMaterial body:', req.body);
    const { type_id, code, name, unit, thickness, sheet_length, sheet_width, price, stock } = req.body;

    const existing = await prisma.materials.findFirst({
      where: { code },
    });
    if (existing) return res.status(400).json({ message: 'Энэ код бүртгэлтэй байна' });

    const material = await prisma.materials.create({
      data: {
        type_id: Number(type_id),
        code, name, unit,
        thickness: thickness ? Number(thickness) : null,
        sheet_length: sheet_length ? Number(sheet_length) : null,
        sheet_width: sheet_width ? Number(sheet_width) : null,
        price: Number(price || 0),
        stock: Number(stock || 0),
        created_by: 1,
      },
    });

    // Зурагнууд хадгалах
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
      const imageData = files.map((f, i) => ({
        material_id: material.id,
        url: `${BASE_URL}/uploads/materials/${f.filename}`,
        is_primary: i === 0,
        sort_order: i,
      }));
      await prisma.material_images.createMany({ data: imageData }).catch(() => {});
      await prisma.materials.update({
        where: { id: material.id },
        data: { image_url: imageData[0].url },
      }).catch(() => {});
    }

    res.status(201).json(material);
  } catch (err) {
    console.error('❌ createMaterial алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type_id, code, name, unit, thickness, sheet_length, sheet_width, price, stock, is_active } = req.body;

    const data: any = {};
    if (type_id !== undefined) data.type_id = Number(type_id);
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (unit !== undefined) data.unit = unit;
    if (thickness !== undefined) data.thickness = thickness ? Number(thickness) : null;
    if (sheet_length !== undefined) data.sheet_length = sheet_length ? Number(sheet_length) : null;
    if (sheet_width !== undefined) data.sheet_width = sheet_width ? Number(sheet_width) : null;
    if (price !== undefined) data.price = Number(price);
    if (stock !== undefined) data.stock = Number(stock);
    if (is_active !== undefined) data.is_active = Boolean(is_active);

    const material = await prisma.materials.update({ where: { id: Number(id) }, data });

    // Шинэ зурагнууд
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
      const imageData = files.map((f, i) => ({
        material_id: Number(id),
        url: `${BASE_URL}/uploads/materials/${f.filename}`,
        is_primary: false,
        sort_order: i + 100,
      }));
      await prisma.material_images.createMany({ data: imageData }).catch(() => {});
    }

    res.json(material);
  } catch (err) {
    console.error('updateMaterial алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.materials.update({ where: { id: Number(id) }, data: { is_active: false } });
    res.json({ message: 'Материал идэвхгүй болголоо' });
  } catch (err) {
    console.error('deleteMaterial:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const img = await prisma.material_images.findUnique({ where: { id: Number(imageId) } });
    if (img) {
      const filePath = path.join(process.cwd(), 'uploads', 'materials', path.basename(img.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await prisma.material_images.delete({ where: { id: Number(imageId) } });
    }
    res.json({ message: 'Зураг устгагдлаа' });
  } catch (err) {
    console.error('deleteImage:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const setPrimaryImage = async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    await prisma.material_images.updateMany({
      where: { material_id: Number(id) },
      data: { is_primary: false },
    });
    const img = await prisma.material_images.update({
      where: { id: Number(imageId) },
      data: { is_primary: true },
    });
    await prisma.materials.update({
      where: { id: Number(id) },
      data: { image_url: img.url },
    }).catch(() => {});
    res.json({ message: 'Үндсэн зураг солигдлоо' });
  } catch (err) {
    console.error('setPrimaryImage:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};
