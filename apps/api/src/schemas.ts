/**
 * JSON Schema definitions for Swagger / Fastify validation.
 * Register all exported schemas via registerSchemas() before registering routes.
 */

import type { FastifyInstance } from "fastify";

// ─── Shared building blocks ───────────────────────────────────────────────────

export const S_ImageRef = {
  $id: "ImageRef",
  type: "object",
  properties: {
    id: { type: "string" },
    url: { type: "string" },
    alt: { type: "string" },
  },
  required: ["id", "url"],
} as const;

export const S_Address = {
  $id: "Address",
  type: "object",
  properties: {
    road: { type: "string" },
    detail: { type: "string" },
    zipCode: { type: "string" },
  },
  required: ["road"],
} as const;

export const S_GeoPoint = {
  $id: "GeoPoint",
  type: "object",
  properties: {
    latitude: { type: "number" },
    longitude: { type: "number" },
  },
  required: ["latitude", "longitude"],
} as const;

export const S_IdParam = {
  $id: "IdParam",
  type: "object",
  properties: { id: { type: "string" } },
  required: ["id"],
} as const;

export const S_ListQuery = {
  $id: "ListQuery",
  type: "object",
  properties: {
    q: { type: "string", description: "검색어" },
    page: { type: "integer", minimum: 1, default: 1, description: "페이지 번호 (기본값: 1)" },
    pageSize: { type: "integer", minimum: 1, maximum: 200, default: 20, description: "페이지 크기 (기본값: 20)" },
    all: { type: "boolean", default: false, description: "전체 조회 여부 (true 시 페이징 없이 전체 반환)" },
    useYn: { type: "string", enum: ["Y", "N"], description: "활성 여부" },
    featuredYn: { type: "string", enum: ["Y", "N"], description: "추천 여부" },
    mainOpenYn: { type: "string", enum: ["Y", "N"], description: "메인 노출 여부" },
  },
} as const;

export const S_OkResponse = {
  $id: "OkResponse",
  type: "object",
  properties: { ok: { type: "boolean" } },
  required: ["ok"],
} as const;

export const S_ErrorResponse = {
  $id: "ErrorResponse",
  type: "object",
  properties: { message: { type: "string" } },
  required: ["message"],
} as const;

// ─── Common timestamps ────────────────────────────────────────────────────────

const timestampProps = {
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
  createdBy: { type: "string" },
  updatedBy: { type: "string" },
} as const;

// ─── Response: Auth ───────────────────────────────────────────────────────────

export const S_UserInfo = {
  $id: "UserInfo",
  type: "object",
  properties: {
    id: { type: "string" },
    loginId: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
    phone: { type: "string" },
    userType: { type: "string" },
    ...timestampProps,
  },
  required: ["id", "loginId", "email", "name", "userType"],
} as const;

export const S_AuthTokenResponse = {
  $id: "AuthTokenResponse",
  type: "object",
  properties: {
    user: { $ref: "UserInfo#" },
    tokens: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
      },
      required: ["accessToken", "refreshToken"],
    },
  },
  required: ["user", "tokens"],
} as const;

export const S_RefreshTokenResponse = {
  $id: "RefreshTokenResponse",
  type: "object",
  properties: {
    user: { $ref: "UserInfo#" },
    tokens: {
      type: "object",
      properties: {
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
      },
      required: ["accessToken", "refreshToken"],
    },
  },
  required: ["user", "tokens"],
} as const;

// ─── Response: Program ────────────────────────────────────────────────────────

export const S_Program = {
  $id: "Program",
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    durationMinutes: { type: "integer" },
    pricePerPerson: { type: "number" },
    minParticipants: { type: "integer" },
    maxParticipants: { type: "integer" },
    availableDays: { type: "array", items: { type: "string" } },
    operatingHours: { type: "string" },
    preparationNotes: { type: "string" },
    mainImage: { $ref: "ImageRef#" },
    images: { type: "array", items: { $ref: "ImageRef#" } },
    mainOpenYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "name", "description", "pricePerPerson", "availableDays", "images", "mainOpenYn", "activeYn"],
} as const;

