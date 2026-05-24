import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notification.service';

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit || 15);
    const data = await listNotifications(req.user!.userId, limit);
    res.json(data);
  } catch (error) {
    console.error('getMyNotifications:', error);
    res.status(500).json({ message: 'Мэдэгдэл авахад алдаа гарлаа' });
  }
};

export const readNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = Number(req.params.id);
    const success = await markNotificationAsRead(notificationId, req.user!.userId);

    if (!success) {
      return res.status(404).json({ message: 'Мэдэгдэл олдсонгүй' });
    }

    res.json({ message: 'Мэдэгдлийг уншсанд тэмдэглэлээ' });
  } catch (error) {
    console.error('readNotification:', error);
    res.status(500).json({ message: 'Мэдэгдэл шинэчлэхэд алдаа гарлаа' });
  }
};

export const readAllNotifications = async (req: AuthRequest, res: Response) => {
  try {
    await markAllNotificationsAsRead(req.user!.userId);
    res.json({ message: 'Бүх мэдэгдлийг уншсанд тэмдэглэлээ' });
  } catch (error) {
    console.error('readAllNotifications:', error);
    res.status(500).json({ message: 'Мэдэгдлүүдийг шинэчлэхэд алдаа гарлаа' });
  }
};
