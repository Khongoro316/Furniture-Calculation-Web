import { Request, Response } from 'express';
import prisma from '../../prisma';
import { AuthRequest } from '../../middleware/auth';

const generateOrderNo = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${y}${m}${d}-${rand}`;
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const where: any = {};
    if (status) where.status = status;
    if (role === 'worker') where.assigned_to = userId;

    const orders = await prisma.orders.findMany({
      where,
      include: {
        users_orders_user_idTousers: {
          select: { first_name: true, last_name: true, email: true }
        },
        calculations: {
          include: { furniture_types: true }
        },
        payments: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { user_id: req.user!.userId },
      include: {
        calculations: { include: { furniture_types: true } },
        payments: true,
        order_status_history: { orderBy: { created_at: 'desc' } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.orders.findUnique({
      where: { id: Number(id) },
      include: {
        users_orders_user_idTousers: {
          select: { first_name: true, last_name: true, email: true }
        },
        calculations: {
          include: {
            furniture_types: true,
            calculation_parts: true
          }
        },
        order_items: {
          include: { materials: true, services: true }
        },
        order_status_history: { orderBy: { created_at: 'desc' } },
        payments: true
      }
    });
    if (!order) {
      return res.status(404).json({ message: 'Захиалга олдсонгүй' });
    }
    res.json(order);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { calculation_id, org_id, note, total_amount } = req.body;

    const order = await prisma.orders.create({
      data: {
        order_no:       generateOrderNo(),
        user_id:        req.user!.userId,
        calculation_id: calculation_id ? Number(calculation_id) : null,
        org_id:         Number(org_id || 1),
        total_amount:   Number(total_amount || 0),
        note,
        status:         'pending'
      }
    });

    await prisma.order_status_history.create({
      data: {
        order_id:   order.id,
        old_status: null,
        new_status: 'pending',
        changed_by: req.user!.userId,
        note:       'Захиалга үүслээ'
      }
    });

    res.status(201).json(order);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const assignOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { worker_id } = req.body;

    const order = await prisma.orders.update({
      where: { id: Number(id) },
      data: {
        assigned_to:  Number(worker_id),
        processed_by: req.user!.userId,
        status:       'assigned'
      }
    });

    await prisma.order_status_history.create({
      data: {
        order_id:   order.id,
        old_status: 'pending',
        new_status: 'assigned',
        changed_by: req.user!.userId,
        note:       'Ажилтанд хуваарилагдлаа'
      }
    });

    res.json(order);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const current = await prisma.orders.findUnique({ where: { id: Number(id) } });
    if (!current) {
      return res.status(404).json({ message: 'Захиалга олдсонгүй' });
    }

    const order = await prisma.orders.update({
      where: { id: Number(id) },
      data: { status }
    });

    await prisma.order_status_history.create({
      data: {
        order_id:   order.id,
        old_status: current.status,
        new_status: status,
        changed_by: req.user!.userId,
        note:       note || null
      }
    });

    res.json(order);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const addPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, method } = req.body;

    const payment = await prisma.payments.create({
      data: {
        order_id: Number(id),
        amount:   Number(amount),
        method,
        status:   'paid',
        paid_at:  new Date()
      }
    });

    await prisma.orders.update({
      where: { id: Number(id) },
      data: { status: 'confirmed' }
    });

    res.status(201).json(payment);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};