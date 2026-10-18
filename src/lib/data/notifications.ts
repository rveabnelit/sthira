import { all, one, run } from "@/lib/db";
import type { Notification } from "@/lib/types";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function listNotifications(userId: string, limit = 30): Notification[] {
  return all<NotificationRow>(
    "SELECT id, type, title, body, href, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    userId,
    limit,
  ).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

export function unreadNotificationCount(userId: string): number {
  return Number(
    one<{ c: number }>("SELECT count(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL", userId)?.c ?? 0,
  );
}

export function markNotificationRead(userId: string, notificationId: string) {
  run(
    "UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL",
    new Date().toISOString(),
    notificationId,
    userId,
  );
}

export function markAllNotificationsRead(userId: string) {
  run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", new Date().toISOString(), userId);
}
