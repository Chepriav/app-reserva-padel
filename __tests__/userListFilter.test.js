import { filterAndSortUsers, normalizeText } from '../src/presentation/hooks/useUserListFilter';
import { formatLastAccess } from '../src/utils/formatLastAccess';

const users = [
  { id: '1', name: 'José Pérez', apartment: '2-10-A', email: 'jose@x.com', lastAccessAt: '2026-10-01T10:00:00Z' },
  { id: '2', name: 'Ana López', apartment: '2-9-B', email: 'zana@x.com', lastAccessAt: null },
  { id: '3', name: 'bruno Gil', apartment: '1-1-A', email: 'bruno@x.com', lastAccessAt: '2026-10-12T08:00:00Z' },
];
const ids = (list) => list.map((u) => u.id);

describe('filterAndSortUsers', () => {
  test('sorts by name, case-insensitive', () => {
    expect(ids(filterAndSortUsers(users, '', 'name'))).toEqual(['2', '3', '1']);
  });
  test('sorts apartments numerically (2-9 before 2-10)', () => {
    expect(ids(filterAndSortUsers(users, '', 'apartment'))).toEqual(['3', '2', '1']);
  });
  test('sorts by email', () => {
    expect(ids(filterAndSortUsers(users, '', 'email'))).toEqual(['3', '1', '2']);
  });
  test('last access: most recent first, never recorded last', () => {
    expect(ids(filterAndSortUsers(users, '', 'lastAccess'))).toEqual(['3', '1', '2']);
  });
  test('search ignores accents and case, across name/apartment/email', () => {
    expect(ids(filterAndSortUsers(users, 'JOSE', 'name'))).toEqual(['1']);
    expect(ids(filterAndSortUsers(users, 'lopez', 'name'))).toEqual(['2']);
    expect(ids(filterAndSortUsers(users, '2-9', 'name'))).toEqual(['2']);
    expect(ids(filterAndSortUsers(users, 'bruno@', 'name'))).toEqual(['3']);
    expect(filterAndSortUsers(users, 'nadie', 'name')).toEqual([]);
  });
  test('does not mutate the input', () => {
    const copy = [...users];
    filterAndSortUsers(users, '', 'email');
    expect(users).toEqual(copy);
  });
  test('normalizeText handles null', () => expect(normalizeText(null)).toBe(''));
});

describe('formatLastAccess', () => {
  const now = new Date(2026, 9, 13, 18, 0);
  test('never', () => expect(formatLastAccess(null, now)).toBe('Sin registrar'));
  test('today', () => expect(formatLastAccess(new Date(2026, 9, 13, 9, 5).toISOString(), now)).toBe('Hoy, 09:05'));
  test('yesterday', () => expect(formatLastAccess(new Date(2026, 9, 12, 23, 30).toISOString(), now)).toBe('Ayer, 23:30'));
  test('days ago', () => expect(formatLastAccess(new Date(2026, 9, 9, 12).toISOString(), now)).toBe('Hace 4 días'));
  test('older: date', () => expect(formatLastAccess(new Date(2026, 7, 2, 12).toISOString(), now)).toBe('2 ago 2026'));
  test('invalid', () => expect(formatLastAccess('xx', now)).toBe('Sin registrar'));
});
