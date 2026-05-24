import { Request, Response } from 'express';
import prisma from '../../prisma';

const toNumber = (value: unknown) => Number(value || 0);

export const getServiceTypes = async (req: Request, res: Response) => {
  try {
    const includeInactive = ['admin', 'super_admin'].includes((req as any).user?.role || '');
    const types = await prisma.service_types.findMany({
      where: includeInactive ? undefined : { is_active: true },
      include: {
        services: {
          where: includeInactive ? undefined : { is_active: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return res.json(types);
  } catch (error) {
    console.error('getServiceTypes:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const getServices = async (req: Request, res: Response) => {
  try {
    const { service_type_id } = req.query;
    const includeInactive = ['accountant', 'admin', 'super_admin'].includes((req as any).user?.role || '');
    const services = await prisma.services.findMany({
      where: {
        ...(includeInactive ? {} : { is_active: true }),
        ...(service_type_id && { service_type_id: Number(service_type_id) }),
      },
      include: { service_types: true },
      orderBy: { created_at: 'desc' },
    });
    return res.json(services);
  } catch (error) {
    console.error('getServices:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const createServiceType = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const type = await prisma.service_types.create({
      data: { name, description },
    });
    return res.status(201).json({ message: 'Service type created successfully', serviceType: type });
  } catch (error) {
    console.error('createServiceType:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const updateServiceType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    const type = await prisma.service_types.update({
      where: { id: Number(id) },
      data: { ...(name !== undefined ? { name } : {}), ...(description !== undefined ? { description } : {}), ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}) },
    });
    return res.json({ message: 'Service type updated successfully', serviceType: type });
  } catch (error) {
    console.error('updateServiceType:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const deleteServiceType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.service_types.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    await prisma.services.updateMany({
      where: { service_type_id: Number(id) },
      data: { is_active: false },
    });
    return res.json({ message: 'Service type archived successfully' });
  } catch (error) {
    console.error('deleteServiceType:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { service_type_id, name, unit, price, description } = req.body;
    const reqUser = (req as any).user;

    if (!service_type_id || !name || !unit) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const service = await prisma.services.create({
      data: {
        service_type_id: Number(service_type_id),
        name,
        unit,
        price: toNumber(price),
        description,
        created_by: reqUser.userId,
      },
      include: { service_types: true },
    });
    return res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    console.error('createService:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { service_type_id, name, unit, price, description, is_active } = req.body;
    const service = await prisma.services.update({
      where: { id: Number(id) },
      data: {
        ...(service_type_id !== undefined ? { service_type_id: Number(service_type_id) } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(price !== undefined ? { price: toNumber(price) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      },
      include: { service_types: true },
    });
    return res.json({ message: 'Service updated successfully', service });
  } catch (error) {
    console.error('updateService:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.services.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    return res.json({ message: 'Service archived successfully' });
  } catch (error) {
    console.error('deleteService:', error);
    return res.status(500).json({ message: 'System error' });
  }
};
