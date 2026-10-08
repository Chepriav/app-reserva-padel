import { startVersionCheck } from '../src/services/versionCheck';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('startVersionCheck', () => {
  let listeners;
  let deployed;

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setTimeout'] });
    listeners = {};
    deployed = 'v1';
    global.window = {};
    global.document = {
      visibilityState: 'visible',
      addEventListener: (event, fn) => { listeners[event] = fn; },
      removeEventListener: (event) => { delete listeners[event]; },
    };
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ version: deployed }) }));
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.window;
    delete global.document;
    delete global.fetch;
  });

  it('notifies once when the deployed version changes', async () => {
    const onNewVersion = jest.fn();
    const stop = startVersionCheck(onNewVersion);
    await flush();
    expect(onNewVersion).not.toHaveBeenCalled();

    deployed = 'v2';
    listeners.visibilitychange();
    await flush();
    expect(onNewVersion).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5 * 60 * 1000);
    await flush();
    expect(onNewVersion).toHaveBeenCalledTimes(1);
    stop();
    expect(listeners.visibilitychange).toBeUndefined();
  });

  it('ignores network errors and missing version.json', async () => {
    global.fetch = jest.fn(async () => { throw new Error('offline'); });
    const onNewVersion = jest.fn();
    const stop = startVersionCheck(onNewVersion);
    await flush();
    global.fetch = jest.fn(async () => ({ ok: false }));
    listeners.visibilitychange();
    await flush();
    expect(onNewVersion).not.toHaveBeenCalled();
    stop();
  });
});
