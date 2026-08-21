import { formatNotificationDate, unreadCount } from '@/core/notifications';

describe('notifications helpers', () => {
  it('formats dates and counts unread', () => {
    expect(formatNotificationDate('2026-08-20T12:00:00.000Z')).toContain(
      '2026',
    );
    expect(
      unreadCount([
        { id: '1', title: 'a', message: 'b', createdAt: '', read: false },
        { id: '2', title: 'c', message: 'd', createdAt: '', read: true },
      ]),
    ).toBe(1);
  });
});
