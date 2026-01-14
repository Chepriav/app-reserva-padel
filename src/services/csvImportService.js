import Papa from 'papaparse';
import { validateEmail, validateApartmentComponents } from '../utils/validators';
import { APARTMENT_CONFIG } from '../constants/config';

/**
 * Service for CSV import functionality
 * Handles parsing, validation, and sanitization of user data from CSV files
 */
export const csvImportService = {
  /**
   * Parse CSV file and validate structure
   * @param {File} file - CSV file to parse
   * @returns {Promise<{success: boolean, data?: Array, errors?: Array}>}
   */
  async parseCSV(file) {
    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        errors: ['El archivo es demasiado grande. Máximo permitido: 10MB'],
      };
    }

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return {
        success: false,
        errors: ['El archivo debe ser un CSV válido'],
      };
    }

    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: '', // Auto-detect comma or semicolon
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          // Check for parsing errors
          if (results.errors && results.errors.length > 0) {
            const criticalErrors = results.errors.filter(
              (err) => err.type === 'Delimiter' || err.type === 'FieldMismatch'
            );
            if (criticalErrors.length > 0) {
              resolve({
                success: false,
                errors: ['Error al parsear el archivo CSV. Verifica el formato.'],
              });
              return;
            }
          }

          // Validate required columns
          const requiredColumns = ['nombre', 'codigo', 'email'];
          const headers = results.meta.fields || [];
          const missingColumns = requiredColumns.filter(
            (col) => !headers.includes(col)
          );

          if (missingColumns.length > 0) {
            resolve({
              success: false,
              errors: [
                `Columnas requeridas faltantes: ${missingColumns.join(', ')}`,
                'El CSV debe tener las columnas: nombre, codigo, email',
              ],
            });
            return;
          }

          // Check if file is empty
          if (!results.data || results.data.length === 0) {
            resolve({
              success: false,
              errors: ['El archivo CSV está vacío'],
            });
            return;
          }

          // Validate each row
          const validatedRows = [];
          const rowErrors = [];

          results.data.forEach((row, index) => {
            const lineNumber = index + 2; // +2 because: 1-indexed + header row
            const validation = this.validateCSVRow(row, lineNumber);

            if (validation.valid) {
              validatedRows.push(validation.sanitized);
            } else {
              rowErrors.push({
                line: lineNumber,
                errors: validation.errors,
                row: row,
              });
            }
          });

          resolve({
            success: true,
            data: validatedRows,
            errors: rowErrors,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            errors: [`Error al leer el archivo: ${error.message}`],
          });
        },
      });
    });
  },

  /**
   * Validate individual CSV row
   * @param {Object} row - Row data from CSV
   * @param {number} lineNumber - Line number in file (for error messages)
   * @returns {Object} { valid: boolean, errors: Array, sanitized?: Object }
   */
  validateCSVRow(row, lineNumber) {
    const errors = [];

    // Validate nombre
    const nombre = row.nombre?.trim();
    if (!nombre) {
      errors.push(`Línea ${lineNumber}: El nombre es obligatorio`);
    } else if (nombre.length < 2) {
      errors.push(`Línea ${lineNumber}: El nombre es demasiado corto (mínimo 2 caracteres)`);
    } else if (nombre.length > 100) {
      errors.push(`Línea ${lineNumber}: El nombre es demasiado largo (máximo 100 caracteres)`);
    }

    // Validate email
    const email = row.email?.trim();
    if (!email) {
      errors.push(`Línea ${lineNumber}: El email es obligatorio`);
    } else if (!validateEmail(email)) {
      errors.push(`Línea ${lineNumber}: Email inválido (${email})`);
    } else if (email.length > 255) {
      errors.push(`Línea ${lineNumber}: Email demasiado largo (máximo 255 caracteres)`);
    }

    // Validate codigo (apartment code)
    const codigo = row.codigo?.trim();
    if (!codigo) {
      errors.push(`Línea ${lineNumber}: El código de vivienda es obligatorio`);
    } else {
      const parsedApartment = this.parseApartmentCode(codigo);
      if (!parsedApartment) {
        errors.push(
          `Línea ${lineNumber}: Código de vivienda inválido (${codigo}). ` +
          `Formato esperado: escalera-piso-puerta (ej: 1-3-B)`
        );
      } else {
        // Additional validation using existing validator
        const validation = validateApartmentComponents(
          parsedApartment.escalera,
          parsedApartment.piso,
          parsedApartment.puerta
        );
        if (!validation.valid) {
          const errorMessages = Object.values(validation.errors).join(', ');
          errors.push(`Línea ${lineNumber}: ${errorMessages}`);
        }
      }
    }

    // Return validation result
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    // Sanitize and normalize data
    const parsedApartment = this.parseApartmentCode(codigo);
    return {
      valid: true,
      errors: [],
      sanitized: {
        nombre,
        email: email.toLowerCase(),
        vivienda: `${parsedApartment.escalera}-${parsedApartment.piso}-${parsedApartment.puerta}`,
        codigoOriginal: codigo,
      },
    };
  },

  /**
   * Parse apartment code from various formats
   * Supports: "1-3-B", "1/3/B", "1 3 B"
   * @param {string} codigo - Apartment code string
   * @returns {Object|null} { escalera, piso, puerta } or null if invalid
   */
  parseApartmentCode(codigo) {
    if (!codigo || typeof codigo !== 'string') {
      return null;
    }

    // Normalize: replace common separators with dash, remove extra spaces
    let normalized = codigo
      .trim()
      .replace(/[\/\s]+/g, '-') // Replace slashes and spaces with dash
      .replace(/-+/g, '-') // Remove duplicate dashes
      .toUpperCase();

    // Split by dash
    const parts = normalized.split('-');

    if (parts.length !== 3) {
      return null;
    }

    const [escalera, piso, puerta] = parts;

    // Validate escalera (1-6)
    const escaleraNum = parseInt(escalera, 10);
    if (
      isNaN(escaleraNum) ||
      !APARTMENT_CONFIG.stairs.includes(escaleraNum)
    ) {
      return null;
    }

    // Validate piso (1-6)
    const pisoNum = parseInt(piso, 10);
    if (
      isNaN(pisoNum) ||
      !APARTMENT_CONFIG.floors.includes(pisoNum)
    ) {
      return null;
    }

    // Validate puerta (A-M)
    if (!APARTMENT_CONFIG.doors.includes(puerta)) {
      return null;
    }

    return {
      escalera: escaleraNum.toString(),
      piso: pisoNum.toString(),
      puerta,
    };
  },

  /**
   * Generate example CSV content for download
   * @returns {string} CSV content
   */
  generateExampleCSV() {
    return `nombre,codigo,email
Juan Pérez,1-3-B,juan.perez@example.com
María González,2-4-C,maria.gonzalez@example.com
Pedro López,1-2-A,pedro.lopez@example.com`;
  },

  /**
   * Export error log as CSV
   * @param {Array} errors - Array of error objects
   * @returns {string} CSV content
   */
  exportErrorLog(errors) {
    const header = 'Línea,Nombre,Código,Email,Error\n';
    const rows = errors.map((error) => {
      const nombre = error.row?.nombre || '';
      const codigo = error.row?.codigo || '';
      const email = error.row?.email || '';
      const errorMsg = error.errors.join('; ');
      return `${error.line},"${nombre}","${codigo}","${email}","${errorMsg}"`;
    });
    return header + rows.join('\n');
  },
};
