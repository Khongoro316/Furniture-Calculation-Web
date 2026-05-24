import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import prisma from '../../prisma';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const WORKER_ROLES = ['admin', 'accountant', 'order_processor', 'worker'] as const;
const ASSIGNABLE_ROLES = ['admin', 'accountant', 'order_processor', 'worker'] as const;

export const register = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.users.create({
      data: { first_name, last_name, email, password_hash, phone },
    });

    res.status(201).json({ message: 'Амжилттай бүртгэгдлээ', userId: user.id });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Имэйл эсвэл нууц үг буруу байна' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Имэйл эсвэл нууц үг буруу байна' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getWorkers = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;

    if (!reqUser) {
      return res.status(401).json({ message: 'Нэвтрээгүй байна' });
    }

    const roles =
      reqUser.role === 'super_admin'
        ? ['admin']
        : ['accountant', 'order_processor', 'worker'];

    const users = await prisma.users.findMany({
  where: {
    role: reqUser.role === 'super_admin'
      ? 'admin'
      : {
          in: ['accountant', 'order_processor', 'worker'] as any,
        },
  } as any,
  select: {
    id: true,
    first_name: true,
    last_name: true,
    email: true,
    phone: true,
    role: true,
    is_active: true,
    created_at: true,
  },
  orderBy: {
    created_at: 'desc',
  },
});

    return res.json(users);
  } catch (error) {
    console.error('getWorkers алдаа:', error);
    return res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Энэ имэйл бүртгэлтэй байхгүй байна' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);

    await prisma.users.update({
      where: { email },
      data: { password_hash: `OTP:${hash}:${Date.now()}` },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'FurniCalc - Нууц үг сэргээх OTP',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px">
            <div style="background:linear-gradient(135deg,#d97706,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:22px">FurniCalc</h1>
            </div>
            <div style="background:white;border-radius:12px;padding:24px">
              <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px">Нууц үг сэргээх</h2>
              <p style="color:#64748b;font-size:14px;margin:0 0 20px">Таны нэг удаагийн нууц үг:</p>
              <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
                <span style="font-size:36px;font-weight:800;color:#d97706;letter-spacing:0.15em">${otp}</span>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin:0">Энэ код 10 минутын хугацаатай.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.error('Email error:', e);
    }

    res.json({ message: 'OTP код имэйл хаяг руу илгээгдлээ' });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password_hash.startsWith('OTP:')) {
      return res.status(400).json({ message: 'OTP хүчинтэй биш байна' });
    }

    const [, hash, ts] = user.password_hash.split(':');
    if (Date.now() - Number(ts) > 10 * 60 * 1000) {
      return res.status(400).json({ message: 'OTP хугацаа дууссан байна' });
    }

    const valid = await bcrypt.compare(otp, hash);
    if (!valid) {
      return res.status(400).json({ message: 'OTP буруу байна' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({ where: { email }, data: { password_hash } });
    res.json({ message: 'Нууц үг амжилттай солигдлоо' });
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Зөвшөөрөгдөөгүй эрх' });
    }

    const targetUser = await prisma.users.findUnique({
      where: { id: Number(id) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    const updated = await prisma.users.update({
      where: { id: Number(id) },
      data: { role },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
      },
    });

    res.json({ message: 'Эрх амжилттай шинэчлэгдлээ', user: updated });
  } catch (err) {
    console.error('updateUserRole:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const createWorker = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, phone, role, password } = req.body;
    const reqUser = (req as any).user;

    if (!reqUser) {
      return res.status(401).json({ message: 'Нэвтрээгүй байна' });
    }

    const allowedRoles =
      reqUser.role === 'super_admin'
        ? ['admin']
        : ['accountant', 'order_processor', 'worker'];

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: 'Овог, нэр, имэйл заавал шаардлагатай' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message:
          reqUser.role === 'super_admin'
            ? 'Супер админ зөвхөн админ бүртгэх боломжтой'
            : 'Админ зөвхөн нягтлан, захиалга боловсруулагч, ажилтан бүртгэх боломжтой',
      });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
    }

    const rawPassword = password || `${Math.random().toString(36).slice(-8)}A1!`;
    const password_hash = await bcrypt.hash(rawPassword, 12);

    const newUser = await prisma.users.create({
      data: {
        first_name,
        last_name,
        email,
        phone: phone || null,
        password_hash,
        role,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    try {
      const roleLabels: Record<string, string> = {
        admin: 'Админ',
        accountant: 'Нягтлан',
        order_processor: 'Захиалга боловсруулагч',
        worker: 'Ажилтан',
      };

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'FurniCalc - Таны нэвтрэх мэдээлэл',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <div style="background:linear-gradient(135deg,#d97706,#b45309);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:22px">FurniCalc</h1>
            </div>
            <h2 style="color:#0f172a">${last_name} ${first_name}</h2>
            <p style="color:#64748b">Таны бүртгэл амжилттай үүслээ.</p>
            <p style="color:#64748b">Эрх: <strong>${roleLabels[role] || role}</strong></p>
            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b">Нэвтрэх имэйл:</p>
              <strong style="color:#0f172a">${email}</strong>
              <p style="margin:12px 0 8px;font-size:13px;color:#64748b">Нууц үг:</p>
              <strong style="color:#d97706;font-size:18px;letter-spacing:0.05em">${rawPassword}</strong>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email алдаа:', emailErr);
    }

    res.status(201).json({
      user: newUser,
      message: `${last_name} ${first_name} амжилттай бүртгэгдлээ.`,
      tempPassword: rawPassword,
    });
  } catch (err) {
    console.error('createWorker алдаа:', err);
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const reqUser = (req as any).user;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'Төлөв буруу байна' });
    }

    const targetUser = await (prisma as any).users.findUnique({
      where: { id: Number(id) },
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    if (reqUser.role === 'super_admin' && targetUser.role !== 'admin') {
      return res.status(403).json({
        message: 'Супер админ зөвхөн админ хэрэглэгчийн төлөв өөрчилнө',
      });
    }

    if (reqUser.role === 'admin' && !['accountant', 'order_processor', 'worker'].includes(targetUser.role)) {
      return res.status(403).json({
        message: 'Админ зөвхөн ажилтны төлөв өөрчилнө',
      });
    }

    const updated = await (prisma as any).users.update({
      where: { id: Number(id) },
      data: { is_active },
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
    });

    return res.json({
      message: is_active ? 'Хэрэглэгч идэвхжлээ' : 'Хэрэглэгч зогсоогдлоо',
      user: updated,
    });
  } catch (err) {
    console.error('updateUserStatus:', err);
    return res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};