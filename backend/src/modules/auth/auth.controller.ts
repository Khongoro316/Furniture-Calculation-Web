import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export const register = async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: { first_name, last_name, email, password_hash, phone }
    });

    res.status(201).json({ message: 'Амжилттай бүртгэгдлээ', userId: user.id });
  } catch (error) {
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
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const getWorkers = async (req: Request, res: Response) => {
  try {
    const workers = await prisma.users.findMany({
      where: { role: 'worker', is_active: true },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true
      }
    });
    res.json(workers);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
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
    // OTP-г password_hash дотор түр хадгална — production-д тусдаа хүснэгт хэрэгтэй
    await prisma.users.update({
      where: { email },
      data: { password_hash: `OTP:${hash}:${Date.now()}` }
    });
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'FurniCalc — Нууц үг сэргээх OTP',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px">
            <div style="background:linear-gradient(135deg,#d97706,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:22px">🪑 FurniCalc</h1>
            </div>
            <div style="background:white;border-radius:12px;padding:24px">
              <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px">Нууц үг сэргээх</h2>
              <p style="color:#64748b;font-size:14px;margin:0 0 20px">Таны нэг удаагийн нууц үг:</p>
              <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
                <span style="font-size:36px;font-weight:800;color:#d97706;letter-spacing:0.15em">${otp}</span>
              </div>
              <p style="color:#94a3b8;font-size:12px;margin:0">Энэ код 10 минутын хугацаатай. Бусдад дамжуулахгүй байна уу.</p>
            </div>
          </div>
        `
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
      return res.status(400).json({ message: 'OTP хүчингүй байна' });
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