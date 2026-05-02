import { Request, Response } from 'express';
import prisma from '../../prisma';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length: 10 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const sendWelcomeEmail = async (
  email: string,
  orgName: string,
  firstName: string,
  lastName: string,
  password: string
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `FurniCalc — ${orgName} байгууллагын нэвтрэх мэдээлэл`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px">
        <div style="background:linear-gradient(135deg,#d97706,#8b5cf6);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <h1 style="color:white;margin:0;font-size:22px">🪑 FurniCalc</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">Тавилгын тооцооны систем</p>
        </div>
        <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 8px">Тавтай морилно уу, ${lastName} ${firstName}!</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 20px">${orgName} байгууллагын Админ эрхээр бүртгэгдлээ.</p>
          <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin-bottom:20px">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Нэвтрэх мэдээлэл</p>
            <div style="margin-bottom:8px">
              <span style="font-size:12px;color:#64748b">Имэйл:</span>
              <span style="font-size:14px;font-weight:700;color:#0f172a;margin-left:8px">${email}</span>
            </div>
            <div>
              <span style="font-size:12px;color:#64748b">Нууц үг:</span>
              <span style="font-size:18px;font-weight:700;color:#d97706;margin-left:8px;letter-spacing:0.08em">${password}</span>
            </div>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login"
            style="display:block;background:#d97706;color:white;text-align:center;padding:12px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Системд нэвтрэх →
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
          Нэвтэрсний дараа нууц үгээ өөрчлөхийг зөвлөж байна.
        </p>
      </div>
    `,
  });
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organizations.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          where: { role: 'admin' },
          select: { id: true, first_name: true, last_name: true, email: true, is_active: true }
        }
      }
    });
    res.json(orgs);
  } catch {
    res.status(500).json({ message: 'Системийн алдаа гарлаа' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, phone, address, admin_first_name, admin_last_name, admin_email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Байгууллагын нэр шаардлагатай' });
    }

    // Байгууллага үүсгэнэ
    const org = await prisma.organizations.create({
      data: { name, phone, address }
    });

    let adminUser = null;

    // Хэрэв админы мэдээлэл өгсөн бол
    if (admin_email && admin_first_name && admin_last_name) {
      const existing = await prisma.users.findUnique({ where: { email: admin_email } });
      if (existing) {
        return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
      }

      const tempPassword = generatePassword();
      const password_hash = await bcrypt.hash(tempPassword, 12);

      adminUser = await prisma.users.create({
        data: {
          org_id: org.id,
          first_name: admin_first_name,
          last_name: admin_last_name,
          email: admin_email,
          password_hash,
          role: 'admin',
        }
      });

      // Email явуулна
      try {
        await sendWelcomeEmail(admin_email, name, admin_first_name, admin_last_name, tempPassword);
      } catch (emailErr) {
        console.error('Email илгээхэд алдаа гарлаа:', emailErr);
      }
    }

    res.status(201).json({
      organization: org,
      admin: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        name: `${adminUser.last_name} ${adminUser.first_name}`
      } : null,
      message: adminUser
        ? `Байгууллага үүсгэгдлээ. Админы нэвтрэх мэдээлэл ${admin_email} хаяг руу илгээгдлээ.`
        : 'Байгууллага амжилттай үүсгэгдлээ.'
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Системийн алдаа гарлаа: ' + err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = await prisma.organizations.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(org);
  } catch {
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
  } catch {
    res.status(500).json({ message: 'Алдаа гарлаа' });
  }
};