export const S_ProgramSession = {
  $id: "ProgramSession",
  type: "object",
  properties: {
    id: { type: "string" },
    programId: { type: "string" },
    sessionDate: { type: "string", format: "date" },
    startTime: { type: "string" },
    capacity: { type: "integer" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    ...timestampProps,
  },
  required: ["id", "programId", "sessionDate", "startTime", "activeYn"],
} as const;

export const S_PagedPrograms = {
  $id: "PagedPrograms",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Program#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

// ─── Response: Accommodation ──────────────────────────────────────────────────

export const S_Accommodation = {
  $id: "Accommodation",
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: ["HWANGTO", "PENSION"] },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    mainImage: { $ref: "ImageRef#" },
    images: { type: "array", items: { $ref: "ImageRef#" } },
    amenities: { type: "array", items: { type: "string" } },
    checkInTime: { type: "string" },
    checkOutTime: { type: "string" },
    featuredYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "type", "name", "description", "images", "amenities", "featuredYn", "activeYn"],
} as const;

export const S_Room = {
  $id: "Room",
  type: "object",
  properties: {
    id: { type: "string" },
    accommodationId: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    baseGuests: { type: "integer" },
    maxGuests: { type: "integer" },
    weekdayPrice: { type: "number" },
    weekendPrice: { type: "number" },
    mainImage: { $ref: "ImageRef#" },
    images: { type: "array", items: { $ref: "ImageRef#" } },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "accommodationId", "name", "baseGuests", "maxGuests", "weekdayPrice", "images", "activeYn"],
} as const;

