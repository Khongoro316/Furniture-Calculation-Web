"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateService = exports.createService = exports.createServiceType = exports.getServices = exports.getServiceTypes = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const getServiceTypes = async (req, res) => {
    try {
        const types = await prisma_1.default.service_types.findMany({
            where: { is_active: true },
            include: { services: { where: { is_active: true } } }
        });
        res.json(types);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getServiceTypes = getServiceTypes;
const getServices = async (req, res) => {
    try {
        const { service_type_id, org_id } = req.query;
        const services = await prisma_1.default.services.findMany({
            where: {
                is_active: true,
                ...(service_type_id && { service_type_id: Number(service_type_id) }),
                ...(org_id && { org_id: Number(org_id) })
            },
            include: { service_types: true }
        });
        res.json(services);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getServices = getServices;
const createServiceType = async (req, res) => {
    try {
        const { name, description } = req.body;
        const type = await prisma_1.default.service_types.create({
            data: { name, description }
        });
        res.status(201).json(type);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.createServiceType = createServiceType;
const createService = async (req, res) => {
    try {
        const { org_id, service_type_id, name, unit, price, description } = req.body;
        const service = await prisma_1.default.services.create({
            data: {
                org_id: Number(org_id),
                service_type_id: Number(service_type_id),
                name,
                unit,
                price: Number(price),
                description,
                created_by: 1
            }
        });
        res.status(201).json(service);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.createService = createService;
const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const service = await prisma_1.default.services.update({
            where: { id: Number(id) },
            data
        });
        res.json(service);
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.updateService = updateService;
