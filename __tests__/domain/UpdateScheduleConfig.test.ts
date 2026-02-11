import { UpdateScheduleConfig } from '../../src/domain/useCases/UpdateScheduleConfig';
import { DEFAULT_SCHEDULE_CONFIG } from '../../src/domain/entities/ScheduleConfig';
import type { ScheduleConfig } from '../../src/domain/entities/ScheduleConfig';
import type { ScheduleConfigRepository } from '../../src/domain/ports/repositories/ScheduleConfigRepository';
import { ok } from '../../src/shared/types/Result';

const mockRepo: ScheduleConfigRepository = {
  getConfig: jest.fn(),
  updateConfig: jest.fn().mockResolvedValue(ok(DEFAULT_SCHEDULE_CONFIG)),
};

describe('UpdateScheduleConfig', () => {
  const useCase = new UpdateScheduleConfig(mockRepo);
  const validConfig: ScheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRepo.updateConfig as jest.Mock).mockResolvedValue(ok(validConfig));
  });

  it('delegates to repository on valid config', async () => {
    const result = await useCase.execute('user-1', validConfig);
    expect(result.success).toBe(true);
    expect(mockRepo.updateConfig).toHaveBeenCalledWith('user-1', validConfig);
  });

  it('rejects when opening >= closing', async () => {
    const badConfig: ScheduleConfig = {
      ...validConfig,
      openingTime: '22:00',
      closingTime: '08:00',
    };
    const result = await useCase.execute('user-1', badConfig);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(mockRepo.updateConfig).not.toHaveBeenCalled();
  });

  it('rejects partial break config (start without end)', async () => {
    const badConfig: ScheduleConfig = {
      ...validConfig,
      breakStart: '14:00',
      breakEnd: null,
    };
    const result = await useCase.execute('user-1', badConfig);
    expect(result.success).toBe(false);
    expect(mockRepo.updateConfig).not.toHaveBeenCalled();
  });

  it('rejects differentiated without weekday hours', async () => {
    const badConfig: ScheduleConfig = {
      ...validConfig,
      useDifferentiatedSchedules: true,
      weekdayOpeningTime: null,
      weekdayClosingTime: null,
      weekendOpeningTime: '09:00',
      weekendClosingTime: '21:00',
    };
    const result = await useCase.execute('user-1', badConfig);
    expect(result.success).toBe(false);
    expect(mockRepo.updateConfig).not.toHaveBeenCalled();
  });

  it('rejects differentiated without weekend hours', async () => {
    const badConfig: ScheduleConfig = {
      ...validConfig,
      useDifferentiatedSchedules: true,
      weekdayOpeningTime: '08:00',
      weekdayClosingTime: '22:00',
      weekendOpeningTime: null,
      weekendClosingTime: null,
    };
    const result = await useCase.execute('user-1', badConfig);
    expect(result.success).toBe(false);
    expect(mockRepo.updateConfig).not.toHaveBeenCalled();
  });

  it('accepts full differentiated config', async () => {
    const goodConfig: ScheduleConfig = {
      ...validConfig,
      useDifferentiatedSchedules: true,
      weekdayOpeningTime: '08:00',
      weekdayClosingTime: '22:00',
      weekendOpeningTime: '09:00',
      weekendClosingTime: '21:00',
    };
    (mockRepo.updateConfig as jest.Mock).mockResolvedValue(ok(goodConfig));
    const result = await useCase.execute('user-1', goodConfig);
    expect(result.success).toBe(true);
  });
});
