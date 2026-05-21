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
exports.deleteCalculation = exports.getCalculationById = exports.getMyCalculations = exports.calculateGuest = exports.calculate = exports.getCalculationForm = void 0;
const math = __importStar(require("mathjs"));
const prisma_1 = __importDefault(require("../../prisma"));
const getCalculationForm = async (req, res) => {
    try {
        const { id } = req.params;
        const furnitureType = await prisma_1.default.furniture_types.findUnique({
            where: { id: Number(id) }
        });
        if (!furnitureType) {
            return res.status(404).json({ message: 'Тавилгын төрөл олдсонгүй' });
        }
        const fields = await prisma_1.default.calc_input_fields.findMany({
            where: { furniture_type_id: Number(id) },
            orderBy: { sort_order: 'asc' }
        });
        res.json({ furniture_type: furnitureType, fields });
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getCalculationForm = getCalculationForm;
const runCalculation = async (furniture_type_id, inputs) => {
    const formulas = await prisma_1.default.calc_formulas.findMany({
        where: { furniture_type_id },
        orderBy: { sort_order: 'asc' }
    });
    const parts = formulas.map(formula => {
        const width_mm = Number(math.evaluate(formula.formula_width, inputs));
        const height_mm = Number(math.evaluate(formula.formula_height, inputs));
        const qty = Number(math.evaluate(formula.formula_qty, inputs));
        const area_m2 = (width_mm * height_mm * qty) / 1000000;
        const edge_length_m = formula.has_edge && formula.formula_edge
            ? Number(math.evaluate(formula.formula_edge, inputs))
            : 0;
        return {
            part_key: formula.part_key,
            part_label: formula.part_label,
            width_mm: Math.round(width_mm * 100) / 100,
            height_mm: Math.round(height_mm * 100) / 100,
            qty,
            area_m2: Math.round(area_m2 * 1000000) / 1000000,
            edge_length_m: Math.round(edge_length_m * 1000) / 1000
        };
    });
    const total_area = parts.reduce((s, p) => s + p.area_m2, 0);
    const total_edge = parts.reduce((s, p) => s + p.edge_length_m, 0);
    const waste_coeff = inputs.waste_coeff || 0.10;
    const total_area_real = total_area * (1 + waste_coeff);
    return { parts, total_area, total_area_real, total_edge };
};
const calculate = async (req, res) => {
    try {
        const { furniture_type_id, inputs, save } = req.body;
        if (!furniture_type_id || !inputs) {
            return res.status(400).json({ message: 'furniture_type_id болон inputs шаардлагатай' });
        }
        const result = await runCalculation(Number(furniture_type_id), inputs);
        if (save) {
            const saved = await prisma_1.default.calculations.create({
                data: {
                    user_id: req.user.userId,
                    furniture_type_id: Number(furniture_type_id),
                    input_data: JSON.stringify(inputs),
                    total_area: result.total_area,
                    total_area_real: result.total_area_real,
                    total_edge: result.total_edge,
                    is_saved: true
                }
            });
            await prisma_1.default.calculation_parts.createMany({
                data: result.parts.map(p => ({
                    calculation_id: saved.id,
                    part_key: p.part_key,
                    part_label: p.part_label,
                    width_mm: p.width_mm,
                    height_mm: p.height_mm,
                    qty: p.qty,
                    area_m2: p.area_m2,
                    edge_length_m: p.edge_length_m
                }))
            });
            return res.status(201).json({
                calculation_id: saved.id,
                ...result
            });
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Тооцооны алдаа гарлаа: ' + error.message });
    }
};
exports.calculate = calculate;
const calculateGuest = async (req, res) => {
    try {
        const { furniture_type_id, inputs } = req.body;
        if (!furniture_type_id || !inputs) {
            return res.status(400).json({ message: 'furniture_type_id болон inputs шаардлагатай' });
        }
        const result = await runCalculation(Number(furniture_type_id), inputs);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Тооцооны алдаа гарлаа: ' + error.message });
    }
};
exports.calculateGuest = calculateGuest;
const getMyCalculations = async (req, res) => {
    try {
        const calculations = await prisma_1.default.calculations.findMany({
            where: { user_id: req.user.userId, is_saved: true },
            include: { furniture_types: true },
            orderBy: { created_at: 'desc' }
        });
        res.json(calculations);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getMyCalculations = getMyCalculations;
const getCalculationById = async (req, res) => {
    try {
        const { id } = req.params;
        const calc = await prisma_1.default.calculations.findFirst({
            where: { id: Number(id), user_id: req.user.userId },
            include: {
                furniture_types: true,
                calculation_parts: true
            }
        });
        if (!calc) {
            return res.status(404).json({ message: 'Тооцоо олдсонгүй' });
        }
        res.json(calc);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getCalculationById = getCalculationById;
const deleteCalculation = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.calculations.deleteMany({
            where: { id: Number(id), user_id: req.user.userId }
        });
        res.json({ message: 'Амжилттай устгагдлаа' });
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.deleteCalculation = deleteCalculation;
