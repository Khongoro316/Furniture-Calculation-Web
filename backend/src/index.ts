import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import materialRoutes from './modules/material/material.routes';
import serviceRoutes from './modules/service/service.routes';
import furnitureRoutes from './modules/furniture/furniture.routes';
import calculationRoutes from './modules/calculation/calculation.routes';
import orderRoutes from './modules/order/order.routes';
import reportRoutes from './modules/report/report.routes';
import organizationRoutes from './modules/organization/organization.routes';
import { auditLog } from './middleware/auditLog';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(auditLog);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/furniture-types', furnitureRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/organizations', organizationRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Тавилгын тооцооны систем API ажиллаж байна' });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} порт дээр ажиллаж байна`);
});