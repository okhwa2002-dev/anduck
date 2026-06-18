import type { ImageRef, ISODate, Sortable, Timestamps, YN } from "./common";

export enum AccommodationType {
  HWANGTO = "HWANGTO",
  PENSION = "PENSION",
}

export interface Accommodation extends Timestamps, Sortable {
  id: string;
  type: AccommodationType;
  name: string;
  summary?: string;
  description: string;
  mainImage?: ImageRef;
  images: ImageRef[];
  amenities: string[];
  checkInTime?: string;
  checkOutTime?: string;
  featuredYn: YN;
  activeYn: YN;
}

export interface Room extends Timestamps, Sortable {
  id: string;
  accommodationId: string;
  name: string;
  description?: string;
  baseGuests: number;
  maxGuests: number;
  weekdayPrice: number;
  weekendPrice?: number;
  peakSeasonPrice?: number;
  mainImage?: ImageRef;
  images: ImageRef[];
  activeYn: YN;
  seasonRates?: SeasonRate[];
}

export interface SeasonRate extends Timestamps {
  id: string;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  roomId?: string;
  price: number;
  useYn: YN;
}

export interface CreateAccommodationInput {
  type: AccommodationType;
  name: string;
  summary?: string;
  description: string;
  mainImageId?: string;
  imageIds?: string[];
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  featuredYn?: YN;
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateAccommodationInput = Partial<CreateAccommodationInput>;

export interface CreateRoomInput {
  accommodationId: string;
  name: string;
  description?: string;
  baseGuests: number;
  maxGuests: number;
  weekdayPrice: number;
  weekendPrice?: number;
  peakSeasonPrice?: number;
  mainImageId?: string;
  imageIds?: string[];
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateRoomInput = Partial<CreateRoomInput>;

export interface CreateSeasonRateInput {
  name: string;
  startDate: ISODate;
  endDate: ISODate;
  roomId?: string;
  price: number;
  useYn?: YN;
}

export type UpdateSeasonRateInput = Partial<CreateSeasonRateInput>;
