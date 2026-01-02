export const colors = {
  // Base colors
  primary: '#1a365d',      // Dark navy blue - primary color
  secondary: '#2c5282',    // Medium navy blue - secondary
  accent: '#d69e2e',       // Gold - accents and highlights
  background: '#f7fafc',   // Very light blue-gray
  surface: '#ffffff',      // White
  error: '#c53030',        // Elegant red
  text: '#1a202c',         // Almost black with blue tint
  textSecondary: '#718096', // Blue-gray
  disabled: '#a0aec0',     // Medium gray
  border: '#e2e8f0',       // Light blue-gray
  success: '#2f855a',      // Green for confirmations
  gold: '#d69e2e',         // Gold for premium badges
  goldLight: '#ecc94b',    // Light gold

  // Reservation priority system colors
  guaranteedReservation: '#2f855a',  // Green - first/guaranteed reservation
  provisionalReservation: '#d69e2e', // Gold - second/provisional reservation
  displacableReservation: '#cbd5e0', // Light gray - displaceable reservation background
  pastReservation: '#68a77c',        // Gray-green - past enjoyed reservations

  // Class system colors
  classColor: '#1976d2',             // Blue - class distinctive
  classBadge: '#1976d2',             // Blue - class badge
  classBackground: '#e3f2fd',        // Very light blue - class card background

  // Bulletin/announcement system colors
  announcementInfo: '#1976d2',       // Blue - info type
  announcementWarning: '#f57c00',    // Orange - warning type
  announcementUrgent: '#d32f2f',     // Red - urgent type
  announcementMaintenance: '#616161', // Gray - maintenance type
  readNotification: '#f0f0f0',       // Light gray - read notification
  badgeRed: '#e53e3e',               // Red for counter badges

  // Blockout system colors
  blocked: '#e53e3e',                // Red - blocked slot border

  // Legacy aliases for backwards compatibility
  // TODO: Remove these once all consumers are updated
  reservaGarantizada: '#2f855a',
  reservaProvisional: '#d69e2e',
  reservaDesplazable: '#cbd5e0',
  reservaPasada: '#68a77c',
  clase: '#1976d2',
  claseBadge: '#1976d2',
  claseBackground: '#e3f2fd',
  anuncioInfo: '#1976d2',
  anuncioAviso: '#f57c00',
  anuncioUrgente: '#d32f2f',
  anuncioMantenimiento: '#616161',
  notificacionLeida: '#f0f0f0',
  badgeRojo: '#e53e3e',
  bloqueado: '#e53e3e',
};
