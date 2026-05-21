"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrgUsers = exports.createWorker = exports.updateUserRole = exports.resetPassword = exports.forgotPassword = exports.getWorkers = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../prisma"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const register = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;
        const existing = await prisma_1.default.users.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
        }
        const password_hash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.default.users.create({
            data: { first_name, last_name, email, password_hash, phone }
        });
        res.status(201).json({ message: 'Амжилттай бүртгэгдлээ', userId: user.id });
    }
    catch (error) {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.users.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Имэйл эсвэл нууц үг буруу байна' });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ message: 'Имэйл эсвэл нууц үг буруу байна' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, org_id: user.org_id }, // ← org_id нэмэх
        process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                org_id: user.org_id, // ← ЭНЭ МӨРИЙГ НЭМ
                phone: user.phone,
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.login = login;
const getWorkers = async (req, res) => {
    try {
        const reqUser = req.user;
        // org_id байхгүй бол бүх ажилтнуудыг буцаах
        const whereClause = {
            role: { in: ['admin', 'accountant', 'order_processor', 'worker'] },
            is_active: true,
        };
        // org_id байвал тухайн байгууллагаар шүүх
        if (reqUser.org_id) {
            whereClause.org_id = reqUser.org_id;
        }
        const workers = await prisma_1.default.users.findMany({
            where: whereClause,
            select: {
                id: true, first_name: true, last_name: true,
                email: true, role: true, phone: true,
                is_active: true, created_at: true,
            },
            orderBy: { created_at: 'desc' },
        });
        res.json(workers);
    }
    catch (err) {
        console.error('getWorkers:', err);
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getWorkers = getWorkers;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma_1.default.users.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Энэ имэйл бүртгэлтэй байхгүй байна' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = await bcryptjs_1.default.hash(otp, 10);
        // OTP-г password_hash дотор түр хадгална — production-д тусдаа хүснэгт хэрэгтэй
        await prisma_1.default.users.update({
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
        }
        catch (e) {
            console.error('Email error:', e);
        }
        res.json({ message: 'OTP код имэйл хаяг руу илгээгдлээ' });
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await prisma_1.default.users.findUnique({ where: { email } });
        if (!user || !user.password_hash.startsWith('OTP:')) {
            return res.status(400).json({ message: 'OTP хүчингүй байна' });
        }
        const [, hash, ts] = user.password_hash.split(':');
        if (Date.now() - Number(ts) > 10 * 60 * 1000) {
            return res.status(400).json({ message: 'OTP хугацаа дууссан байна' });
        }
        const valid = await bcryptjs_1.default.compare(otp, hash);
        if (!valid) {
            return res.status(400).json({ message: 'OTP буруу байна' });
        }
        const password_hash = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.default.users.update({ where: { email }, data: { password_hash } });
        res.json({ message: 'Нууц үг амжилттай солигдлоо' });
    }
    catch {
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.resetPassword = resetPassword;
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const reqUser = req.user;
        const allowedRoles = ['accountant', 'order_processor', 'worker'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Зөвшөөрөгдөөгүй эрх' });
        }
        // Хэрэглэгч байгааг шалгах
        const targetUser = await prisma_1.default.users.findUnique({
            where: { id: Number(id) },
        });
        if (!targetUser) {
            return res.status(404).json({ message: 'Хэрэглэгч олдсонгүй' });
        }
        const updated = await prisma_1.default.users.update({
            where: { id: Number(id) },
            data: { role },
            select: { id: true, first_name: true, last_name: true, email: true, role: true },
        });
        res.json({ message: 'Эрх амжилттай шинэчлэгдлээ', user: updated });
    }
    catch (err) {
        console.error('updateUserRole:', err);
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.updateUserRole = updateUserRole;
// Админ ажилтан бүртгэх (org_id автоматаар авна)
const createWorker = async (req, res) => {
    try {
        const reqUser = req.user;
        const { first_name, last_name, email, phone, role, password } = req.body;
        console.log('📥 createWorker:', { first_name, last_name, email, role, org_id: reqUser.org_id });
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ message: 'Овог, нэр, имэйл заавал шаардлагатай' });
        }
        const allowedRoles = ['accountant', 'order_processor', 'worker'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Зөвшөөрөгдөөгүй эрх. Зөвхөн: нягтлан, захиалга боловсруулагч, ажилтан' });
        }
        if (!reqUser.org_id) {
            return res.status(400).json({ message: 'Таны бүртгэлд байгууллага холбогдоогүй байна' });
        }
        const existing = await prisma_1.default.users.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Энэ имэйл бүртгэлтэй байна' });
        }
        // Нууц үг — өгсөн бол ашиглах, үгүй бол автомат үүсгэх
        const rawPassword = password || Math.random().toString(36).slice(-8) + 'A1!';
        const password_hash = await bcryptjs_1.default.hash(rawPassword, 12);
        const newUser = await prisma_1.default.users.create({
            data: {
                org_id: reqUser.org_id,
                first_name,
                last_name,
                email,
                phone: phone || null,
                password_hash,
                role,
            },
            select: {
                id: true, first_name: true, last_name: true,
                email: true, role: true, is_active: true, created_at: true,
            },
        });
        // Welcome email
        try {
            const transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            const ROLE_LABELS = {
                accountant: 'Нягтлан', order_processor: 'Захиалга боловсруулагч', worker: 'Ажилтан',
            };
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'FurniCalc — Таны нэвтрэх мэдээлэл',
                html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <div style="background:linear-gradient(135deg,#d97706,#b45309);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <h1 style="color:white;margin:0;font-size:22px">🪑 FurniCalc</h1>
            </div>
            <h2 style="color:#0f172a">Тавтай морил, ${last_name} ${first_name}!</h2>
            <p style="color:#64748b">Таны бүртгэл амжилттай үүсгэгдлээ.</p>
            <p style="color:#64748b">Эрх: <strong>${ROLE_LABELS[role] || role}</strong></p>
            <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b">Нэвтрэх имэйл:</p>
              <strong style="color:#0f172a">${email}</strong>
              <p style="margin:12px 0 8px;font-size:13px;color:#64748b">Нууц үг:</p>
              <strong style="color:#d97706;font-size:18px;letter-spacing:0.05em">${rawPassword}</strong>
            </div>
            <p style="color:#94a3b8;font-size:12px">Нэвтэрсний дараа нууц үгээ солиорой.</p>
          </div>
        `,
            });
        }
        catch (emailErr) {
            console.error('Email алдаа:', emailErr);
        }
        res.status(201).json({
            user: newUser,
            message: `${last_name} ${first_name} амжилттай бүртгэгдлээ. Нэвтрэх мэдээлэл ${email} руу илгээгдлээ.`,
            tempPassword: rawPassword,
        });
    }
    catch (err) {
        console.error('❌ createWorker алдаа:', err);
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.createWorker = createWorker;
// Байгууллагын хэрэглэгчдийн жагсаалт
const getOrgUsers = async (req, res) => {
    try {
        const reqUser = req.user;
        const users = await prisma_1.default.users.findMany({
            where: {
                org_id: reqUser.org_id,
                role: { in: ['admin', 'accountant', 'order_processor', 'worker'] },
            },
            select: {
                id: true, first_name: true, last_name: true,
                email: true, role: true, phone: true,
                is_active: true, created_at: true,
            },
            orderBy: { created_at: 'desc' },
        });
        res.json(users);
    }
    catch (err) {
        console.error('getOrgUsers:', err);
        res.status(500).json({ message: 'Системийн алдаа гарлаа' });
    }
};
exports.getOrgUsers = getOrgUsers;
