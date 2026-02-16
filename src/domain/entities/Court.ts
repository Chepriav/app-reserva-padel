export interface Court {
  id: string;
  name: string;
  description: string | null;
  covered: boolean;
  hasLights: boolean;
  playerCapacity: number;
}
