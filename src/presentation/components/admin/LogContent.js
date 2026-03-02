import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '../../../constants/colors';
import { ReservationLogCard } from './ReservationLogCard';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'completed', label: 'Completadas' },
];

const STATUS_ES = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const PRIORITY_ES = {
  guaranteed: 'Garantizada (G)',
  provisional: 'Provisional (P)',
};

/**
 * Generates a printable HTML page for the reservations log.
 */
function buildRegistrosHtml(reservations) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const rows = reservations.map((r) => {
    const date = r.date ? r.date.split('-').reverse().join('/') : '—';
    const createdAt = r.createdAt
      ? new Date(r.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : '—';
    const statusColor = r.status === 'confirmed' ? '#2f855a'
      : r.status === 'cancelled' ? '#c53030' : '#718096';
    return `
      <tr>
        <td style="font-weight:bold">${r.apartment ?? '—'}</td>
        <td>${r.userName ?? '—'}</td>
        <td>${date}</td>
        <td>${r.startTime ?? '—'}–${r.endTime ?? '—'}</td>
        <td>${r.courtName ?? '—'}</td>
        <td style="color:${statusColor};font-weight:600">${STATUS_ES[r.status] ?? r.status}</td>
        <td>${PRIORITY_ES[r.priority] ?? r.priority ?? '—'}</td>
        <td>${createdAt}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Registros de Reservas</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a202c; margin: 24px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #718096; font-size: 11px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2c5282; color: #fff; padding: 8px 6px; text-align: left; font-size: 11px; }
    td { padding: 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f7fafc; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Registros de Reservas — Pistas de Pádel</h1>
  <p class="meta">Generado el ${dateStr} · ${reservations.length} registros</p>
  <table>
    <thead>
      <tr>
        <th>Vivienda</th>
        <th>Nombre</th>
        <th>Fecha</th>
        <th>Horario</th>
        <th>Pista</th>
        <th>Estado</th>
        <th>Prioridad</th>
        <th>Fecha reserva</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

/**
 * Admin "Registros" panel: filter bar + reservations list + PDF download.
 */
export function LogContent({
  reservations,
  loading,
  filterApartment,
  filterStatus,
  onFilterApartment,
  onFilterStatus,
  total,
}) {
  const handleDownloadPdf = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const html = buildRegistrosHtml(reservations);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filtrar por vivienda..."
          placeholderTextColor={colors.disabled}
          value={filterApartment}
          onChangeText={onFilterApartment}
          autoCorrect={false}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.statusBtn,
              filterStatus === opt.value && styles.statusBtnActive,
            ]}
            onPress={() => onFilterStatus(opt.value)}
          >
            <Text
              style={[
                styles.statusBtnText,
                filterStatus === opt.value && styles.statusBtnTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count + PDF button */}
      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {reservations.length} de {total} reservas
        </Text>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf}>
            <Text style={styles.pdfBtnText}>Descargar PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={colors.accent}
        />
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReservationLogCard reservation={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay reservas con estos filtros.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  count: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pdfBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  pdfBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
    fontSize: 14,
  },
});
