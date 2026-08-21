export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
};

export function formatNotificationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString();
}

export function unreadCount(items: AppNotification[]): number {
  return items.filter((item) => item.read === false).length;
}
