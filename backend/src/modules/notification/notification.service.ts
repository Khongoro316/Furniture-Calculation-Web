import prismaClient from '../../prisma';

const prisma = prismaClient as any;

let notificationsTableReady = false;

const ensureNotificationsTable = async () => {
  if (notificationsTableReady) {
    return;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      title VARCHAR(191) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      related_type VARCHAR(50) NULL,
      related_id INT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      read_at DATETIME(3) NULL,
      PRIMARY KEY (id),
      KEY idx_notifications_user_read_created (user_id, is_read, created_at),
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  notificationsTableReady = true;
};

export type NotificationPayload = {
  userId: number;
  title: string;
  message: string;
  type?: string;
  relatedType?: string | null;
  relatedId?: number | null;
};

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  relatedType = null,
  relatedId = null,
}: NotificationPayload) => {
  await ensureNotificationsTable();

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO notifications (user_id, title, message, type, related_type, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    userId,
    title,
    message,
    type,
    relatedType,
    relatedId
  );
};

export const createRoleNotifications = async ({
  role,
  title,
  message,
  type = 'info',
  relatedType = null,
  relatedId = null,
}: {
  role: string;
  title: string;
  message: string;
  type?: string;
  relatedType?: string | null;
  relatedId?: number | null;
}) => {
  const users = await prisma.users.findMany({
    where: {
      role,
      is_active: true,
    },
    select: {
      id: true,
    },
  });

  for (const user of users) {
    await createNotification({
      userId: Number(user.id),
      title,
      message,
      type,
      relatedType,
      relatedId,
    });
  }
};

export const listNotifications = async (userId: number, limit = 15) => {
  await ensureNotificationsTable();

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const items = await prisma.$queryRawUnsafe(
    `
      SELECT id, user_id, title, message, type, related_type, related_id, is_read, created_at, read_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY is_read ASC, created_at DESC
      LIMIT ?
    `,
    userId,
    safeLimit
  );

  const unreadRows = await prisma.$queryRawUnsafe(
    `
      SELECT COUNT(*) AS unreadCount
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `,
    userId
  );

  const unreadCount = Number((unreadRows as any[])[0]?.unreadCount || 0);

  return {
    items,
    unreadCount,
  };
};

export const markNotificationAsRead = async (notificationId: number, userId: number) => {
  await ensureNotificationsTable();

  const result = await prisma.$executeRawUnsafe(
    `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND user_id = ?
    `,
    notificationId,
    userId
  );

  return Number(result) > 0;
};

export const markAllNotificationsAsRead = async (userId: number) => {
  await ensureNotificationsTable();

  await prisma.$executeRawUnsafe(
    `
      UPDATE notifications
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP(3)
      WHERE user_id = ? AND is_read = FALSE
    `,
    userId
  );
};
