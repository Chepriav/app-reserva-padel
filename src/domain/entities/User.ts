export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

/**
 * Core user entity.
 * All field names are in English; mappers handle translation
 * to/from DB (snake_case) and legacy format (camelCase Spanish).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  requestedApartment: string | null;
  skillLevel: SkillLevel | null;
  profilePhoto: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isDemo: boolean;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

/** Partial user returned by getUsersBySameApartment */
export interface ApartmentUser {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  skillLevel: SkillLevel | null;
}

/** Data required to register a new user */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  apartment: string;
}

/** Fields a user can update on their own profile */
export interface ProfileUpdate {
  name?: string;
  phone?: string;
  apartment?: string;
  skillLevel?: SkillLevel | null;
  profilePhoto?: string | null;
}
