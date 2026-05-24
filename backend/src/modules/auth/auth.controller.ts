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
const SELF_EDITABLE_FIELDS = ['first_name', 'last_name', 'phone'] as const;

const formatUser = (user: any) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  is_active: user.is_active,
  created_at: user.created_at,
});

const buildAssignableRoles = (role: string) =>
  role === 'super_admin' ? ['admin'] : ['accountant', 'order_processor', 'worker'];

export const register = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.users.create({
      data: { first_name, last_name, email, password_hash, phone },
    });

    return res.status(201).json({
      message: 'Registration completed',
      user: formatUser(user),
    });
  } catch (error) {
    console.error('register:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'This account is inactive' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('login:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (!reqUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const roleFilter = reqUser.role === 'super_admin' ? ['admin'] : ['accountant', 'order_processor', 'worker', 'customer'];
    const users = await prisma.users.findMany({
      where: {
        role: { in: roleFilter as any },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json(users.map(formatUser));
  } catch (error) {
    console.error('getUsers:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const getWorkers = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (!reqUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const roles = reqUser.role === 'super_admin' ? ['admin'] : ['accountant', 'order_processor', 'worker'];
    const users = await prisma.users.findMany({
      where: {
        role: { in: roles as any },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json(users.map(formatUser));
  } catch (error) {
    console.error('getWorkers:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email was not found' });
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
        subject: 'FurniCalc password reset code',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px">
            <div style="background:linear-gradient(135deg,#d97706,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:22px">FurniCalc</h1>
            </div>
            <div style="background:white;border-radius:12px;padding:24px">
              <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px">Password reset</h2>
              <p style="color:#64748b;font-size:14px;margin:0 0 20px">Use this one-time code:</p>
              <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
                <span style="font-size:36px;font-weight:800;color:#d97706;letter-spacing:0.15em">${otp}</span>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin:0">The code expires in 10 minutes.</p>
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('forgotPassword email:', mailError);
    }

    return res.json({ message: 'OTP has been sent to email' });
  } catch (error) {
    console.error('forgotPassword:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password_hash.startsWith('OTP:')) {
      return res.status(400).json({ message: 'OTP is invalid' });
    }

    const [, hash, ts] = user.password_hash.split(':');
    if (Date.now() - Number(ts) > 10 * 60 * 1000) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const valid = await bcrypt.compare(otp, hash);
    if (!valid) {
      return res.status(400).json({ message: 'OTP is incorrect' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({ where: { email }, data: { password_hash } });
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('resetPassword:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const reqUser = (req as any).user;

    if (!reqUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const allowedRoles = buildAssignableRoles(reqUser.role);
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role is not allowed for this account' });
    }

    const targetUser = await prisma.users.findUnique({ where: { id: Number(id) } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updated = await prisma.users.update({
      where: { id: Number(id) },
      data: { role },
    });

    return res.json({
      message: 'Role updated successfully',
      user: formatUser(updated),
    });
  } catch (error) {
    console.error('updateUserRole:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const createWorker = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, phone, role, password } = req.body;
    const reqUser = (req as any).user;

    if (!reqUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ message: 'First name, last name and email are required' });
    }

    const allowedRoles = buildAssignableRoles(reqUser.role);
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role is not allowed for this account' });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
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
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'FurniCalc login information',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <div style="background:linear-gradient(135deg,#d97706,#b45309);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:22px">FurniCalc</h1>
            </div>
            <h2 style="color:#0f172a">${last_name} ${first_name}</h2>
            <p style="color:#64748b">Your account was created successfully.</p>
            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b">Email:</p>
              <strong style="color:#0f172a">${email}</strong>
              <p style="margin:12px 0 8px;font-size:13px;color:#64748b">Temporary password:</p>
              <strong style="color:#d97706;font-size:18px;letter-spacing:0.05em">${rawPassword}</strong>
            </div>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('createWorker email:', mailError);
    }

    return res.status(201).json({
      message: `${last_name} ${first_name} was created successfully`,
      tempPassword: rawPassword,
      user: formatUser(newUser),
    });
  } catch (error) {
    console.error('createWorker:', error);
    return res.status(500).json({ message: 'System error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reqUser = (req as any).user;

    if (!reqUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetUser = await prisma.users.findUnique({ where: { id: Number(id) } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isSelf = reqUser.userId === Number(id);
    const canManageUsers = ['admin', 'super_admin'].includes(reqUser.role);
    if (!isSelf && !canManageUsers) {
      return res.status(403).json({ message: 'You do not have permission' });
    }

    const data: Record<string, any> = {};
    const { first_name, last_name, phone, is_active } = req.body;

    if (first_name !== undefined) data.first_name = first_name;
    if (last_name !== undefined) data.last_name = last_name;
    if (phone !== undefined) data.phone = phone;

    if (isSelf) {
      const requestedKeys = Object.keys(req.body);
      const hasUnsafeField = requestedKeys.some((key) => !SELF_EDITABLE_FIELDS.includes(key as (typeof SELF_EDITABLE_FIELDS)[number]));
      if (hasUnsafeField) {
        return res.status(403).json({ message: 'You can only edit your own profile fields' });
      }
    } else if (typeof is_active === 'boolean') {
      if (reqUser.role === 'super_admin' && targetUser.role !== 'admin') {
        return res.status(403).json({ message: 'Super admin can only manage admin accounts' });
      }

      if (reqUser.role === 'admin' && !['accountant', 'order_processor', 'worker', 'customer'].includes(targetUser.role)) {
        return res.status(403).json({ message: 'Admin can only manage worker and customer accounts' });
      }

      data.is_active = is_active;
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No valid fields were provided' });
    }

    const updated = await prisma.users.update({
      where: { id: Number(id) },
      data,
    });

    return res.json({
      message: typeof is_active === 'boolean' && !isSelf
        ? is_active ? 'User activated successfully' : 'User deactivated successfully'
        : 'Profile updated successfully',
      user: formatUser(updated),
    });
  } catch (error) {
    console.error('updateUser:', error);
    return res.status(500).json({ message: 'System error' });
  }
};
