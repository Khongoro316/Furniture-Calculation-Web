import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const rbac = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role) {
      res.status(401).json({ message: 'Нэвтрээгүй байна' });
      return;
    }

    if (!allowedRoles.includes(role)) {
      res.status(403).json({ message: 'Танд энэ үйлдлийг хийх эрх байхгүй' });
      return;
    }

    next();
  };
};