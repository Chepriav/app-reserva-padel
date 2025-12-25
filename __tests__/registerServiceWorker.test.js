/**
 * Tests para registerServiceWorker
 */

describe('registerServiceWorker', () => {
  let registerServiceWorker;
  let mockRegistration;

  beforeEach(() => {
    jest.resetModules();

    mockRegistration = {
      scope: 'https://example.com/',
      update: jest.fn(),
    };

    // Mock de navigator.serviceWorker
    global.navigator = {
      serviceWorker: {
        register: jest.fn(() => Promise.resolve(mockRegistration)),
      },
    };

    // Mock de window
    global.window = {
      addEventListener: jest.fn((event, callback) => {
        if (event === 'load') {
          callback();
        }
      }),
    };

    // Mock de document
    global.document = {
      readyState: 'loading',
    };

    // Mock console
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería registrar el Service Worker cuando el documento está cargando', () => {
    global.document.readyState = 'loading';

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    expect(global.window.addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('debería registrar el Service Worker inmediatamente cuando el documento está completo', async () => {
    global.document.readyState = 'complete';

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    // Esperar a que la promesa se resuelva
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith('/service-worker.js');
  });

  it('debería loggear el scope cuando el registro es exitoso', async () => {
    global.document.readyState = 'complete';

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(console.log).toHaveBeenCalledWith('Service Worker registrado:', 'https://example.com/');
  });

  it('debería llamar a registration.update() después del registro', async () => {
    global.document.readyState = 'complete';

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockRegistration.update).toHaveBeenCalled();
  });

  it('debería manejar errores de registro', async () => {
    const testError = new Error('Registration failed');
    global.navigator.serviceWorker.register = jest.fn(() => Promise.reject(testError));
    global.document.readyState = 'complete';

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(console.error).toHaveBeenCalledWith('Error registrando Service Worker:', testError);
  });

  it('no debería hacer nada si window no está definido', () => {
    delete global.window;

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    // No debería lanzar error
    expect(true).toBe(true);

    // Restaurar
    global.window = {};
  });

  it('no debería hacer nada si serviceWorker no está disponible', () => {
    global.navigator = {};
    global.window = {};
    global.document = { readyState: 'complete' };

    registerServiceWorker = require('../src/services/registerServiceWorker').registerServiceWorker;
    registerServiceWorker();

    // No debería lanzar error
    expect(true).toBe(true);
  });
});
