/**
 * Unit tests for authService — auth facade
 *
 * Covers:
 *  - login(): needsEmailConfirmation flag when email is not confirmed
 *  - resendConfirmationEmail(): success, Supabase error, PKCE verifier cleanup
 */

// ─── Module mocks (hoisted by Jest) ──────────────────────────────────────────

jest.mock('../../src/services/supabaseConfig', () => ({
  supabase: {
    auth: {
      resend: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
  refreshSession: jest.fn(),
}));

jest.mock('../../src/di/container', () => ({
  loginUser:             { execute: jest.fn() },
  registerUser:          { execute: jest.fn() },
  logoutUser:            { execute: jest.fn() },
  resetPasswordUseCase:  { execute: jest.fn() },
  updatePasswordUseCase: { execute: jest.fn() },
  getCurrentUser:        { execute: jest.fn() },
  updateProfile:         { execute: jest.fn() },
  deleteOwnAccount:      { execute: jest.fn() },
  getApartmentUsers:     { execute: jest.fn() },
  getPendingUsers:       { execute: jest.fn() },
  getAllApprovedUsers:    { execute: jest.fn() },
  approveUser:           { execute: jest.fn() },
  rejectUser:            { execute: jest.fn() },
  toggleAdminRole:       { execute: jest.fn() },
  deleteUser:            { execute: jest.fn() },
  userAdminRepository: {
    setRequestedApartment:    jest.fn(),
    clearApartmentRequest:    jest.fn(),
    findApartmentChangeRequests: jest.fn(),
    approveApartmentChange:   jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/supabase/mappers/userMapper', () => ({
  toLegacyFormat:        jest.fn((u) => u),
  fromLegacyFormat:      jest.fn((d) => d),
  fromLegacyRegisterData: jest.fn((d) => d),
  toDomain:              jest.fn((r) => r),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ok  = (value) => ({ success: true,  value });
const fail = (error) => ({ success: false, error });

/** Build a minimal domain error object (mirrors DomainErrors.ts shape) */
const makeError = (code, message) => ({ code, message });

// ─── Setup ───────────────────────────────────────────────────────────────────

let authService;
let supabaseMock;
let loginExecuteMock;

/** Simulated localStorage with PKCE verifier key */
const buildLocalStorage = (extraKeys = {}) => {
  const store = { ...extraKeys };
  return {
    get length() { return Object.keys(store).length; },
    key: jest.fn((i) => Object.keys(store)[i] ?? null),
    getItem: jest.fn((k) => store[k] ?? null),
    setItem: jest.fn((k, v) => { store[k] = v; }),
    removeItem: jest.fn((k) => { delete store[k]; }),
    _store: store,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();

  // Re-require after resetModules so mocks apply cleanly
  ({ authService } = require('../../src/services/authService.supabase'));
  ({ supabase: supabaseMock } = require('../../src/services/supabaseConfig'));
  ({ loginUser: { execute: loginExecuteMock } } = require('../../src/di/container'));
  loginExecuteMock = require('../../src/di/container').loginUser.execute;
});

// ─── authService.login ────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('returns success when login use case succeeds', async () => {
    const user = { id: 'u1', name: 'Ana', approvalStatus: 'approved' };
    loginExecuteMock.mockResolvedValue(ok(user));

    const result = await authService.login('ana@test.com', 'pass123');

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ id: 'u1' });
    expect(result.needsEmailConfirmation).toBeUndefined();
  });

  it('returns needsEmailConfirmation:true when Supabase reports email not confirmed', async () => {
    loginExecuteMock.mockResolvedValue(
      fail(makeError('AUTHENTICATION_ERROR', 'Email not confirmed')),
    );

    const result = await authService.login('ana@test.com', 'pass123');

    expect(result.success).toBe(false);
    expect(result.needsEmailConfirmation).toBe(true);
    expect(result.error).toContain('verificar tu email');
  });

  it('does NOT set needsEmailConfirmation for wrong-password errors', async () => {
    loginExecuteMock.mockResolvedValue(
      fail(makeError('AUTHENTICATION_ERROR', 'Invalid login credentials')),
    );

    const result = await authService.login('ana@test.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.needsEmailConfirmation).toBeUndefined();
    expect(result.error).toContain('contraseña incorrectos');
  });

  it('shows pending-approval message when user is not approved', async () => {
    loginExecuteMock.mockResolvedValue(
      fail(makeError('USER_NOT_APPROVED', 'Account is pending admin approval')),
    );

    const result = await authService.login('ana@test.com', 'pass123');

    expect(result.success).toBe(false);
    expect(result.needsEmailConfirmation).toBeUndefined();
    expect(result.error).toContain('pendiente de aprobación');
  });

  it('shows profile-not-found message for USER_NOT_FOUND code', async () => {
    loginExecuteMock.mockResolvedValue(
      fail(makeError('USER_NOT_FOUND', 'User not found')),
    );

    const result = await authService.login('ana@test.com', 'pass123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('perfil de usuario');
  });
});

// ─── authService.resendConfirmationEmail ─────────────────────────────────────

describe('authService.resendConfirmationEmail', () => {
  it('returns success message when Supabase resend succeeds', async () => {
    supabaseMock.auth.resend.mockResolvedValue({ data: {}, error: null });

    const result = await authService.resendConfirmationEmail('ana@test.com');

    expect(result.success).toBe(true);
    expect(result.message).toContain('bandeja de entrada');
    expect(supabaseMock.auth.resend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'signup', email: 'ana@test.com' }),
    );
  });

  it('returns translated error message when Supabase returns an error', async () => {
    supabaseMock.auth.resend.mockResolvedValue({
      data: null,
      error: { message: 'Email rate limit exceeded' },
    });

    const result = await authService.resendConfirmationEmail('ana@test.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Demasiados intentos');
  });

  it('returns generic error message when Supabase throws', async () => {
    supabaseMock.auth.resend.mockRejectedValue(new Error('Network error'));

    const result = await authService.resendConfirmationEmail('ana@test.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('reenviar');
  });

  it('clears PKCE code-verifier keys from localStorage after resend', async () => {
    supabaseMock.auth.resend.mockResolvedValue({ data: {}, error: null });

    const ls = buildLocalStorage({
      'sb-aboxvlrioczeqltgqjbw-auth-token':     '{"access_token":"tok"}',
      'sb-aboxvlrioczeqltgqjbw-code-verifier':  'pkce-verifier-value',
      'other-key': 'keep-me',
    });
    global.window = { location: { origin: 'https://test.example.com' }, localStorage: ls };

    await authService.resendConfirmationEmail('ana@test.com');

    expect(ls.removeItem).toHaveBeenCalledWith('sb-aboxvlrioczeqltgqjbw-code-verifier');
    expect(ls.removeItem).not.toHaveBeenCalledWith('sb-aboxvlrioczeqltgqjbw-auth-token');
    expect(ls.removeItem).not.toHaveBeenCalledWith('other-key');

    delete global.window;
  });

  it('does not crash when localStorage has no PKCE verifier', async () => {
    supabaseMock.auth.resend.mockResolvedValue({ data: {}, error: null });

    const ls = buildLocalStorage({
      'sb-aboxvlrioczeqltgqjbw-auth-token': '{"access_token":"tok"}',
    });
    global.window = { location: { origin: 'https://test.example.com' }, localStorage: ls };

    const result = await authService.resendConfirmationEmail('ana@test.com');

    expect(result.success).toBe(true);
    expect(ls.removeItem).not.toHaveBeenCalled();

    delete global.window;
  });

  it('includes emailRedirectTo pointing to /email-confirmed when window is available', async () => {
    supabaseMock.auth.resend.mockResolvedValue({ data: {}, error: null });

    global.window = { location: { origin: 'https://rio-tamesis-app.vercel.app' }, localStorage: buildLocalStorage() };

    await authService.resendConfirmationEmail('ana@test.com');

    expect(supabaseMock.auth.resend).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: 'https://rio-tamesis-app.vercel.app/email-confirmed' },
      }),
    );

    delete global.window;
  });

  it('omits emailRedirectTo when window is not available (native/SSR)', async () => {
    supabaseMock.auth.resend.mockResolvedValue({ data: {}, error: null });

    // Ensure window is undefined
    const savedWindow = global.window;
    delete global.window;

    await authService.resendConfirmationEmail('ana@test.com');

    expect(supabaseMock.auth.resend).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'signup', email: 'ana@test.com' }),
    );
    // options should not contain emailRedirectTo
    const callArg = supabaseMock.auth.resend.mock.calls[0][0];
    expect(callArg.options).toBeUndefined();

    global.window = savedWindow;
  });
});
