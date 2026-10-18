import { ok, requireApiUser } from "@/lib/api";
import { listNotifications, unreadNotificationCount, markAllNotificationsRead } from "@/lib/data/notifications";

export async function GET() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  return ok({ notifications: listNotifications(auth.user.id), unread: unreadNotificationCount(auth.user.id) });
}

export async function POST() {
  const auth = await requireApiUser();
  if ("response" in auth) return auth.response;
  markAllNotificationsRead(auth.user.id);
  return ok({ unread: 0 });
}

export const dynamic = "force-dynamic";
