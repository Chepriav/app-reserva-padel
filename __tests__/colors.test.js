import { colors } from '../src/constants/colors';

describe('colors — primary English keys defined', () => {
  test('guaranteedReservation defined', () => expect(colors.guaranteedReservation).toBeDefined());
  test('provisionalReservation defined', () => expect(colors.provisionalReservation).toBeDefined());
  test('pastReservation defined', () => expect(colors.pastReservation).toBeDefined());
  test('blockout defined', () => expect(colors.blockout).toBeDefined());
  test('announcementInfo defined', () => expect(colors.announcementInfo).toBeDefined());
  test('announcementWarning defined', () => expect(colors.announcementWarning).toBeDefined());
  test('announcementUrgent defined', () => expect(colors.announcementUrgent).toBeDefined());
  test('readNotification defined', () => expect(colors.readNotification).toBeDefined());
  test('badgeRed defined', () => expect(colors.badgeRed).toBeDefined());
});

describe('colors — legacy aliases still work', () => {
  test('blocked is same as blockout', () => expect(colors.blocked).toBe(colors.blockout));
  test('displaceableReservation is same as displaceable', () => expect(colors.displaceableReservation).toBe(colors.displaceable));
  test('lesson is same as classColor', () => expect(colors.lesson).toBe(colors.classColor));
  test('lessonBadge is same as classBadge', () => expect(colors.lessonBadge).toBe(colors.classBadge));
  test('lessonBackground is same as classBackground', () => expect(colors.lessonBackground).toBe(colors.classBackground));
  test('announcementNotice is same as announcementWarning', () => expect(colors.announcementNotice).toBe(colors.announcementWarning));
  test('notificationRead is same as readNotification', () => expect(colors.notificationRead).toBe(colors.readNotification));
  test('badgeRojo is same as badgeRed', () => expect(colors.badgeRojo).toBe(colors.badgeRed));
});

describe('colors — no undefined values', () => {
  test('all color values are defined strings', () => {
    Object.entries(colors).forEach(([key, value]) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  test('no duplicate keys (object should have unique keys after fix)', () => {
    const keys = Object.keys(colors);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });
});
