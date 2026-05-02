import { Request, Response } from 'express';
import * as math from 'mathjs';
import prisma from '../../prisma';
import { AuthRequest } from '../../middleware/auth';

export const getCalculationForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const furnitureType = await prisma.furniture_types.findUnique({
      where: { id: Number(id) }
    });
    if (!furnitureType) {
      return res.status(404).json({ message: 'Тавилгын төрөл олдсонгүй' });
    }
    const fields = await prisma.calc_input_fields.findMany({
      where: { furniture_type_id: Number(id) },
      orderBy: { sort_order: 'asc' }
    });
    res.json({ furniture_type: furnitureType, fields });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

const runCalculation = async (furniture_type_id: number, inputs: Record<string, number>) => {
  const formulas = await prisma.calc_formulas.findMany({
    where: { furniture_type_id },
    orderBy: { sort_order: 'asc' }
  });

  const parts = formulas.map(formula => {
    const width_mm  = Number(math.evaluate(formula.formula_width,  inputs));
    const height_mm = Number(math.evaluate(formula.formula_height, inputs));
    const qty       = Number(math.evaluate(formula.formula_qty,    inputs));
    const area_m2   = (width_mm * height_mm * qty) / 1_000_000;
    const edge_length_m = formula.has_edge && formula.formula_edge
      ? Number(math.evaluate(formula.formula_edge, inputs))
      : 0;

    return {
      part_key:      formula.part_key,
      part_label:    formula.part_label,
      width_mm:      Math.round(width_mm * 100) / 100,
      height_mm:     Math.round(height_mm * 100) / 100,
      qty,
      area_m2:       Math.round(area_m2 * 1_000_000) / 1_000_000,
      edge_length_m: Math.round(edge_length_m * 1000) / 1000
    };
  });

  const total_area    = parts.reduce((s, p) => s + p.area_m2, 0);
  const total_edge    = parts.reduce((s, p) => s + p.edge_length_m, 0);
  const waste_coeff   = inputs.waste_coeff || 0.10;
  const total_area_real = total_area * (1 + waste_coeff);

  return { parts, total_area, total_area_real, total_edge };
};

export const calculate = async (req: AuthRequest, res: Response) => {
  try {
    const { furniture_type_id, inputs, save } = req.body;

    if (!furniture_type_id || !inputs) {
      return res.status(400).json({ message: 'furniture_type_id болон inputs шаардлагатай' });
    }

    const result = await runCalculation(Number(furniture_type_id), inputs);

    if (save) {
      const saved = await prisma.calculations.create({
        data: {
          user_id:           req.user!.userId,
          furniture_type_id: Number(furniture_type_id),
          input_data:        JSON.stringify(inputs),
          total_area:        result.total_area,
          total_area_real:   result.total_area_real,
          total_edge:        result.total_edge,
          is_saved:          true
        }
      });

      await prisma.calculation_parts.createMany({
        data: result.parts.map(p => ({
          calculation_id: saved.id,
          part_key:       p.part_key,
          part_label:     p.part_label,
          width_mm:       p.width_mm,
          height_mm:      p.height_mm,
          qty:            p.qty,
          area_m2:        p.area_m2,
          edge_length_m:  p.edge_length_m
        }))
      });

      return res.status(201).json({
        calculation_id: saved.id,
        ...result
      });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Тооцооны алдаа гарлаа: ' + error.message });
  }
};

export const calculateGuest = async (req: Request, res: Response) => {
  try {
    const { furniture_type_id, inputs } = req.body;
    if (!furniture_type_id || !inputs) {
      return res.status(400).json({ message: 'furniture_type_id болон inputs шаардлагатай' });
    }
    const result = await runCalculation(Number(furniture_type_id), inputs);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Тооцооны алдаа гарлаа: ' + error.message });
  }
};

export const getMyCalculations = async (req: AuthRequest, res: Response) => {
  try {
    const calculations = await prisma.calculations.findMany({
      where: { user_id: req.user!.userId, is_saved: true },
      include: { furniture_types: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(calculations);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getCalculationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const calc = await prisma.calculations.findFirst({
      where: { id: Number(id), user_id: req.user!.userId },
      include: {
        furniture_types:    true,
        calculation_parts:  true
      }
    });
    if (!calc) {
      return res.status(404).json({ message: 'Тооцоо олдсонгүй' });
    }
    res.json(calc);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const deleteCalculation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.calculations.deleteMany({
      where: { id: Number(id), user_id: req.user!.userId }
    });
    res.json({ message: 'Амжилттай устгагдлаа' });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};