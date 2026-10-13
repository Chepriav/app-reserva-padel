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

const COMPARATORS = {
  name: (a, b) => compareText(a.name, b.name),
  // numeric: "2-10-A" after "2-9-A"
  apartment: (a, b) => compareText(a.apartment, b.apartment) || compareText(a.name, b.name),
  email: (a, b) => compareText(a.email, b.email),
  // Most recent first, never-recorded at the end
  lastAccess: (a, b) => {
    const ta = a.lastAccessAt ? Date.parse(a.lastAccessAt) : -Infinity;
    const tb = b.lastAccessAt ? Date.parse(b.lastAccessAt) : -Infinity;
    return tb - ta || compareText(a.name, b.name);
  },
};

/** Pure helper (testable): filters by name/apartment/email and sorts. */
export function filterAndSortUsers(users, query, sortBy) {
  const q = normalizeText(query);
  const filtered = q
    ? users.filter((u) =>
        [u.name, u.apartment, u.email].some((field) => normalizeText(field).includes(q)),
      )
    : users;
  const comparator = COMPARATORS[sortBy] ?? COMPARATORS.name;
  return [...filtered].sort(comparator);
}

/**
 * Search + sort state for Admin → Usuarios.
 */
export function useUserListFilter(users) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const visibleUsers = useMemo(
    () => filterAndSortUsers(users, query, sortBy),
    [users, query, sortBy],
  );

  return { query, setQuery, sortBy, setSortBy, visibleUsers };
}
