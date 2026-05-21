"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFormula = exports.deleteField = exports.deleteFurnitureType = exports.updateFurnitureType = exports.createFormula = exports.createInputField = exports.createFurnitureType = exports.getFormulas = exports.getInputFields = exports.getFurnitureTypes = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const getFurnitureTypes = async (req, res) => {
    try {
        const types = await prisma_1.default.furniture_types.findMany({
            where: { is_active: true }
        });
        res.json(types);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getFurnitureTypes = getFurnitureTypes;
const getInputFields = async (req, res) => {
    try {
        const { id } = req.params;
        const fields = await prisma_1.default.calc_input_fields.findMany({
            where: { furniture_type_id: Number(id) },
            orderBy: { sort_order: 'asc' }
        });
        res.json(fields);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getInputFields = getInputFields;
const getFormulas = async (req, res) => {
    try {
        const { id } = req.params;
        const formulas = await prisma_1.default.calc_formulas.findMany({
            where: { furniture_type_id: Number(id) },
            orderBy: { sort_order: 'asc' }
        });
        res.json(formulas);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getFormulas = getFormulas;
const createFurnitureType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const type = await prisma_1.default.furniture_types.create({
            data: { name, description, created_by: 1 }
        });
        res.status(201).json(type);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.createFurnitureType = createFurnitureType;
const createInputField = async (req, res) => {
    try {
        const { id } = req.params;
        const { field_key, label, input_type, unit, min_value, max_value, default_value, is_required, sort_order, options_json } = req.body;
        const field = await prisma_1.default.calc_input_fields.create({
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
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Энэ field_key бүртгэлтэй байна' });
        }
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.createInputField = createInputField;
const createFormula = async (req, res) => {
    try {
        const { id } = req.params;
        const { part_key, part_label, formula_width, formula_height, formula_qty, formula_edge, has_edge, sort_order } = req.body;
        const formula = await prisma_1.default.calc_formulas.create({
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
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Энэ part_key бүртгэлтэй байна' });
        }
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.createFormula = createFormula;
const updateFurnitureType = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const type = await prisma_1.default.furniture_types.update({
            where: { id: Number(id) },
            data
        });
        res.json(type);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.updateFurnitureType = updateFurnitureType;
const deleteFurnitureType = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id || Number.isNaN(id)) {
            return res.status(400).json({ message: 'Тавилгын төрлийн ID буруу байна' });
        }
        const furnitureType = await prisma_1.default.furniture_types.findUnique({
            where: { id },
        });
        if (!furnitureType) {
            return res.status(404).json({ message: 'Тавилгын төрөл олдсонгүй' });
        }
        await prisma_1.default.$transaction(async (tx) => {
            // Эхлээд тухайн төрөлтэй холбоотой оролтын талбаруудыг устгана
            await tx.calc_input_fields.deleteMany({
                where: { furniture_type_id: id },
            });
            // Дараа нь тухайн төрөлтэй холбоотой томьёонуудыг устгана
            await tx.calc_formulas.deleteMany({
                where: { furniture_type_id: id },
            });
            // Эцэст нь тавилгын төрлийг устгана
            await tx.furniture_types.delete({
                where: { id },
            });
        });
        return res.json({
            message: 'Тавилгын төрөл амжилттай устгагдлаа',
            deleted: true,
        });
    }
    catch (err) {
        console.error('DELETE FURNITURE TYPE ERROR:', err);
        // Хэрэв өөр хүснэгттэй холбоотой байгаа бол бүр устгахгүй, идэвхгүй болгоно
        if (err.code === 'P2003') {
            try {
                const id = Number(req.params.id);
                const updated = await prisma_1.default.furniture_types.update({
                    where: { id },
                    data: { is_active: false },
                });
                return res.json({
                    message: 'Холбоотой мэдээлэл байгаа тул устгахын оронд идэвхгүй болголоо',
                    deactivated: true,
                    data: updated,
                });
            }
            catch (updateErr) {
                console.error('DEACTIVATE FURNITURE TYPE ERROR:', updateErr);
                return res.status(500).json({
                    message: 'Холбоотой мэдээлэлтэй тул устгах боломжгүй байна',
                });
            }
        }
        return res.status(500).json({
            message: err.message || 'Тавилгын төрөл устгахад алдаа гарлаа',
        });
    }
};
exports.deleteFurnitureType = deleteFurnitureType;
const deleteField = async (req, res) => {
    try {
        const typeId = Number(req.params.id);
        const fieldId = Number(req.params.fieldId);
        if (Number.isNaN(typeId) || Number.isNaN(fieldId)) {
            return res.status(400).json({ message: 'ID буруу байна' });
        }
        const field = await prisma_1.default.calc_input_fields.findFirst({
            where: {
                id: fieldId,
                furniture_type_id: typeId,
            },
        });
        if (!field) {
            return res.status(404).json({ message: 'Талбар олдсонгүй' });
        }
        await prisma_1.default.calc_input_fields.delete({
            where: { id: fieldId },
        });
        return res.json({
            message: 'Талбар амжилттай устгагдлаа',
            deleted: true,
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err.message || 'Талбар устгахад алдаа гарлаа',
        });
    }
};
exports.deleteField = deleteField;
const deleteFormula = async (req, res) => {
    try {
        const typeId = Number(req.params.id);
        const formulaId = Number(req.params.formulaId);
        if (Number.isNaN(typeId) || Number.isNaN(formulaId)) {
            return res.status(400).json({ message: 'ID буруу байна' });
        }
        const formula = await prisma_1.default.calc_formulas.findFirst({
            where: {
                id: formulaId,
                furniture_type_id: typeId,
            },
        });
        if (!formula) {
            return res.status(404).json({ message: 'Томьёо олдсонгүй' });
        }
        await prisma_1.default.calc_formulas.delete({
            where: { id: formulaId },
        });
        return res.json({
            message: 'Томьёо амжилттай устгагдлаа',
            deleted: true,
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err.message || 'Томьёо устгахад алдаа гарлаа',
        });
    }
};
exports.deleteFormula = deleteFormula;