export const S_PagedAccommodations = {
  $id: "PagedAccommodations",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Accommodation#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

export const S_PagedRooms = {
  $id: "PagedRooms",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Room#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

// ─── Response: Reservation ────────────────────────────────────────────────────

export const S_Reservation = {
  $id: "Reservation",
  type: "object",
  properties: {
    id: { type: "string" },
    kind: { type: "string", enum: ["ACCOMMODATION", "PROGRAM"] },
    status: { type: "string", enum: ["PENDING", "REVIEWING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
    applicant: {
      type: "object",
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "phone"],
    },
    targetId: { type: "string" },
    targetName: { type: "string" },
    roomId: { type: "string" },
    roomName: { type: "string" },
    sessionId: { type: "string" },
    startDate: { type: "string", format: "date" },
    endDate: { type: "string", format: "date" },
    guests: { type: "integer" },
    requestMemo: { type: "string" },
    adminMemo: { type: "string" },
    ...timestampProps,
  },
  required: ["id", "kind", "status", "applicant", "targetId", "targetName", "startDate"],
} as const;

export const S_PagedReservations = {
  $id: "PagedReservations",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Reservation#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

export const S_AvailabilityResult = {
  $id: "AvailabilityResult",
  type: "object",
  properties: {
    available: { type: "boolean" },
    conflictingDates: { type: "array", items: { type: "string", format: "date" } },
  },
  required: ["available"],
} as const;

// ─── Response: Notice ─────────────────────────────────────────────────────────

export const S_Notice = {
  $id: "Notice",
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    pinnedYn: { type: "string", enum: ["Y", "N"] },
    openYn: { type: "string", enum: ["Y", "N"] },
    authorId: { type: "string" },
    ...timestampProps,
  },
  required: ["id", "title", "body", "pinnedYn", "openYn"],
} as const;

export const S_PagedNotices = {
  $id: "PagedNotices",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Notice#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

// ─── Response: Gallery ────────────────────────────────────────────────────────

export const S_GalleryItem = {
  $id: "GalleryItem",
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    image: { $ref: "ImageRef#" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "activeYn"],
} as const;

export const S_PagedGalleryItems = {
  $id: "PagedGalleryItems",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "GalleryItem#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

// ─── Response: Facility ───────────────────────────────────────────────────────

export const S_Facility = {
  $id: "Facility",
  type: "object",
  properties: {
    id: { type: "string" },
    kind: { type: "string", enum: ["VILLAGE", "NEARBY"] },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    address: { $ref: "Address#" },
    location: { $ref: "GeoPoint#" },
    mainImage: { $ref: "ImageRef#" },
    images: { type: "array", items: { $ref: "ImageRef#" } },
    mainOpenYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "kind", "name", "images", "mainOpenYn", "activeYn"],
} as const;

export const S_PagedFacilities = {
  $id: "PagedFacilities",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Facility#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

// ─── Response: Banner ─────────────────────────────────────────────────────────

export const S_Banner = {
  $id: "Banner",
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    subtitle: { type: "string" },
    image: { $ref: "ImageRef#" },
    linkType: { type: "string", enum: ["NONE", "PROGRAM", "ACCOMMODATION", "NOTICE", "FACILITY", "URL"] },
    linkValue: { type: "string" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "title", "linkType", "activeYn"],
} as const;

export const S_PagedBanners = {
  $id: "PagedBanners",
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: "Banner#" } },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["items", "total", "page", "pageSize", "totalPages"],
} as const;

// ─── Response: Village Profile ────────────────────────────────────────────────

export const S_VillageProfile = {
  $id: "VillageProfile",
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    address: { $ref: "Address#" },
    location: { $ref: "GeoPoint#" },
    phone: { type: "string" },
    email: { type: "string" },
    images: { type: "array", items: { $ref: "ImageRef#" } },
    ...timestampProps,
  },
  required: ["id", "name", "images"],
} as const;

// ─── Response: Dashboard ──────────────────────────────────────────────────────

export const S_DashboardSummary = {
  $id: "DashboardSummary",
  type: "object",
  properties: {
    todayReservationCount: { type: "integer" },
    pendingReservationCount: { type: "integer" },
    activeProgramCount: { type: "integer" },
    activeAccommodationCount: { type: "integer" },
    recentReservations: { type: "array", items: { $ref: "Reservation#" } },
  },
  required: ["todayReservationCount", "pendingReservationCount", "activeProgramCount", "activeAccommodationCount", "recentReservations"],
} as const;

// ─── Response: Home ───────────────────────────────────────────────────────────

export const S_HomeResponse = {
  $id: "HomeResponse",
  type: "object",
  properties: {
    banners: { type: "array", items: { $ref: "Banner#" } },
    featuredPrograms: { type: "array", items: { $ref: "Program#" } },
    featuredAccommodations: { type: "array", items: { $ref: "Accommodation#" } },
    latestNotices: { type: "array", items: { $ref: "Notice#" } },
    featuredFacilities: { type: "array", items: { $ref: "Facility#" } },
  },
  required: ["banners", "featuredPrograms", "featuredAccommodations", "latestNotices", "featuredFacilities"],
} as const;

// ─── Request: Auth ────────────────────────────────────────────────────────────

export const S_LoginBody = {
  $id: "LoginBody",
  type: "object",
  required: ["loginId", "password"],
  properties: {
    loginId: { type: "string", description: "로그인 아이디" },
    password: { type: "string", description: "비밀번호" },
  },
} as const;

export const S_SignupBody = {
  $id: "SignupBody",
  type: "object",
  required: ["loginId", "email", "password", "name"],
  properties: {
    loginId: { type: "string", description: "로그인 아이디 (고유)" },
    email: { type: "string", format: "email" },
    password: { type: "string", minLength: 6 },
    name: { type: "string" },
    phone: { type: "string" },
  },
} as const;

export const S_RefreshBody = {
  $id: "RefreshBody",
  type: "object",
  required: ["refreshToken"],
  properties: {
    refreshToken: { type: "string" },
  },
} as const;

// ─── Request: Program ─────────────────────────────────────────────────────────

export const S_CreateProgramBody = {
  $id: "CreateProgramBody",
  type: "object",
  required: ["name", "description"],
  properties: {
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    durationMinutes: { type: "integer" },
    pricePerPerson: { type: "number" },
    minParticipants: { type: "integer" },
    maxParticipants: { type: "integer" },
    availableDays: { type: "array", items: { type: "string" } },
    operatingHours: { type: "string" },
    preparationNotes: { type: "string" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    mainOpenYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateProgramBody = {
  $id: "UpdateProgramBody",
  type: "object",
  properties: {
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    durationMinutes: { type: "integer" },
    pricePerPerson: { type: "number" },
    minParticipants: { type: "integer" },
    maxParticipants: { type: "integer" },
    availableDays: { type: "array", items: { type: "string" } },
    operatingHours: { type: "string" },
    preparationNotes: { type: "string" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    mainOpenYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Request: Accommodation ───────────────────────────────────────────────────

export const S_CreateAccommodationBody = {
  $id: "CreateAccommodationBody",
  type: "object",
  required: ["type", "name", "description"],
  properties: {
    type: { type: "string", enum: ["HWANGTO", "PENSION"] },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    amenities: { type: "array", items: { type: "string" } },
    checkInTime: { type: "string" },
    checkOutTime: { type: "string" },
    featuredYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateAccommodationBody = {
  $id: "UpdateAccommodationBody",
  type: "object",
  properties: {
    type: { type: "string", enum: ["HWANGTO", "PENSION"] },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    amenities: { type: "array", items: { type: "string" } },
    checkInTime: { type: "string" },
    checkOutTime: { type: "string" },
    featuredYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Request: Room ────────────────────────────────────────────────────────────

export const S_CreateRoomBody = {
  $id: "CreateRoomBody",
  type: "object",
  required: ["name", "baseGuests", "maxGuests", "weekdayPrice"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    baseGuests: { type: "integer" },
    maxGuests: { type: "integer" },
    weekdayPrice: { type: "number" },
    weekendPrice: { type: "number" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateRoomBody = {
  $id: "UpdateRoomBody",
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    baseGuests: { type: "integer" },
    maxGuests: { type: "integer" },
    weekdayPrice: { type: "number" },
    weekendPrice: { type: "number" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Request: Reservation ─────────────────────────────────────────────────────

export const S_ReservationLookupQuery = {
  $id: "ReservationLookupQuery",
  type: "object",
  required: ["name", "phone"],
  properties: {
    name: { type: "string" },
    phone: { type: "string" },
  },
} as const;

export const S_AvailabilityQuery = {
  $id: "AvailabilityQuery",
  type: "object",
  required: ["kind", "targetId", "startDate"],
  properties: {
    kind: { type: "string", enum: ["ACCOMMODATION", "PROGRAM"] },
    targetId: { type: "string" },
    sessionId: { type: "string" },
    roomId: { type: "string" },
    startDate: { type: "string", format: "date" },
    endDate: { type: "string", format: "date" },
  },
} as const;

export const S_CreateReservationBody = {
  $id: "CreateReservationBody",
  type: "object",
  required: ["kind", "targetId", "applicant", "startDate", "guests"],
  properties: {
    kind: { type: "string", enum: ["ACCOMMODATION", "PROGRAM"] },
    targetId: { type: "string" },
    sessionId: { type: "string" },
    roomId: { type: "string" },
    applicant: {
      type: "object",
      required: ["name", "phone"],
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
    startDate: { type: "string", format: "date" },
    endDate: { type: "string", format: "date" },
    guests: { type: "integer", minimum: 1 },
    requestMemo: { type: "string" },
  },
} as const;

export const S_UpdateReservationStatusBody = {
  $id: "UpdateReservationStatusBody",
  type: "object",
  required: ["status"],
  properties: {
    status: { type: "string", enum: ["PENDING", "REVIEWING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
    adminMemo: { type: "string" },
    totalPrice: { type: "number" },
  },
} as const;

// ─── Request: Notice ──────────────────────────────────────────────────────────

export const S_CreateNoticeBody = {
  $id: "CreateNoticeBody",
  type: "object",
  required: ["title", "body"],
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    pinnedYn: { type: "string", enum: ["Y", "N"] },
    openYn: { type: "string", enum: ["Y", "N"] },
  },
} as const;

export const S_UpdateNoticeBody = {
  $id: "UpdateNoticeBody",
  type: "object",
  properties: {
    title: { type: "string" },
    body: { type: "string" },
    pinnedYn: { type: "string", enum: ["Y", "N"] },
    openYn: { type: "string", enum: ["Y", "N"] },
  },
} as const;

// ─── Request: Gallery ─────────────────────────────────────────────────────────

export const S_CreateGalleryItemBody = {
  $id: "CreateGalleryItemBody",
  type: "object",
  required: ["imageId"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    imageId: { type: "string" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateGalleryItemBody = {
  $id: "UpdateGalleryItemBody",
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    imageId: { type: "string" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Request: Facility ────────────────────────────────────────────────────────

export const S_CreateFacilityBody = {
  $id: "CreateFacilityBody",
  type: "object",
  required: ["kind", "name", "description"],
  properties: {
    kind: { type: "string", enum: ["VILLAGE", "NEARBY"] },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    address: { $ref: "Address#" },
    location: { $ref: "GeoPoint#" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    mainOpenYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateFacilityBody = {
  $id: "UpdateFacilityBody",
  type: "object",
  properties: {
    kind: { type: "string", enum: ["VILLAGE", "NEARBY"] },
    name: { type: "string" },
    summary: { type: "string" },
    description: { type: "string" },
    address: { $ref: "Address#" },
    location: { $ref: "GeoPoint#" },
    mainImageId: { type: "string" },
    imageIds: { type: "array", items: { type: "string" } },
    mainOpenYn: { type: "string", enum: ["Y", "N"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Request: Banner ──────────────────────────────────────────────────────────

export const S_CreateBannerBody = {
  $id: "CreateBannerBody",
  type: "object",
  required: ["title", "imageId", "linkType"],
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    imageId: { type: "string" },
    linkType: { type: "string", enum: ["NONE", "PROGRAM", "ACCOMMODATION", "NOTICE", "FACILITY", "URL"] },
    linkValue: { type: "string" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateBannerBody = {
  $id: "UpdateBannerBody",
  type: "object",
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    imageId: { type: "string" },
    linkType: { type: "string", enum: ["NONE", "PROGRAM", "ACCOMMODATION", "NOTICE", "FACILITY", "URL"] },
    linkValue: { type: "string" },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Response: Menu ───────────────────────────────────────────────────────────

export const S_Menu = {
  $id: "Menu",
  type: "object",
  properties: {
    id: { type: "string" },
    groupId: { type: "string" },
    parentId: { type: "string" },
    menuCode: { type: "string" },
    menuName: { type: "string" },
    path: { type: "string" },
    icon: { type: "string" },
    target: { type: "string", enum: ["_self", "_blank"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    children: { type: "array", items: {} },
    ...timestampProps,
  },
  required: ["id", "groupId", "menuCode", "menuName", "target", "activeYn"],
} as const;

export const S_MenuGroup = {
  $id: "MenuGroup",
  type: "object",
  properties: {
    id: { type: "string" },
    groupCode: { type: "string" },
    groupName: { type: "string" },
    description: { type: "string" },
    useYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
    ...timestampProps,
  },
  required: ["id", "groupCode", "groupName", "useYn"],
} as const;

// ─── Request: Menu ────────────────────────────────────────────────────────────

export const S_CreateMenuGroupBody = {
  $id: "CreateMenuGroupBody",
  type: "object",
  required: ["groupCode", "groupName"],
  properties: {
    groupCode: { type: "string" },
    groupName: { type: "string" },
    description: { type: "string" },
    useYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_CreateMenuBody = {
  $id: "CreateMenuBody",
  type: "object",
  required: ["groupId", "menuCode", "menuName"],
  properties: {
    groupId: { type: "string" },
    parentId: { type: "string" },
    menuCode: { type: "string" },
    menuName: { type: "string" },
    path: { type: "string" },
    icon: { type: "string" },
    target: { type: "string", enum: ["_self", "_blank"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

export const S_UpdateMenuBody = {
  $id: "UpdateMenuBody",
  type: "object",
  properties: {
    menuName: { type: "string" },
    path: { type: "string" },
    icon: { type: "string" },
    target: { type: "string", enum: ["_self", "_blank"] },
    activeYn: { type: "string", enum: ["Y", "N"] },
    sortOrder: { type: "integer" },
  },
} as const;

// ─── Request: Village Profile ─────────────────────────────────────────────────

export const S_UpdateVillageProfileBody = {
  $id: "UpdateVillageProfileBody",
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    address: { $ref: "Address#" },
    location: { $ref: "GeoPoint#" },
    phone: { type: "string" },
    email: { type: "string", format: "email" },
    imageIds: { type: "array", items: { type: "string" } },
  },
} as const;

// ─── Register all schemas ─────────────────────────────────────────────────────

export function registerSchemas(app: FastifyInstance): void {
  const schemas = [
    // shared
    S_ImageRef, S_Address, S_GeoPoint, S_IdParam, S_ListQuery, S_OkResponse, S_ErrorResponse,
    // response entities
    S_UserInfo, S_AuthTokenResponse, S_RefreshTokenResponse,
    S_Program, S_ProgramSession, S_PagedPrograms,
    S_Accommodation, S_Room, S_PagedAccommodations, S_PagedRooms,
    S_Reservation, S_PagedReservations, S_AvailabilityResult,
    S_Notice, S_PagedNotices,
    S_GalleryItem, S_PagedGalleryItems,
    S_Facility, S_PagedFacilities,
    S_Banner, S_PagedBanners,
    S_VillageProfile, S_DashboardSummary, S_HomeResponse,
    // request bodies
    S_LoginBody, S_SignupBody, S_RefreshBody,
    S_CreateProgramBody, S_UpdateProgramBody,
    S_CreateAccommodationBody, S_UpdateAccommodationBody,
    S_CreateRoomBody, S_UpdateRoomBody,
    S_ReservationLookupQuery, S_AvailabilityQuery, S_CreateReservationBody, S_UpdateReservationStatusBody,
    S_CreateNoticeBody, S_UpdateNoticeBody,
    S_CreateGalleryItemBody, S_UpdateGalleryItemBody,
    S_CreateFacilityBody, S_UpdateFacilityBody,
    S_CreateBannerBody, S_UpdateBannerBody,
    S_UpdateVillageProfileBody,
    S_Menu, S_MenuGroup,
    S_CreateMenuGroupBody, S_CreateMenuBody, S_UpdateMenuBody,
  ];
  for (const schema of schemas) app.addSchema(schema);
}
