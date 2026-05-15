import { Request, Response } from 'express';
import prisma from '../../prisma';
import ExcelJS from 'exceljs';

export const ordersReport = async (req: Request, res: Response) => {
  try {
    const { from, to, status } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from as string);
      if (to)   where.created_at.lte = new Date(to as string);
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
        users_orders_user_idTousers: {
          select: { first_name: true, last_name: true }
        },
        calculations: { include: { furniture_types: true } },
        payments: true
      },
      orderBy: { created_at: 'desc' }
    });

    const report = orders.map(o => ({
      order_no:      o.order_no,
      customer:      `${o.users_orders_user_idTousers.last_name} ${o.users_orders_user_idTousers.first_name}`,
      furniture:     o.calculations?.furniture_types?.name || '-',
      total_amount:  Number(o.total_amount),
      status:        o.status,
      pay_status:    o.payments[0]?.status || 'unpaid',
      created_at:    o.created_at
    }));

    res.json({ total: report.length, data: report });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const financeReport = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const where: any = { status: 'paid' };
    if (from || to) {
      where.paid_at = {};
      if (from) where.paid_at.gte = new Date(from as string);
      if (to)   where.paid_at.lte = new Date(to as string);
    }

    const payments = await prisma.payments.findMany({
      where,
      include: {
        orders: {
          include: {
            users_orders_user_idTousers: {
              select: { first_name: true, last_name: true }
            }
          }
        }
      },
      orderBy: { paid_at: 'desc' }
    });

    const total = payments.reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      total_income: total,
      count: payments.length,
      data: payments.map(p => ({
        order_no:  p.orders.order_no,
        customer:  `${p.orders.users_orders_user_idTousers.last_name} ${p.orders.users_orders_user_idTousers.first_name}`,
        amount:    Number(p.amount),
        method:    p.method,
        paid_at:   p.paid_at
      }))
    });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const materialsReport = async (req: Request, res: Response) => {
  try {
    const materials = await prisma.materials.findMany({
      where: { is_active: true },
      include: {
        material_types: {
          include: { material_categories: true }
        }
      },
      orderBy: { stock: 'asc' }
    });

    res.json({
      total: materials.length,
      data: materials.map(m => ({
        code:     m.code,
        name:     m.name,
        category: m.material_types.material_categories.name,
        type:     m.material_types.name,
        unit:     m.unit,
        price:    Number(m.price),
        stock:    Number(m.stock)
      }))
    });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const calculationsReport = async (req: Request, res: Response) => {
  try {
    const calculations = await prisma.calculations.findMany({
      where: { is_saved: true },
      include: {
        users: { select: { first_name: true, last_name: true } },
        furniture_types: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      total: calculations.length,
      data: calculations.map(c => ({
        id:            c.id,
        customer:      `${c.users.last_name} ${c.users.first_name}`,
        furniture:     c.furniture_types.name,
        total_area:    Number(c.total_area),
        total_cost:    Number(c.total_cost),
        created_at:    c.created_at
      }))
    });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const workersReport = async (req: Request, res: Response) => {
  try {
    const workers = await prisma.users.findMany({
      where: { role: 'worker' },
      include: {
        orders_orders_assigned_toTousers: {
          select: { id: true, status: true }
        }
      }
    });

    res.json({
      total: workers.length,
      data: workers.map(w => {
        const orders = w.orders_orders_assigned_toTousers;
        return {
          name:       `${w.last_name} ${w.first_name}`,
          email:      w.email,
          total:      orders.length,
          done:       orders.filter(o => o.status === 'done').length,
          in_progress:orders.filter(o => o.status === 'in_progress').length,
          pending:    orders.filter(o => o.status === 'pending').length
        };
      })
    });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        users_orders_user_idTousers: {
          select: { first_name: true, last_name: true }
        },
        payments: true
      },
      orderBy: { created_at: 'desc' }
    });

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Захиалгын тайлан');

    worksheet.columns = [
      { header: 'Захиалгын дугаар', key: 'order_no',     width: 22 },
      { header: 'Хэрэглэгч',        key: 'customer',     width: 24 },
      { header: 'Нийт дүн',          key: 'total_amount', width: 14 },
      { header: 'Төлөв',             key: 'status',       width: 14 },
      { header: 'Төлбөрийн төлөв',   key: 'pay_status',   width: 16 },
      { header: 'Огноо',             key: 'created_at',   width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };

    orders.forEach(o => {
      worksheet.addRow({
        order_no:     o.order_no,
        customer:     `${o.users_orders_user_idTousers.last_name} ${o.users_orders_user_idTousers.first_name}`,
        total_amount: Number(o.total_amount),
        status:       o.status,
        pay_status:   o.payments[0]?.status || 'unpaid',
        created_at:   o.created_at?.toISOString().slice(0, 10)
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// report.controller.ts дотор getAuditLogs функцийг СОЛИХ

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { from, to, limit = '200' } = req.query;
    const db = prisma as any;

    const where: any = {};
    if (from || to) {
      where.created_at = {};
      if (from) where.created_at.gte = new Date(from as string);
      if (to) {
        const d = new Date(to as string);
        d.setHours(23, 59, 59, 999);
        where.created_at.lte = d;
      }
    }

    const logs = await db.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: Math.min(Number(limit) || 200, 500),
      include: {
        users: {
          select: { first_name: true, last_name: true, role: true },
        },
      },
    });

    // BigInt → Number хөрвүүлэх
    const serialized = logs.map((log: any) => ({
      ...log,
      id:        Number(log.id),
      user_id:   log.user_id ? Number(log.user_id) : null,
      record_id: log.record_id ? Number(log.record_id) : null,
    }));

    res.json(serialized);
  } catch (err: any) {
    console.error('getAuditLogs алдаа:', err?.message);
    res.json([]);
  }
};