import type { Result } from '@shared/types/Result';

export interface DisplacementNotifier {
  notifyApartmentDisplacement(
    apartment: string,
    date: string,
    startTime: string,
    endTime: string,
    courtName: string,
    displacedByApartment: string,
  ): Promise<Result<void>>;

  notifyApartmentBlockoutCancellation(
    apartment: string,
    date: string,
    startTime: string,
    endTime: string,
    courtName: string,
  ): Promise<Result<void>>;
}
