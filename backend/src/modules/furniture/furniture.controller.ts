import { Request, Response } from 'express';
import prisma from '../../prisma';

export const getFurnitureTypes = async (req: Request, res: Response) => {
  try {
    const types = await prisma.furniture_types.findMany({
      where: { is_active: true }
    });
    res.json(types);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getInputFields = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = await prisma.calc_input_fields.findMany({
      where: { furniture_type_id: Number(id) },
      orderBy: { sort_order: 'asc' }
    });
    res.json(fields);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getFormulas = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const formulas = await prisma.calc_formulas.findMany({
      where: { furniture_type_id: Number(id) },
      orderBy: { sort_order: 'asc' }
    });
    res.json(formulas);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createFurnitureType = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const type = await prisma.furniture_types.create({
      data: { name, description, created_by: 1 }
    });
    res.status(201).json(type);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createInputField = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      field_key, label, input_type,
      unit, min_value, max_value,
      default_value, is_required, sort_order, options_json
    } = req.body;

    const field = await prisma.calc_input_fields.create({
      data: {
        furniture_type_id: Number(id),
        field_key,
        label,
        input_type: input_type || 'number',
        unit,
        min_value: min_value ? Number(min_value) : null,
        max_value: max_value ? Number(max_value) : null,
        default_value: default_value ? Number(default_value) : null,
        is_required: is_required !== false,
        sort_order: Number(sort_order || 0),
        options_json: options_json || null
      }
    });
    res.status(201).json(field);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Энэ field_key бүртгэлтэй байна' });
    }
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createFormula = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      part_key, part_label,
      formula_width, formula_height,
      formula_qty, formula_edge,
      has_edge, sort_order
    } = req.body;

    const formula = await prisma.calc_formulas.create({
      data: {
        furniture_type_id: Number(id),
        part_key,
        part_label,
        formula_width,
        formula_height,
        formula_qty,
        formula_edge: formula_edge || null,
        has_edge: has_edge === true,
        sort_order: Number(sort_order || 0)
      }
    });
    res.status(201).json(formula);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Энэ part_key бүртгэлтэй байна' });
    }
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateFurnitureType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const type = await prisma.furniture_types.update({
      where: { id: Number(id) },
      data
    });
    res.json(type);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};