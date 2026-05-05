import { Request, Response } from 'express';
import prismaClient from '../../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// prisma as any — material_images шинэ модел TypeScript-д танигдахгүй байгааг шийдэх
const prisma = prismaClient as any;

// ── MULTER ────────────────────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `mat-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Зөвхөн зураг файл хүлээж авна (jpg, png, webp, gif)'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// ── CATEGORIES ────────────────────────────────────────────────────────────────
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
    console.error('createCategory алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
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
    console.error('getTypes алдаа:', err);
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
    console.error('createType алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── MATERIALS ─────────────────────────────────────────────────────────────────
export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { type_id, org_id } = req.query;
    const materials = await prisma.materials.findMany({
      where: {
        is_active: true,
        ...(type_id && { type_id: Number(type_id) }),
        ...(org_id && { org_id: Number(org_id) }),
      },
      include: {
        material_types: { include: { material_categories: true } },
        material_images: { orderBy: { sort_order: 'asc' } },
      },
    });
    res.json(materials);
  } catch (err) {
    console.error('getMaterials алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const {
      org_id, type_id, code, name, unit,
      thickness, sheet_length, sheet_width, price, stock,
    } = req.body;

    console.log('📥 createMaterial body:', req.body);
    console.log('📥 files:', req.files);

    if (!org_id || !type_id || !code || !name) {
      return res.status(400).json({ message: 'org_id, type_id, code, name заавал шаардлагатай' });
    }

    const existing = await prisma.materials.findFirst({
      where: { org_id: Number(org_id), code },
    });
    if (existing) {
      return res.status(400).json({ message: 'Энэ код бүртгэлтэй байна' });
    }

    const material = await prisma.materials.create({
      data: {
        org_id: Number(org_id),
        type_id: Number(type_id),
        code,
        name,
        unit: unit || 'м²',
        thickness: thickness ? Number(thickness) : null,
        sheet_length: sheet_length ? Number(sheet_length) : null,
        sheet_width: sheet_width ? Number(sheet_width) : null,
        price: Number(price || 0),
        stock: Number(stock || 0),
        created_by: (req as any).user?.id || 1,
      },
    });

    // Зураг хадгалах
    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
      const imageData = files.map((f, i) => ({
        material_id: material.id,
        url: `${BASE_URL}/uploads/materials/${f.filename}`,
        is_primary: i === 0,
        sort_order: i,
      }));

      await prisma.material_images.createMany({ data: imageData });
      await prisma.materials.update({
        where: { id: material.id },
        data: { image_url: imageData[0].url },
      });
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
    const {
      type_id, code, name, unit,
      thickness, sheet_length, sheet_width, price, stock,
    } = req.body;

    const updateData: any = {};
    if (type_id) updateData.type_id = Number(type_id);
    if (code) updateData.code = code;
    if (name) updateData.name = name;
    if (unit) updateData.unit = unit;
    if (thickness !== undefined) updateData.thickness = thickness ? Number(thickness) : null;
    if (sheet_length !== undefined) updateData.sheet_length = sheet_length ? Number(sheet_length) : null;
    if (sheet_width !== undefined) updateData.sheet_width = sheet_width ? Number(sheet_width) : null;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);

    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
      const existingCount = await prisma.material_images.count({
        where: { material_id: Number(id) },
      });
      const imageData = files.map((f: Express.Multer.File, i: number) => ({
        material_id: Number(id),
        url: `${BASE_URL}/uploads/materials/${f.filename}`,
        is_primary: existingCount === 0 && i === 0,
        sort_order: existingCount + i,
      }));

      await prisma.material_images.createMany({ data: imageData });
      if (existingCount === 0) {
        updateData.image_url = imageData[0].url;
      }
    }

    const material = await prisma.materials.update({
      where: { id: Number(id) },
      data: updateData,
    });
    res.json(material);
  } catch (err) {
    console.error('❌ updateMaterial алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── ЗУРАГ УСТГАХ ──────────────────────────────────────────────────────────────
export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const img = await prisma.material_images.findUnique({
      where: { id: Number(imageId) },
    });
    if (!img) return res.status(404).json({ message: 'Зураг олдсонгүй' });

    const filename = img.url.split('/').pop();
    if (filename) {
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.material_images.delete({ where: { id: Number(imageId) } });
    res.json({ message: 'Зураг устгагдлаа' });
  } catch (err) {
    console.error('❌ deleteImage алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── ҮНДСЭН ЗУРАГ СОЛИХ ───────────────────────────────────────────────────────
export const setPrimaryImage = async (req: Request, res: Response) => {
  try {
    const { materialId, imageId } = req.params;

    await prisma.material_images.updateMany({
      where: { material_id: Number(materialId) },
      data: { is_primary: false },
    });

    const img = await prisma.material_images.update({
      where: { id: Number(imageId) },
      data: { is_primary: true },
    });

    await prisma.materials.update({
      where: { id: Number(materialId) },
      data: { image_url: img.url },
    });

    res.json({ message: 'Үндсэн зураг солигдлоо' });
  } catch (err) {
    console.error('❌ setPrimaryImage алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.materials.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    res.json({ message: 'Материал устгагдлаа' });
  } catch (err) {
    console.error('❌ deleteMaterial алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};