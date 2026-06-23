import type { FastifyInstance } from "fastify";
import type * as types from "@anduck/types";
import adminController from "../controllers/adminController";

const SEC = { security: [{ bearerAuth: [] }] };
const ERR = { 400: { $ref: "ErrorResponse#" }, 401: { $ref: "ErrorResponse#" }, 404: { $ref: "ErrorResponse#" } };

const registerAdminRoutes = async (app: FastifyInstance) => {
  app.addHook("preHandler", app.authenticate);

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  app.get("/admin/dashboard", {
    schema: {
      tags: ["Admin / Dashboard"],
      summary: "대시보드 요약",
      ...SEC,
      response: { 200: { $ref: "DashboardSummary#" }, ...ERR },
    },
  }, adminController.getDashboard);

  // ─── Village Profile ────────────────────────────────────────────────────────
  app.patch<{ Body: types.UpdateVillageProfileInput }>("/admin/village/profile", {
    schema: {
      tags: ["Admin / Village"],
      summary: "마을 소개 수정",
      body: { $ref: "UpdateVillageProfileBody#" },
      ...SEC,
      response: { 200: { $ref: "VillageProfile#" }, ...ERR },
    },
  }, adminController.updateVillageProfile);

  // ─── Programs ───────────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/programs", {
    schema: {
      tags: ["Admin / Programs"],
      summary: "프로그램 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedPrograms#" }, ...ERR },
    },
  }, adminController.listPrograms);

  app.post<{ Body: types.CreateProgramInput }>("/admin/programs", {
    schema: {
      tags: ["Admin / Programs"],
      summary: "프로그램 생성",
      body: { $ref: "CreateProgramBody#" },
      ...SEC,
      response: { 200: { $ref: "Program#" }, ...ERR },
    },
  }, adminController.createProgram);

  app.patch<{ Params: { id: string }; Body: types.UpdateProgramInput }>("/admin/programs/:id", {
    schema: {
      tags: ["Admin / Programs"],
      summary: "프로그램 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateProgramBody#" },
      ...SEC,
      response: { 200: { $ref: "Program#" }, ...ERR },
    },
  }, adminController.updateProgram);

  app.delete<{ Params: { id: string } }>("/admin/programs/:id", {
    schema: {
      tags: ["Admin / Programs"],
      summary: "프로그램 삭제 (비활성화)",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Program#" }, ...ERR },
    },
  }, adminController.removeProgram);

  // ─── Accommodations ─────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/accommodations", {
    schema: {
      tags: ["Admin / Accommodations"],
      summary: "숙소 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedAccommodations#" }, ...ERR },
    },
  }, adminController.listAccommodations);

  app.post<{ Body: types.CreateAccommodationInput }>("/admin/accommodations", {
    schema: {
      tags: ["Admin / Accommodations"],
      summary: "숙소 생성",
      body: { $ref: "CreateAccommodationBody#" },
      ...SEC,
      response: { 200: { $ref: "Accommodation#" }, ...ERR },
    },
  }, adminController.createAccommodation);

  app.patch<{ Params: { id: string }; Body: types.UpdateAccommodationInput }>("/admin/accommodations/:id", {
    schema: {
      tags: ["Admin / Accommodations"],
      summary: "숙소 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateAccommodationBody#" },
      ...SEC,
      response: { 200: { $ref: "Accommodation#" }, ...ERR },
    },
  }, adminController.updateAccommodation);

  app.delete<{ Params: { id: string } }>("/admin/accommodations/:id", {
    schema: {
      tags: ["Admin / Accommodations"],
      summary: "숙소 삭제 (비활성화)",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Accommodation#" }, ...ERR },
    },
  }, adminController.removeAccommodation);

  // ─── Rooms ──────────────────────────────────────────────────────────────────
  app.get<{ Params: { accommodationId: string }; Querystring: types.ListQuery }>(
    "/admin/accommodations/:accommodationId/rooms",
    {
      schema: {
        tags: ["Admin / Accommodations"],
        summary: "객실 목록",
        params: {
          type: "object",
          properties: { accommodationId: { type: "string" } },
          required: ["accommodationId"],
        },
        querystring: { $ref: "ListQuery#" },
        ...SEC,
        response: { 200: { $ref: "PagedRooms#" }, ...ERR },
      },
    },
    adminController.listRooms,
  );

  app.post<{ Params: { accommodationId: string }; Body: types.CreateRoomInput }>(
    "/admin/accommodations/:accommodationId/rooms",
    {
      schema: {
        tags: ["Admin / Accommodations"],
        summary: "객실 생성",
        params: {
          type: "object",
          properties: { accommodationId: { type: "string" } },
          required: ["accommodationId"],
        },
        body: { $ref: "CreateRoomBody#" },
        ...SEC,
        response: { 200: { $ref: "Room#" }, ...ERR },
      },
    },
    adminController.createRoom,
  );

  app.patch<{ Params: { accommodationId: string; roomId: string }; Body: types.UpdateRoomInput }>(
    "/admin/accommodations/:accommodationId/rooms/:roomId",
    {
      schema: {
        tags: ["Admin / Accommodations"],
        summary: "객실 수정",
        params: {
          type: "object",
          properties: { accommodationId: { type: "string" }, roomId: { type: "string" } },
          required: ["accommodationId", "roomId"],
        },
        body: { $ref: "UpdateRoomBody#" },
        ...SEC,
        response: { 200: { $ref: "Room#" }, ...ERR },
      },
    },
    adminController.updateRoom,
  );

  app.delete<{ Params: { accommodationId: string; roomId: string } }>(
    "/admin/accommodations/:accommodationId/rooms/:roomId",
    {
      schema: {
        tags: ["Admin / Accommodations"],
        summary: "객실 삭제 (비활성화)",
        params: {
          type: "object",
          properties: { accommodationId: { type: "string" }, roomId: { type: "string" } },
          required: ["accommodationId", "roomId"],
        },
        ...SEC,
        response: { 200: { $ref: "Room#" }, ...ERR },
      },
    },
    adminController.removeRoom,
  );

  // ─── Reservations ───────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/reservations", {
    schema: {
      tags: ["Admin / Reservations"],
      summary: "예약 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedReservations#" }, ...ERR },
    },
  }, adminController.listReservations);

  app.get<{ Params: { id: string } }>("/admin/reservations/:id", {
    schema: {
      tags: ["Admin / Reservations"],
      summary: "예약 상세",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Reservation#" }, ...ERR },
    },
  }, adminController.getReservation);

  app.patch<{ Params: { id: string }; Body: types.UpdateReservationStatusInput }>(
    "/admin/reservations/:id/status",
    {
      schema: {
        tags: ["Admin / Reservations"],
        summary: "예약 상태 변경",
        params: { $ref: "IdParam#" },
        body: { $ref: "UpdateReservationStatusBody#" },
        ...SEC,
        response: { 200: { $ref: "Reservation#" }, ...ERR },
      },
    },
    adminController.updateReservationStatus,
  );

  // ─── Notices ────────────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/notices", {
    schema: {
      tags: ["Admin / Notices"],
      summary: "공지사항 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedNotices#" }, ...ERR },
    },
  }, adminController.listNotices);

  app.post<{ Body: types.CreateNoticeInput }>("/admin/notices", {
    schema: {
      tags: ["Admin / Notices"],
      summary: "공지사항 생성",
      body: { $ref: "CreateNoticeBody#" },
      ...SEC,
      response: { 200: { $ref: "Notice#" }, ...ERR },
    },
  }, adminController.createNotice);

  app.patch<{ Params: { id: string }; Body: types.UpdateNoticeInput }>("/admin/notices/:id", {
    schema: {
      tags: ["Admin / Notices"],
      summary: "공지사항 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateNoticeBody#" },
      ...SEC,
      response: { 200: { $ref: "Notice#" }, ...ERR },
    },
  }, adminController.updateNotice);

  app.delete<{ Params: { id: string } }>("/admin/notices/:id", {
    schema: {
      tags: ["Admin / Notices"],
      summary: "공지사항 삭제 (비활성화)",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Notice#" }, ...ERR },
    },
  }, adminController.removeNotice);

  // ─── Gallery ────────────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/gallery", {
    schema: {
      tags: ["Admin / Gallery"],
      summary: "갤러리 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedGalleryItems#" }, ...ERR },
    },
  }, adminController.listGallery);

  app.post<{ Body: types.CreateGalleryItemInput }>("/admin/gallery", {
    schema: {
      tags: ["Admin / Gallery"],
      summary: "갤러리 항목 생성",
      body: { $ref: "CreateGalleryItemBody#" },
      ...SEC,
      response: { 200: { $ref: "GalleryItem#" }, ...ERR },
    },
  }, adminController.createGalleryItem);

  app.patch<{ Params: { id: string }; Body: types.UpdateGalleryItemInput }>("/admin/gallery/:id", {
    schema: {
      tags: ["Admin / Gallery"],
      summary: "갤러리 항목 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateGalleryItemBody#" },
      ...SEC,
      response: { 200: { $ref: "GalleryItem#" }, ...ERR },
    },
  }, adminController.updateGalleryItem);

  app.delete<{ Params: { id: string } }>("/admin/gallery/:id", {
    schema: {
      tags: ["Admin / Gallery"],
      summary: "갤러리 항목 삭제 (비활성화)",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "GalleryItem#" }, ...ERR },
    },
  }, adminController.removeGalleryItem);

  // ─── Facilities ─────────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/facilities", {
    schema: {
      tags: ["Admin / Facilities"],
      summary: "시설 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedFacilities#" }, ...ERR },
    },
  }, adminController.listFacilities);

  app.get<{ Params: { id: string } }>("/admin/facilities/:id", {
    schema: {
      tags: ["Admin / Facilities"],
      summary: "시설 상세",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Facility#" }, ...ERR },
    },
  }, adminController.getFacility);

  app.post<{ Body: types.CreateFacilityInput }>("/admin/facilities", {
    schema: {
      tags: ["Admin / Facilities"],
      summary: "시설 생성",
      body: { $ref: "CreateFacilityBody#" },
      ...SEC,
      response: { 200: { $ref: "Facility#" }, ...ERR },
    },
  }, adminController.createFacility);

  app.patch<{ Params: { id: string }; Body: types.UpdateFacilityInput }>("/admin/facilities/:id", {
    schema: {
      tags: ["Admin / Facilities"],
      summary: "시설 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateFacilityBody#" },
      ...SEC,
      response: { 200: { $ref: "Facility#" }, ...ERR },
    },
  }, adminController.updateFacility);

  app.delete<{ Params: { id: string } }>("/admin/facilities/:id", {
    schema: {
      tags: ["Admin / Facilities"],
      summary: "시설 삭제 (비활성화)",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Facility#" }, ...ERR },
    },
  }, adminController.removeFacility);

  // ─── Banners ────────────────────────────────────────────────────────────────
  app.get<{ Querystring: types.ListQuery }>("/admin/banners", {
    schema: {
      tags: ["Admin / Banners"],
      summary: "배너 목록",
      querystring: { $ref: "ListQuery#" },
      ...SEC,
      response: { 200: { $ref: "PagedBanners#" }, ...ERR },
    },
  }, adminController.listBanners);

  app.post<{ Body: types.CreateBannerInput }>("/admin/banners", {
    schema: {
      tags: ["Admin / Banners"],
      summary: "배너 생성",
      body: { $ref: "CreateBannerBody#" },
      ...SEC,
      response: { 200: { $ref: "Banner#" }, ...ERR },
    },
  }, adminController.createBanner);

  app.patch<{ Params: { id: string }; Body: types.UpdateBannerInput }>("/admin/banners/:id", {
    schema: {
      tags: ["Admin / Banners"],
      summary: "배너 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateBannerBody#" },
      ...SEC,
      response: { 200: { $ref: "Banner#" }, ...ERR },
    },
  }, adminController.updateBanner);

  app.delete<{ Params: { id: string } }>("/admin/banners/:id", {
    schema: {
      tags: ["Admin / Banners"],
      summary: "배너 삭제 (비활성화)",
      params: { $ref: "IdParam#" },
      ...SEC,
      response: { 200: { $ref: "Banner#" }, ...ERR },
    },
  }, adminController.removeBanner);
};

export default registerAdminRoutes;
