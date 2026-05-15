// backend/src/modules/order/order.controller.ts
// БҮТЭН ФАЙЛЫГ СОЛИХ

import { Request, Response } from 'express';
import prismaClient from '../../prisma';
import { AuthRequest } from '../../middleware/auth';

const prisma = prismaClient as any;

const generateOrderNo = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${y}${m}${day}-${rand}`;
};

// ── Захиалгын жагсаалт (order_processor, admin, worker) ──────────────────────
// backend/src/modules/order/order.controller.ts дотор
// getOrders функцийг СОЛИХ — worker-т order_items include нэмэх

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const role       = req.user?.role;
    const userId     = req.user?.userId;

    const where: any = {};
    if (status)            where.status      = status;
    if (role === 'worker') where.assigned_to = userId;

    const isWorker = role === 'worker';

    const orders = await prisma.orders.findMany({
      where,
      include: {
        users_orders_user_idTousers: {
          select: { first_name: true, last_name: true, email: true, phone: true },
        },
        users_orders_assigned_toTousers: {
          select: { first_name: true, last_name: true, phone: true },
        },
        calculations: {
          include: {
            furniture_types:  true,
            // Worker-т хавтангийн хэмжээг харуулна
            ...(isWorker ? { calculation_parts: true } : {}),
          },
        },
        // Worker-т яг юу хийхийг харуулах
        ...(isWorker ? {
          order_items: {
            include: {
              materials: {
                include: {
                  material_types: { include: { material_categories: true } },
                  material_images: { where: { is_primary: true }, take: 1 },
                },
              },
              services: { include: { service_types: true } },
            },
            orderBy: { id: 'asc' },
          },
        } : {}),
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    console.error('getOrders:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Миний захиалгууд (customer) ───────────────────────────────────────────────
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { user_id: req.user!.userId },
      include: {
        calculations:         { include: { furniture_types: true } },
        payments:             true,
        order_status_history: { orderBy: { created_at: 'desc' } },
        order_items: {
          include: {
            materials: { include: { material_images: { where: { is_primary: true }, take: 1 } } },
            services:  true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error('getMyOrders:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Захиалгын дэлгэрэнгүй ────────────────────────────────────────────────────
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order  = await prisma.orders.findUnique({
      where: { id: Number(id) },
      include: {
        users_orders_user_idTousers: {
          select: { id: true, first_name: true, last_name: true, email: true, phone: true },
        },
        users_orders_assigned_toTousers: {
          select: { id: true, first_name: true, last_name: true, phone: true, role: true },
        },
        users_orders_processed_byTousers: {
          select: { id: true, first_name: true, last_name: true, role: true },
        },
        calculations: {
          include: {
            furniture_types:  true,
            calculation_parts: true,
          },
        },
        // ── Захиалсан материал болон үйлчилгээ ──
        order_items: {
          include: {
            materials: {
              include: {
                material_types: { include: { material_categories: true } },
                material_images: { where: { is_primary: true }, take: 1 },
              },
            },
            services: { include: { service_types: true } },
          },
          orderBy: { id: 'asc' },
        },
        order_status_history: {
          include: {
            users: { select: { first_name: true, last_name: true, role: true } },
          },
          orderBy: { created_at: 'desc' },
        },
        payments:      { orderBy: { created_at: 'desc' } },
        organizations: { select: { id: true, name: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ message: 'Захиалга олдсонгүй' });
    res.json(order);
  } catch (err) {
    console.error('getOrderById:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Захиалга үүсгэх ───────────────────────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const {
      calculation_id,
      note,
      total_amount,
      items    = [],   // [{ material_id, qty, unit, unit_price }]
      services = [],   // [{ service_id,  qty, unit, unit_price }]
    } = req.body;

    // org_id — хэрэглэгчийн байгууллага
    const orgId = (req.user as any).org_id || 1;

    // 1. Захиалга үүсгэх
    const order = await prisma.orders.create({
      data: {
        order_no:       generateOrderNo(),
        user_id:        req.user!.userId,
        org_id:         Number(orgId),
        calculation_id: calculation_id ? Number(calculation_id) : null,
        total_amount:   Number(total_amount || 0),
        note:           note || null,
        status:         'pending',
      },
    });

    // 2. Материалын order_items хадгалах
    if (items.length > 0) {
      const matData = items
        .filter((i: any) => i.material_id)
        .map((i: any) => ({
          order_id:    order.id,
          item_type:   'material',
          material_id: Number(i.material_id),
          qty:         Number(i.quantity || i.qty || 1),
          unit:        i.unit || '',
          unit_price:  Number(i.unit_price || 0),
          subtotal:    Number(i.unit_price || 0) * Number(i.quantity || i.qty || 1),
        }));
      if (matData.length > 0) {
        await prisma.order_items.createMany({ data: matData });
      }
    }

    // 3. Үйлчилгээний order_items хадгалах
    if (services.length > 0) {
      const svcData = services
        .filter((s: any) => s.service_id)
        .map((s: any) => ({
          order_id:   order.id,
          item_type:  'service',
          service_id: Number(s.service_id),
          qty:        Number(s.quantity || s.qty || 1),
          unit:       s.unit || '',
          unit_price: Number(s.unit_price || 0),
          subtotal:   Number(s.unit_price || 0) * Number(s.quantity || s.qty || 1),
        }));
      if (svcData.length > 0) {
        await prisma.order_items.createMany({ data: svcData });
      }
    }

    // 4. Анхны төлвийн түүх
    await prisma.order_status_history.create({
      data: {
        order_id:   order.id,
        old_status: null,
        new_status: 'pending',
        changed_by: req.user!.userId,
        note:       'Захиалга үүслээ',
      },
    });

    res.status(201).json({ ...order });
  } catch (err) {
    console.error('❌ createOrder алдаа:', err);
    res.status(500).json({ message: 'Захиалга үүсгэхэд алдаа гарлаа' });
  }
};

// ── Ажилтанд хуваарилах ──────────────────────────────────────────────────────
export const assignOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id }        = req.params;
    const { worker_id } = req.body;

    if (!worker_id) return res.status(400).json({ message: 'Ажилтан сонгоно уу' });

    const prev = await prisma.orders.findUnique({ where: { id: Number(id) } });
    if (!prev) return res.status(404).json({ message: 'Захиалга олдсонгүй' });

    const order = await prisma.orders.update({
      where: { id: Number(id) },
      data:  { assigned_to: Number(worker_id), status: 'assigned' },
    });

    await prisma.order_status_history.create({
      data: {
        order_id:   Number(id),
        old_status: prev.status,
        new_status: 'assigned',
        changed_by: req.user!.userId,
        note:       'Ажилтанд хуваарилагдлаа',
      },
    });

    res.json(order);
  } catch (err) {
    console.error('assignOrder:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Төлөв шинэчлэх ───────────────────────────────────────────────────────────
export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id }     = req.params;
    const { status, note } = req.body;

    const allowed = ['pending','confirmed','assigned','in_progress','done','cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Буруу төлөв' });
    }

    const prev = await prisma.orders.findUnique({ where: { id: Number(id) } });
    if (!prev) return res.status(404).json({ message: 'Захиалга олдсонгүй' });

    const order = await prisma.orders.update({
      where: { id: Number(id) },
      data: {
        status,
        ...(status === 'confirmed' ? { processed_by: req.user!.userId } : {}),
      },
    });

    await prisma.order_status_history.create({
      data: {
        order_id:   Number(id),
        old_status: prev.status,
        new_status: status,
        changed_by: req.user!.userId,
        note:       note || null,
      },
    });

    res.json(order);
  } catch (err) {
    console.error('updateStatus:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── Төлбөр нэмэх ─────────────────────────────────────────────────────────────
export const addPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { id }              = req.params;
    const { amount, method, status = 'pending' } = req.body;

    const payment = await prisma.payments.create({
      data: {
        order_id: Number(id),
        amount:   Number(amount),
        method:   method || 'cash',
        status,
        paid_at:  status === 'paid' ? new Date() : null,
      },
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error('addPayment:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};