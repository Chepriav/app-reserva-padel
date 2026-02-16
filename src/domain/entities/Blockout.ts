export interface Blockout {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateBlockoutData {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdBy: string;
}
