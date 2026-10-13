import { useMemo, useState } from 'react';

export const USER_SORT_OPTIONS = [
  { key: 'name', label: 'Nombre' },
  { key: 'apartment', label: 'Vivienda' },
  { key: 'email', label: 'Email' },
  { key: 'lastAccess', label: 'Último acceso' },
];

// Lowercase and strip accents so "jose" finds "José"
export const normalizeText = (value) =>
  (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const compareText = (a, b) =>
  (a || '').localeCompare(b || '', 'es', { numeric: true, sensitivity: 'base' });

// Ascending comparators; the direction is applied in filterAndSortUsers
const COMPARATORS = {
  name: (a, b) => compareText(a.name, b.name),
  // numeric: "2-10-A" after "2-9-A"
  apartment: (a, b) => compareText(a.apartment, b.apartment),
  email: (a, b) => compareText(a.email, b.email),
  lastAccess: (a, b) => Date.parse(a.lastAccessAt) - Date.parse(b.lastAccessAt),
};

// First tap on a sort option: most recent access first, A→Z for the rest
export const DEFAULT_SORT_DIRECTION = { name: 'asc', apartment: 'asc', email: 'asc', lastAccess: 'desc' };

/** Pure helper (testable): filters by name/apartment/email and sorts. */
export function filterAndSortUsers(users, query, sortBy, direction = DEFAULT_SORT_DIRECTION[sortBy] ?? 'asc') {
  const q = normalizeText(query);
  const filtered = q
    ? users.filter((u) =>
        [u.name, u.apartment, u.email].some((field) => normalizeText(field).includes(q)),
      )
    : users;
  const key = COMPARATORS[sortBy] ? sortBy : 'name';
  const sign = direction === 'desc' ? -1 : 1;
  return [...filtered].sort((a, b) => {
    // Users who never opened the app always go last
    if (key === 'lastAccess' && !a.lastAccessAt !== !b.lastAccessAt) return a.lastAccessAt ? -1 : 1;
    if (key === 'lastAccess' && !a.lastAccessAt) return compareText(a.name, b.name);
    return sign * COMPARATORS[key](a, b) || compareText(a.name, b.name);
  });
}

/**
 * Search + sort state for Admin → Usuarios.
 * Tapping the active sort option again reverses the order.
 */
export function useUserListFilter(users) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortByState] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const setSortBy = (key) => {
    if (key === sortBy) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortByState(key);
      setSortDirection(DEFAULT_SORT_DIRECTION[key] ?? 'asc');
    }
  };

  const visibleUsers = useMemo(
    () => filterAndSortUsers(users, query, sortBy, sortDirection),
    [users, query, sortBy, sortDirection],
  );

  return { query, setQuery, sortBy, sortDirection, setSortBy, visibleUsers };
}
