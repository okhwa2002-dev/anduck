import type { ImageRef, ISODate, Sortable, Timestamps, YN } from "./common";

export interface Program extends Timestamps, Sortable {
  id: string;
  name: string;
  summary?: string;
  description: string;
  durationMinutes: number;
  pricePerPerson: number;
  minParticipants?: number;
  maxParticipants: number;
  availableDays: string[];
  operatingHours?: string;
  preparationNotes?: string;
  mainImage?: ImageRef;
  images: ImageRef[];
  mainOpenYn: YN;
  activeYn: YN;
  sessions?: ProgramSession[];
}

export interface ProgramSession extends Timestamps {
  id: string;
  programId: string;
  sessionDate: ISODate;
  startTime: string;
  capacity?: number;
  activeYn: YN;
  bookedCount?: number;
}

export interface CreateProgramInput {
  name: string;
  summary?: string;
  description: string;
  durationMinutes: number;
  pricePerPerson: number;
  minParticipants?: number;
  maxParticipants: number;
  availableDays?: string[];
  operatingHours?: string;
  preparationNotes?: string;
  mainImageId?: string;
  imageIds?: string[];
  mainOpenYn?: YN;
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateProgramInput = Partial<CreateProgramInput>;

export interface CreateProgramSessionInput {
  programId: string;
  sessionDate: ISODate;
  startTime: string;
  capacity?: number;
  activeYn?: YN;
}

export type UpdateProgramSessionInput = Partial<Omit<CreateProgramSessionInput, "programId">>;
