import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token is missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: number;
      role: string;
    };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, is_active: true },
    });

    if (!user || !user.is_active) {
      res.status(401).json({ message: 'This account is inactive' });
      return;
    }

    req.user = {
      userId: user.id,
      role: user.role,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
