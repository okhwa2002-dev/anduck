import type { ContactInfo, ISODate, ISODateTime, Timestamps } from "./common";

export enum ReservationStatus {
  PENDING = "PENDING",
  REVIEWING = "REVIEWING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum ReservationKind {
  ACCOMMODATION = "ACCOMMODATION",
  PROGRAM = "PROGRAM",
}

export enum CancelType {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

export enum RefundStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
}

export interface Reservation extends Timestamps {
  id: string;
  kind: ReservationKind;
  status: ReservationStatus;
  applicant: ContactInfo;
  userId?: string;
  refundPolicyId?: string;
  sessionId?: string;
  targetId: string;
  targetName: string;
  roomId?: string;
  roomName?: string;
  startDate: ISODate;
  endDate?: ISODate;
  guests: number;
  totalPrice?: number;
  requestMemo?: string;
  adminMemo?: string;
  cancel?: ReservationCancel;
}

export interface ReservationCancel extends Timestamps {
  id: string;
  reservationId: string;
  cancelType: CancelType;
  cancelReason?: string;
  originalPrice?: number;
  refundRate?: number;
  refundAmount?: number;
  refundStatus: RefundStatus;
  policyRuleId?: string;
  refundMemo?: string;
  cancelledAt: ISODateTime;
}

export interface RefundPolicy extends Timestamps {
  id: string;
  name: string;
  description?: string;
  useYn: "Y" | "N";
  rules: RefundPolicyRule[];
}

export interface RefundPolicyRule extends Timestamps {
  id: string;
  policyId: string;
  daysBefore: number;
  refundRate: number;
  description?: string;
  sortOrder: number;
}

export interface CreateReservationInput {
  kind: ReservationKind;
  targetId: string;
  sessionId?: string;
  roomId?: string;
  applicant: ContactInfo;
  startDate: ISODate;
  endDate?: ISODate;
  guests: number;
  requestMemo?: string;
}

export interface UpdateReservationStatusInput {
  status: ReservationStatus;
  adminMemo?: string;
  totalPrice?: number;
}

export interface CancelReservationInput {
  cancelType: CancelType;
  cancelReason?: string;
  refundRate?: number;
  refundAmount?: number;
  refundMemo?: string;
}

export interface ReservationLookupQuery {
  name: string;
  phone: string;
}

export interface AvailabilityQuery {
  kind: ReservationKind;
  targetId: string;
  sessionId?: string;
  roomId?: string;
  startDate: ISODate;
  endDate?: ISODate;
}

export interface AvailabilityResult {
  available: boolean;
  conflictingDates?: ISODate[];
}

export interface CreateRefundPolicyInput {
  name: string;
  description?: string;
  rules: Array<{
    daysBefore: number;
    refundRate: number;
    description?: string;
    sortOrder?: number;
  }>;
}
