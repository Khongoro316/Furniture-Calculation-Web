import { Request, Response } from 'express';
import prisma from '../../prisma';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.material_categories.findMany({
      where: { is_active: true },
      include: { material_types: { where: { is_active: true } } }
    });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getTypes = async (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    const types = await prisma.material_types.findMany({
      where: {
        is_active: true,
        ...(category_id && { category_id: Number(category_id) })
      }
    });
    res.json(types);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const { type_id, org_id } = req.query;
    const materials = await prisma.materials.findMany({
      where: {
        is_active: true,
        ...(type_id && { type_id: Number(type_id) }),
        ...(org_id && { org_id: Number(org_id) })
      },
      include: {
        material_types: {
          include: { material_categories: true }
        }
      }
    });
    res.json(materials);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const {
      org_id, type_id, code, name, unit,
      thickness, sheet_length, sheet_width, price, stock
    } = req.body;

    const existing = await prisma.materials.findFirst({
      where: { org_id: Number(org_id), code }
    });
    if (existing) {
      return res.status(400).json({ message: 'Энэ код бүртгэлтэй байна' });
    }

    const material = await prisma.materials.create({
      data: {
        org_id: Number(org_id),
        type_id: Number(type_id),
        code, name, unit,
        thickness: thickness ? Number(thickness) : null,
        sheet_length: sheet_length ? Number(sheet_length) : null,
        sheet_width: sheet_width ? Number(sheet_width) : null,
        price: Number(price),
        stock: Number(stock || 0),
        created_by: 1
      }
    });
    res.status(201).json(material);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const material = await prisma.materials.update({
      where: { id: Number(id) },
      data
    });
    res.json(material);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.material_categories.create({
      data: { name, description }
    });
    res.status(201).json(category);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createType = async (req: Request, res: Response) => {
  try {
    const { category_id, name, description } = req.body;
    const type = await prisma.material_types.create({
      data: { category_id: Number(category_id), name, description }
    });
    res.status(201).json(type);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};