import type { FastifyInstance } from "fastify";
import type * as types from "@anduck/types";
import publicController from "../controllers/publicController";

const ERR = {
  400: { $ref: "ErrorResponse#" },
  404: { $ref: "ErrorResponse#" },
};

const registerPublicRoutes = async (app: FastifyInstance) => {
  app.get("/health", {
    schema: {
      tags: ["Health"],
      summary: "헬스 체크",
      response: { 200: { type: "object", properties: { ok: { type: "boolean" }, service: { type: "string" } }, required: ["ok", "service"] } },
    },
  }, publicController.health);

  app.get("/health/db", {
    schema: {
      tags: ["Health"],
      summary: "DB 연결 확인",
      response: { 200: { type: "object", properties: { ok: { type: "boolean" }, database: { type: "string" } }, required: ["ok", "database"] } },
    },
  }, publicController.healthDb);

  app.get("/home", {
    schema: {
      tags: ["Public"],
      summary: "홈 데이터 (배너·추천 프로그램·숙소·공지)",
      response: { 200: { $ref: "HomeResponse#" } },
    },
  }, publicController.getHome);

  app.get("/village/profile", {
    schema: {
      tags: ["Public"],
      summary: "마을 소개 정보",
      response: { 200: { $ref: "VillageProfile#" }, 404: { $ref: "ErrorResponse#" } },
    },
  }, publicController.getVillageProfile);

  // ─── Programs ──────────────────────────────────────────────────────────────

  app.get<{ Querystring: types.ListQuery }>("/programs", {
    schema: {
      tags: ["Programs"],
      summary: "체험 프로그램 목록",
      querystring: { $ref: "ListQuery#" },
      response: { 200: { $ref: "PagedPrograms#" } },
    },
  }, publicController.listPrograms);

  app.get<{ Params: { id: string } }>("/programs/:id", {
    schema: {
      tags: ["Programs"],
      summary: "체험 프로그램 상세",
      params: { $ref: "IdParam#" },
      response: { 200: { $ref: "Program#" }, ...ERR },
    },
  }, publicController.getProgram);

  // ─── Accommodations ────────────────────────────────────────────────────────

  app.get<{ Querystring: types.ListQuery }>("/accommodations", {
    schema: {
      tags: ["Accommodations"],
      summary: "숙소 목록",
      querystring: { $ref: "ListQuery#" },
      response: { 200: { $ref: "PagedAccommodations#" } },
    },
  }, publicController.listAccommodations);

  app.get<{ Params: { id: string } }>("/accommodations/:id", {
    schema: {
      tags: ["Accommodations"],
      summary: "숙소 상세",
      params: { $ref: "IdParam#" },
      response: { 200: { $ref: "Accommodation#" }, ...ERR },
    },
  }, publicController.getAccommodation);

  app.get<{ Params: { accommodationId: string }; Querystring: types.ListQuery }>(
    "/accommodations/:accommodationId/rooms",
    {
      schema: {
        tags: ["Accommodations"],
        summary: "객실 목록",
        params: {
          type: "object",
          properties: { accommodationId: { type: "string" } },
          required: ["accommodationId"],
        },
        querystring: { $ref: "ListQuery#" },
        response: { 200: { $ref: "PagedRooms#" } },
      },
    },
    publicController.listRooms,
  );

  app.get<{ Params: { accommodationId: string; roomId: string } }>(
    "/accommodations/:accommodationId/rooms/:roomId",
    {
      schema: {
        tags: ["Accommodations"],
        summary: "객실 상세",
        params: {
          type: "object",
          properties: {
            accommodationId: { type: "string" },
            roomId: { type: "string" },
          },
          required: ["accommodationId", "roomId"],
        },
        response: { 200: { $ref: "Room#" }, ...ERR },
      },
    },
    publicController.getRoom,
  );

  // ─── Reservations ──────────────────────────────────────────────────────────

  app.get<{ Querystring: types.ReservationLookupQuery }>("/reservations/lookup", {
    schema: {
      tags: ["Reservations"],
      summary: "예약 조회 (이름·전화번호)",
      querystring: { $ref: "ReservationLookupQuery#" },
      response: { 200: { type: "array", items: { $ref: "Reservation#" } }, ...ERR },
    },
  }, publicController.lookupReservations);

  app.get<{ Querystring: types.AvailabilityQuery }>("/reservations/availability", {
    schema: {
      tags: ["Reservations"],
      summary: "예약 가능 여부 확인",
      querystring: { $ref: "AvailabilityQuery#" },
      response: { 200: { $ref: "AvailabilityResult#" }, ...ERR },
    },
  }, publicController.checkAvailability);

  app.post<{ Body: types.CreateReservationInput }>("/reservations", {
    schema: {
      tags: ["Reservations"],
      summary: "예약 신청",
      body: { $ref: "CreateReservationBody#" },
      response: { 200: { $ref: "Reservation#" }, ...ERR },
    },
    preHandler: [app.optionalAuthenticate],
  }, publicController.createReservation);

  // ─── Notices ───────────────────────────────────────────────────────────────

  app.get<{ Querystring: types.ListQuery }>("/notices", {
    schema: {
      tags: ["Notices"],
      summary: "공지사항 목록",
      querystring: { $ref: "ListQuery#" },
      response: { 200: { $ref: "PagedNotices#" } },
    },
  }, publicController.listNotices);

  app.get<{ Params: { id: string } }>("/notices/:id", {
    schema: {
      tags: ["Notices"],
      summary: "공지사항 상세",
      params: { $ref: "IdParam#" },
      response: { 200: { $ref: "Notice#" }, ...ERR },
    },
  }, publicController.getNotice);

  // ─── Gallery ───────────────────────────────────────────────────────────────

  app.get<{ Querystring: types.ListQuery }>("/gallery", {
    schema: {
      tags: ["Gallery"],
      summary: "갤러리 목록",
      querystring: { $ref: "ListQuery#" },
      response: { 200: { $ref: "PagedGalleryItems#" } },
    },
  }, publicController.listGallery);

  app.get<{ Params: { id: string } }>("/gallery/:id", {
    schema: {
      tags: ["Gallery"],
      summary: "갤러리 상세",
      params: { $ref: "IdParam#" },
      response: { 200: { $ref: "GalleryItem#" }, ...ERR },
    },
  }, publicController.getGalleryItem);

  // ─── Facilities ────────────────────────────────────────────────────────────

  app.get<{ Querystring: types.ListQuery }>("/facilities", {
    schema: {
      tags: ["Facilities"],
      summary: "시설 목록",
      querystring: { $ref: "ListQuery#" },
      response: { 200: { $ref: "PagedFacilities#" } },
    },
  }, publicController.listFacilities);

  app.get<{ Params: { id: string } }>("/facilities/:id", {
    schema: {
      tags: ["Facilities"],
      summary: "시설 상세",
      params: { $ref: "IdParam#" },
      response: { 200: { $ref: "Facility#" }, ...ERR },
    },
  }, publicController.getFacility);
};

export default registerPublicRoutes;
