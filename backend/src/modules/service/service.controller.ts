import { Request, Response } from 'express';
import prisma from '../../prisma';

export const getServiceTypes = async (req: Request, res: Response) => {
  try {
    const types = await prisma.service_types.findMany({
      where: { is_active: true },
      include: { services: { where: { is_active: true } } }
    });
    res.json(types);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const { service_type_id, org_id } = req.query;
    const services = await prisma.services.findMany({
      where: {
        is_active: true,
        ...(service_type_id && { service_type_id: Number(service_type_id) }),
        ...(org_id && { org_id: Number(org_id) })
      },
      include: { service_types: true }
    });
    res.json(services);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createServiceType = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const type = await prisma.service_types.create({
      data: { name, description }
    });
    res.status(201).json(type);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { org_id, service_type_id, name, unit, price, description } = req.body;
    const service = await prisma.services.create({
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
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const service = await prisma.services.update({
      where: { id: Number(id) },
      data
    });
    res.json(service);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};