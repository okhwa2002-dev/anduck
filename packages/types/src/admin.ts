import type { Reservation } from "./reservation";

export interface DashboardSummary {
  todayReservationCount: number;
  pendingReservationCount: number;
  activeProgramCount: number;
  activeAccommodationCount: number;
  recentReservations: Reservation[];
}

export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
}
