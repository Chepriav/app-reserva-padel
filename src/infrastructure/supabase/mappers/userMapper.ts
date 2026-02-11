import type {
  User,
  ApartmentUser,
  RegisterData,
  ProfileUpdate,
  ApprovalStatus,
  SkillLevel,
} from '@domain/entities/User';

/** Row shape returned by Supabase users table */
interface UserRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  vivienda: string;
  vivienda_solicitada: string | null;
  nivel_juego: string | null;
  foto_perfil: string | null;
  es_admin: boolean;
  es_manager: boolean;
  es_demo: boolean;
  estado_aprobacion: string;
  created_at: string;
  updated_at: string;
}

/** Legacy format used by existing consumers (Spanish camelCase) */
export interface LegacyUser {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  vivienda: string;
  viviendaSolicitada: string | null;
  nivelJuego: string | null;
  fotoPerfil: string | null;
  esAdmin: boolean;
  esManager: boolean;
  esDemo: boolean;
  estadoAprobacion: string;
  createdAt: string;
  updatedAt: string;
}

// --- Enum translators ---

const APPROVAL_STATUS_TO_DOMAIN: Record<string, ApprovalStatus> = {
  pendiente: 'pending',
  aprobado: 'approved',
  rechazado: 'rejected',
};

const APPROVAL_STATUS_TO_DB: Record<ApprovalStatus, string> = {
  pending: 'pendiente',
  approved: 'aprobado',
  rejected: 'rechazado',
};

const SKILL_LEVEL_TO_DOMAIN: Record<string, SkillLevel> = {
  principiante: 'beginner',
  intermedio: 'intermediate',
  avanzado: 'advanced',
  profesional: 'professional',
};

const SKILL_LEVEL_TO_DB: Record<SkillLevel, string> = {
  beginner: 'principiante',
  intermediate: 'intermedio',
  advanced: 'avanzado',
  professional: 'profesional',
};

export function approvalStatusToDomain(dbValue: string): ApprovalStatus {
  return APPROVAL_STATUS_TO_DOMAIN[dbValue] ?? 'pending';
}

export function approvalStatusToDb(domainValue: ApprovalStatus): string {
  return APPROVAL_STATUS_TO_DB[domainValue];
}

export function skillLevelToDomain(dbValue: string | null): SkillLevel | null {
  if (!dbValue) return null;
  return SKILL_LEVEL_TO_DOMAIN[dbValue] ?? null;
}

export function skillLevelToDb(domainValue: SkillLevel | null): string | null {
  if (!domainValue) return null;
  return SKILL_LEVEL_TO_DB[domainValue];
}

// --- Main mappers ---

/** DB row → domain User entity */
export function toDomain(row: UserRow): User {
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    phone: row.telefono,
    apartment: row.vivienda,
    requestedApartment: row.vivienda_solicitada,
    skillLevel: skillLevelToDomain(row.nivel_juego),
    profilePhoto: row.foto_perfil,
    isAdmin: row.es_admin ?? false,
    isManager: row.es_manager ?? false,
    isDemo: row.es_demo ?? false,
    approvalStatus: approvalStatusToDomain(row.estado_aprobacion),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Partial DB row → domain ApartmentUser */
export function toApartmentUserDomain(row: {
  id: string;
  nombre: string;
  email: string;
  foto_perfil: string | null;
  nivel_juego: string | null;
}): ApartmentUser {
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    profilePhoto: row.foto_perfil,
    skillLevel: skillLevelToDomain(row.nivel_juego),
  };
}

/** Domain ProfileUpdate → DB snake_case columns for UPDATE */
export function toDbProfileUpdate(updates: ProfileUpdate): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  if (updates.name !== undefined) mapped.nombre = updates.name;
  if (updates.phone !== undefined) mapped.telefono = updates.phone;
  if (updates.apartment !== undefined) mapped.vivienda = updates.apartment;
  if (updates.skillLevel !== undefined) mapped.nivel_juego = skillLevelToDb(updates.skillLevel);
  if (updates.profilePhoto !== undefined) mapped.foto_perfil = updates.profilePhoto;
  return mapped;
}

/** Domain RegisterData → DB row for INSERT */
export function toDbCreateRow(userId: string, data: RegisterData) {
  return {
    id: userId,
    nombre: data.name,
    email: data.email,
    telefono: data.phone,
    vivienda: data.apartment,
    es_admin: false,
    estado_aprobacion: 'pendiente',
  };
}

/** Domain User → legacy Spanish camelCase (for facade backward compat) */
export function toLegacyFormat(user: User): LegacyUser {
  return {
    id: user.id,
    nombre: user.name,
    email: user.email,
    telefono: user.phone,
    vivienda: user.apartment,
    viviendaSolicitada: user.requestedApartment,
    nivelJuego: skillLevelToDb(user.skillLevel),
    fotoPerfil: user.profilePhoto,
    esAdmin: user.isAdmin,
    esManager: user.isManager,
    esDemo: user.isDemo,
    estadoAprobacion: approvalStatusToDb(user.approvalStatus),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Legacy Spanish camelCase → domain ProfileUpdate (strips protected fields) */
export function fromLegacyFormat(data: Record<string, unknown>): ProfileUpdate {
  const updates: ProfileUpdate = {};
  if (data.nombre !== undefined) updates.name = data.nombre as string;
  if (data.telefono !== undefined) updates.phone = data.telefono as string;
  if (data.vivienda !== undefined) updates.apartment = data.vivienda as string;
  if (data.nivelJuego !== undefined) {
    updates.skillLevel = data.nivelJuego
      ? skillLevelToDomain(data.nivelJuego as string)
      : null;
  }
  if (data.fotoPerfil !== undefined) updates.profilePhoto = (data.fotoPerfil as string) ?? null;
  return updates;
}

/** Legacy Spanish camelCase → domain RegisterData */
export function fromLegacyRegisterData(data: Record<string, unknown>): RegisterData {
  return {
    name: data.nombre as string,
    email: data.email as string,
    password: data.password as string,
    phone: data.telefono as string,
    apartment: data.vivienda as string,
  };
}
