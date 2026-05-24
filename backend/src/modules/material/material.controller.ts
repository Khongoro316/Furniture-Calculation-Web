import { Request, Response } from 'express';
import prismaClient from '../../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = prismaClient as any;

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

const buildMaterialInclude = async () => {
  const includeImages = await prisma.material_images
    .findFirst()
    .then(() => true)
    .catch(() => false);

  return {
    material_types: { include: { material_categories: true } },
    ...(includeImages ? { material_images: { orderBy: { sort_order: 'asc' } } } : {}),
  };
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.material_categories.findMany({
      where: { is_active: true },
      include: { material_types: { where: { is_active: true } } },
      orderBy: { created_at: 'desc' },
    });
    return res.json(categories);
  } catch (error) {
    console.error('getCategories:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const category = await prisma.material_categories.create({
      data: { name, description },
    });
    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('createCategory:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const category = await prisma.material_categories.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      },
    });
    return res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('updateCategory:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.material_categories.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    await prisma.material_types.updateMany({
      where: { category_id: Number(id) },
      data: { is_active: false },
    });
    return res.json({ message: 'Category archived successfully' });
  } catch (error) {
    console.error('deleteCategory:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const getTypes = async (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    const types = await prisma.material_types.findMany({
      where: {
        is_active: true,
        ...(category_id && { category_id: Number(category_id) }),
      },
      orderBy: { created_at: 'desc' },
    });
    return res.json(types);
  } catch (error) {
    console.error('getTypes:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const createType = async (req: Request, res: Response) => {
  try {
    const { category_id, name, description } = req.body;
    if (!category_id || !name) {
      return res.status(400).json({ message: 'Category and name are required' });
    }

    const type = await prisma.material_types.create({
      data: { category_id: Number(category_id), name, description },
    });
    return res.status(201).json({ message: 'Material type created successfully', type });
  } catch (error) {
    console.error('createType:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const updateType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, is_active } = req.body;
    const type = await prisma.material_types.update({
      where: { id: Number(id) },
      data: {
        ...(category_id !== undefined ? { category_id: Number(category_id) } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      },
    });
    return res.json({ message: 'Material type updated successfully', type });
  } catch (error) {
    console.error('updateType:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const deleteType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.material_types.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    return res.json({ message: 'Material type archived successfully' });
  } catch (error) {
    console.error('deleteType:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { type_id } = req.query;
    const materials = await prisma.materials.findMany({
      where: {
        is_active: true,
        ...(type_id && { type_id: Number(type_id) }),
      },
      include: await buildMaterialInclude(),
      orderBy: { created_at: 'desc' },
    });

    return res.json(materials);
  } catch (error) {
    console.error('getMaterials:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const material = await prisma.materials.findUnique({
      where: { id: Number(id) },
      include: await buildMaterialInclude(),
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    return res.json(material);
  } catch (error) {
    console.error('getMaterialById:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const { type_id, code, name, unit, thickness, sheet_length, sheet_width, price, stock } = req.body;
    const reqUser = (req as any).user;

    const existing = await prisma.materials.findFirst({ where: { code } });
    if (existing) {
      return res.status(400).json({ message: 'This code already exists' });
    }

    const material = await prisma.materials.create({
      data: {
        type_id: Number(type_id),
        code,
        name,
        unit,
        thickness: thickness ? Number(thickness) : null,
        sheet_length: sheet_length ? Number(sheet_length) : null,
        sheet_width: sheet_width ? Number(sheet_width) : null,
        price: Number(price || 0),
        stock: Number(stock || 0),
        created_by: reqUser.userId,
      },
    });

    const files = req.files as Express.Multer.File[] | undefined;
    if (files?.length) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const imageData = files.map((file, index) => ({
        material_id: material.id,
        url: `${baseUrl}/uploads/materials/${file.filename}`,
        is_primary: index === 0,
        sort_order: index,
      }));

      await prisma.material_images.createMany({ data: imageData }).catch(() => {});
      await prisma.materials.update({
        where: { id: material.id },
        data: { image_url: imageData[0].url },
      }).catch(() => {});
    }

    return res.status(201).json({ message: 'Material created successfully', material });
  } catch (error) {
    console.error('createMaterial:', error);
    return res.status(500).json({ message: 'System error' });
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

    const material = await prisma.materials.update({
      where: { id: Number(id) },
      data,
    });

    const files = req.files as Express.Multer.File[] | undefined;
    if (files?.length) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const imageData = files.map((file, index) => ({
        material_id: Number(id),
        url: `${baseUrl}/uploads/materials/${file.filename}`,
        is_primary: false,
        sort_order: index + 100,
      }));

      await prisma.material_images.createMany({ data: imageData }).catch(() => {});
    }

    return res.json({ message: 'Material updated successfully', material });
  } catch (error) {
    console.error('updateMaterial:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.materials.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    return res.json({ message: 'Material archived successfully' });
  } catch (error) {
    console.error('deleteMaterial:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const image = await prisma.material_images.findUnique({ where: { id: Number(imageId) } });
    if (image) {
      const filePath = path.join(process.cwd(), 'uploads', 'materials', path.basename(image.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await prisma.material_images.delete({ where: { id: Number(imageId) } });
    }
    return res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('deleteImage:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const setPrimaryImage = async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    await prisma.material_images.updateMany({
      where: { material_id: Number(id) },
      data: { is_primary: false },
    });

    const image = await prisma.material_images.update({
      where: { id: Number(imageId) },
      data: { is_primary: true },
    });

    await prisma.materials.update({
      where: { id: Number(id) },
      data: { image_url: image.url },
    }).catch(() => {});

    return res.json({ message: 'Primary image updated successfully' });
  } catch (error) {
    console.error('setPrimaryImage:', error);
    return res.status(500).json({ message: 'System error' });
  }
};
