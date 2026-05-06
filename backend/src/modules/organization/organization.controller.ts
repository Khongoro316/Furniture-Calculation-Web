import { Request, Response } from 'express';
import prismaClient from '../../prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const prisma = prismaClient as any;

const generatePassword = () => Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

const sendWelcomeEmail = async (email: string, orgName: string, firstName: string, lastName: string, password: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: `FurniCalc - ${orgName} байгууллагын нэвтрэх мэдээлэл`,
    html: `<p>${lastName} ${firstName} танд тавтай морилно уу!</p><p>Байгууллага: <b>${orgName}</b></p><p>Нэвтрэх имэйл: <b>${email}</b></p><p>Нууц үг: <b>${password}</b></p>`,
  });
};

// ── PUBLIC: Нүүр хуудасны байгууллагууд ──────────────────────────────────────
export const getPublicOrgs = async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organizations.findMany({
      where: { is_active: true },
      select: {
        id: true, name: true, address: true, phone: true, image_url: true,
        _count: { select: { materials: { where: { is_active: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(orgs);
  } catch (err) {
    console.error('getPublicOrgs:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── PUBLIC: Байгууллагын материалууд ─────────────────────────────────────────
export const getOrgMaterials = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type_id } = req.query;

    const org = await prisma.organizations.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, image_url: true, address: true, phone: true },
    });
    if (!org) return res.status(404).json({ message: 'Байгууллага олдсонгүй' });

    const materials = await prisma.materials.findMany({
      where: { org_id: Number(id), is_active: true, ...(type_id ? { type_id: Number(type_id) } : {}) },
      include: {
        material_types: { include: { material_categories: true } },
        material_images: { orderBy: { sort_order: 'asc' } },
      },
    });

    const categories = await prisma.material_categories.findMany({
      where: { is_active: true },
      include: {
        material_types: {
          where: { is_active: true },
          include: { _count: { select: { materials: { where: { org_id: Number(id), is_active: true } } } } },
        },
      },
    });

    res.json({ org, materials, categories });
  } catch (err) {
    console.error('getOrgMaterials:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

// ── ADMIN: Бүх байгууллага ───────────────────────────────────────────────────
export const getAll = async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organizations.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          where: { role: 'admin' },
          select: { id: true, first_name: true, last_name: true, email: true, is_active: true },
        },
      },
    });
    res.json(orgs);
  } catch { res.status(500).json({ message: 'Системийн алдаа гарлаа' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, phone, address, admin_first_name, admin_last_name, admin_email } = req.body;
    if (!name) return res.status(400).json({ message: 'Байгууллагын нэр шаардлагатай' });

    let image_url: string | null = null;
    if (req.file) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
      image_url = `${BASE_URL}/uploads/organizations/${req.file.filename}`;
    }

    const org = await prisma.organizations.create({ data: { name, phone, address, image_url } });

    let adminUser = null;
    if (admin_email && admin_first_name && admin_last_name) {
      const existing = await prisma.users.findUnique({ where: { email: admin_email } });
      if (existing) return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
      const tempPassword = generatePassword();
      const password_hash = await bcrypt.hash(tempPassword, 12);
      adminUser = await prisma.users.create({
        data: { org_id: org.id, first_name: admin_first_name, last_name: admin_last_name, email: admin_email, password_hash, role: 'admin' },
      });
      try { await sendWelcomeEmail(admin_email, name, admin_first_name, admin_last_name, tempPassword); } catch {}
    }

    res.status(201).json({
      organization: org,
      admin: adminUser ? { id: adminUser.id, email: adminUser.email } : null,
      message: adminUser ? `Байгууллага үүсгэгдлээ. Мэдээлэл ${admin_email} руу илгээгдлээ.` : 'Байгууллага амжилттай үүсгэгдлээ.',
    });
  } catch (err: any) {
    console.error('create org:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа: ' + err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: any = {};
    const { name, phone, address, is_active } = req.body;
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;
    if (is_active !== undefined) data.is_active = is_active === 'true' || is_active === true;
    if (req.file) {
      const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
      data.image_url = `${BASE_URL}/uploads/organizations/${req.file.filename}`;
    }
    const org = await prisma.organizations.update({ where: { id: Number(id) }, data });
    res.json(org);
  } catch (err) {
    console.error('update org:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const [orgCount, userCount, ftCount, calcCount] = await Promise.all([
      prisma.organizations.count({ where: { is_active: true } }),
      prisma.users.count({ where: { is_active: true } }),
      prisma.furniture_types.count({ where: { is_active: true } }),
      prisma.calculations.count(),
    ]);
    res.json({ organizations: orgCount, users: userCount, furniture_types: ftCount, calculations: calcCount });
  } catch { res.status(500).json({ message: 'Алдаа гарлаа' }); }
};

export const getOrgUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const users = await (prisma as any).users.findMany({
      where: {
        org_id: Number(id),
        role: { not: 'customer' },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        phone: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('getOrgUsers:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};