import { Response, NextFunction } from 'express';
import prismaClient from '../prisma';
import { AuthRequest } from './auth';
 
const prisma = prismaClient as any;
 
// Үйлдэл → action маппинг
const METHOD_ACTION: Record<string, string> = {
  POST:   'CREATE',
  PUT:    'UPDATE',
  PATCH:  'UPDATE',
  DELETE: 'DELETE',
};
 
// Хаяг → хүснэгт маппинг
const PATH_TABLE: Record<string, string> = {
  '/api/orders':          'orders',
  '/api/materials':       'materials',
  '/api/auth':            'users',
  '/api/organizations':   'organizations',
  '/api/calculations':    'calculations',
  '/api/services':        'services',
  '/api/furniture-types': 'furniture_types',
};
 
const getTable = (path: string): string | null => {
  for (const [key, val] of Object.entries(PATH_TABLE)) {
    if (path.startsWith(key)) return val;
  }
  return null;
};
 
export const auditLog = (req: AuthRequest, res: Response, next: NextFunction) => {
  const action = METHOD_ACTION[req.method];
  if (!action) { next(); return; } // GET хүсэлт бүртгэхгүй
 
  const table = getTable(req.path);
  if (!table) { next(); return; }
 
  // Response дуусахад лог бүртгэх
  const oldEnd = res.end.bind(res);
  res.end = function (...args: any[]) {
    // 2xx амжилттай бол л бүртгэх
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.userId) {
      prisma.audit_logs.create({
        data: {
          user_id:    req.user.userId,
          action,
          table_name: table,
          record_id:  Number(req.params?.id) || null,
          ip_address: req.ip || req.headers['x-forwarded-for'] || null,
        },
      }).catch((err: any) => console.error('Audit log алдаа:', err));
    }
    return oldEnd(...args);
  };
 
  next();
};