import type * as types from "@anduck/types";
import * as db from "../utils/db";
import * as utils from "../utils";
import imagesService from "./imagesService";
import mappers from "./mappers";
import accommodationService from "./accommodationService";
import programService from "./programService";

const adminService = {
  // ─── re-exported from specialized services ────────────────────────────────
  listAdminAccommodations: accommodationService.listAccommodations,
  createAdminAccommodation: accommodationService.createAccommodation,
  updateAdminAccommodation: accommodationService.updateAccommodation,
  removeAdminAccommodation: accommodationService.removeAccommodation,
  listAdminRooms: accommodationService.listRooms,
  createAdminRoom: accommodationService.createRoom,
  updateAdminRoom: accommodationService.updateRoom,
  removeAdminRoom: accommodationService.removeRoom,
  listAdminPrograms: programService.listPrograms,
  createAdminProgram: programService.createProgram,
  updateAdminProgram: programService.updateProgram,
  removeAdminProgram: programService.removeProgram,

  // ─── Dashboard ────────────────────────────────────────────────────────────
  async getDashboardSummary() {
    const [todayCount, pendingCount, activeProgramCount, activeAccommodationCount, recentReservations] =
      await Promise.all([
        db.queryOne<{ count: string }>("reservation", "countTodayReservations"),
        db.queryOne<{ count: string }>("reservation", "countPendingReservations"),
        db.queryOne<{ count: string }>("program", "countActivePrograms"),
        db.queryOne<{ count: string }>("accommodation", "countActiveAccommodations"),
        db.query("reservation", "listRecentReservations", { limit: 5 }),
      ]);

    return {
      todayReservationCount: Number(todayCount?.count ?? 0),
      pendingReservationCount: Number(pendingCount?.count ?? 0),
      activeProgramCount: Number(activeProgramCount?.count ?? 0),
      activeAccommodationCount: Number(activeAccommodationCount?.count ?? 0),
      recentReservations: (recentReservations as any[]).map(mappers.mapReservation),
    };
  },

  // ─── Village Profile ──────────────────────────────────────────────────────
  async updateVillageProfile(body: types.UpdateVillageProfileInput) {
    const current = await db.queryOne<{ id: string }>("content", "getVillageProfile");
    const params = {
      name: body.name ?? null,
      description: body.description ?? null,
      address: body.address ? utils.pgJsonb(body.address) : null,
      latitude: body.location?.latitude ?? null,
      longitude: body.location?.longitude ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      imageIds: body.imageIds != null ? utils.pgBigintArr(body.imageIds) : null,
    };

    let row: any;
    if (current) {
      row = await db.queryOne("content", "updateVillageProfile", { id: utils.pgId(current.id), ...params });
    } else {
      row = await db.queryOne("content", "createVillageProfile", {
        name: body.name ?? "안덕 건강힐링체험마을",
        description: body.description ?? "",
        address: utils.pgJsonb(body.address ?? { address1: "" }),
        latitude: params.latitude,
        longitude: params.longitude,
        phone: params.phone,
        email: params.email,
        imageIds: utils.pgBigintArr(body.imageIds),
      });
    }
    if (!row) throw new Error("마을 정보 업데이트에 실패했습니다");
    const r = row as any;
    const imgs = await imagesService.getImages((r.imageIds as string[]) ?? []);
    return mappers.mapVillageProfile(r, imgs);
  },

  // ─── Reservations ─────────────────────────────────────────────────────────
  async listAdminReservations(q: types.ListQuery) {
    const lo = utils.limitOffsetSQL(q);
    const params = { status: (q as any).status ?? null, kind: (q as any).kind ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("reservation", "listReservations", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("reservation", "countReservations", params),
    ]);
    const items = (rows as any[]).map(mappers.mapReservation);
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getAdminReservation(id: string) {
    const row = await db.queryOne("reservation", "getReservationById", { id: utils.pgId(id) });
    return row ? mappers.mapReservation(row as any) : null;
  },

  async updateAdminReservationStatus(id: string, body: types.UpdateReservationStatusInput) {
    const row = await db.queryOne("reservation", "updateReservationStatus", {
      id: utils.pgId(id),
      status: body.status,
      adminMemo: body.adminMemo ?? null,
    });
    if (!row) throw new Error("예약을 찾을 수 없습니다");
    return mappers.mapReservation(row as any);
  },

  // ─── Notices ──────────────────────────────────────────────────────────────
  async listAdminNotices(q: types.ListQuery) {
    const lo = utils.limitOffsetSQL(q);
    const params = { openYn: q.useYn ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("notice", "listNotices", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("notice", "countNotices", params),
    ]);
    const items = (rows as any[]).map(mappers.mapNotice);
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async createAdminNotice(body: types.CreateNoticeInput, userId?: string) {
    const authorId = userId
      ? utils.pgId(userId)
      : (await db.queryOne<{ id: string }>("auth", "getFirstUserId"))?.id ?? "1";
    const row = await db.queryOne("notice", "createNotice", {
      title: body.title,
      body: body.body,
      pinnedYn: body.pinnedYn ?? "N",
      openYn: body.openYn ?? "Y",
      authorId,
    });
    if (!row) throw new Error("공지사항 생성에 실패했습니다");
    return mappers.mapNotice(row as any);
  },

  async updateAdminNotice(id: string, body: types.UpdateNoticeInput, userId?: string) {
    const row = await db.queryOne("notice", "updateNotice", {
      id: utils.pgId(id),
      title: body.title ?? null,
      body: body.body ?? null,
      pinnedYn: body.pinnedYn ?? null,
      openYn: body.openYn ?? null,
      updatedBy: utils.pgId(userId),
    });
    if (!row) throw new Error("공지사항을 찾을 수 없습니다");
    return mappers.mapNotice(row as any);
  },

  async removeAdminNotice(id: string, userId?: string) {
    return adminService.updateAdminNotice(id, { openYn: "N" }, userId);
  },

  // ─── Gallery ──────────────────────────────────────────────────────────────
  async listAdminGallery(q: types.ListQuery) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: q.useYn ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("gallery", "listGalleryItems", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("gallery", "countGalleryItems", params),
    ]);
    const imgs = await imagesService.getImages(mappers.singleImageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapGalleryItem(r, imgs.get(r.imageId)));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async createAdminGalleryItem(body: types.CreateGalleryItemInput, userId?: string) {
    const row = await db.queryOne("gallery", "createGalleryItem", {
      title: body.title,
      description: body.description ?? null,
      imageId: utils.pgId(body.imageId),
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("갤러리 항목 생성에 실패했습니다");
    const r = row as any;
    const imgs = await imagesService.getImages([r.imageId]);
    return mappers.mapGalleryItem(r, imgs.get(r.imageId));
  },

  async updateAdminGalleryItem(id: string, body: types.UpdateGalleryItemInput) {
    const row = await db.queryOne("gallery", "updateGalleryItem", {
      id: utils.pgId(id),
      title: body.title ?? null,
      description: body.description ?? null,
      imageId: body.imageId ? utils.pgId(body.imageId) : null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
    });
    if (!row) throw new Error("갤러리 항목을 찾을 수 없습니다");
    const r = row as any;
    const imgs = await imagesService.getImages([r.imageId]);
    return mappers.mapGalleryItem(r, imgs.get(r.imageId));
  },

  async removeAdminGalleryItem(id: string) {
    return adminService.updateAdminGalleryItem(id, { activeYn: "N" });
  },

  // ─── Facilities ───────────────────────────────────────────────────────────
  async getAdminFacility(id: string) {
    const row = await db.queryOne("facility", "getFacilityById", { id: utils.pgId(id), activeYn: null });
    if (!row) return null;
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapFacility(row as any, imgs);
  },

  async listAdminFacilities(q: types.ListQuery) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: q.useYn ?? null, mainOpenYn: null, kind: (q as any).kind ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("facility", "listFacilities", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("facility", "countFacilities", params),
    ]);
    const imgs = await imagesService.getImages(mappers.imageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapFacility(r, imgs));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async createAdminFacility(body: types.CreateFacilityInput, userId?: string) {
    const row = await db.queryOne("facility", "createFacility", {
      kind: body.kind,
      name: body.name,
      summary: body.summary ?? null,
      description: body.description ?? null,
      address: body.address ? utils.pgJsonb(body.address) : "NULL",
      latitude: body.location?.latitude ?? null,
      longitude: body.location?.longitude ?? null,
      mainImageId: utils.pgId(body.mainImageId),
      imageIds: utils.pgBigintArr(body.imageIds),
      mainOpenYn: body.mainOpenYn ?? "N",
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("시설 생성에 실패했습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapFacility(row as any, imgs);
  },

  async updateAdminFacility(id: string, body: types.UpdateFacilityInput, userId?: string) {
    const row = await db.queryOne("facility", "updateFacility", {
      id: utils.pgId(id),
      kind: body.kind ?? null,
      name: body.name ?? null,
      summary: body.summary ?? null,
      description: body.description ?? null,
      address: body.address ? utils.pgJsonb(body.address) : null,
      latitude: body.location?.latitude ?? null,
      longitude: body.location?.longitude ?? null,
      mainImageId: body.mainImageId !== undefined ? utils.pgId(body.mainImageId) : null,
      imageIds: body.imageIds != null ? utils.pgBigintArr(body.imageIds) : null,
      mainOpenYn: body.mainOpenYn ?? null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
    });
    if (!row) throw new Error("시설을 찾을 수 없습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapFacility(row as any, imgs);
  },

  async removeAdminFacility(id: string) {
    return adminService.updateAdminFacility(id, { activeYn: "N" });
  },

  // ─── Banners ──────────────────────────────────────────────────────────────
  async listAdminBanners(q: types.ListQuery) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: q.useYn ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("banner", "listBanners", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("banner", "countBanners", params),
    ]);
    const imgs = await imagesService.getImages(mappers.singleImageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapBanner(r, imgs.get(r.imageId)));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async createAdminBanner(body: types.CreateBannerInput) {
    const row = await db.queryOne("banner", "createBanner", {
      title: body.title,
      subtitle: body.subtitle ?? null,
      imageId: utils.pgId(body.imageId),
      linkType: body.linkType ?? "NONE",
      linkValue: body.linkValue ?? null,
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
    });
    if (!row) throw new Error("배너 생성에 실패했습니다");
    const r = row as any;
    const imgs = await imagesService.getImages([r.imageId]);
    return mappers.mapBanner(r, imgs.get(r.imageId));
  },

  async updateAdminBanner(id: string, body: types.UpdateBannerInput) {
    const row = await db.queryOne("banner", "updateBanner", {
      id: utils.pgId(id),
      title: body.title ?? null,
      subtitle: body.subtitle ?? null,
      imageId: body.imageId ? utils.pgId(body.imageId) : null,
      linkType: body.linkType ?? null,
      linkValue: body.linkValue ?? null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
    });
    if (!row) throw new Error("배너를 찾을 수 없습니다");
    const r = row as any;
    const imgs = await imagesService.getImages([r.imageId]);
    return mappers.mapBanner(r, imgs.get(r.imageId));
  },

  async removeAdminBanner(id: string) {
    return adminService.updateAdminBanner(id, { activeYn: "N" });
  },
};

export default adminService;
