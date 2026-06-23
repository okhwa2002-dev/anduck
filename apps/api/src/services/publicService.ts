import type * as types from "@anduck/types";
import * as db from "../utils/db";
import * as utils from "../utils";
import imagesService from "./imagesService";
import mappers from "./mappers";

const publicService = {
  async getHome() {
    const [banners, featuredPrograms, featuredAccommodations, latestNotices, featuredFacilities] =
      await Promise.all([
        db.query("banner", "listBanners", { activeYn: "Y", limitOffset: "LIMIT 10" }),
        db.query("program", "listPrograms", { activeYn: "Y", mainOpenYn: "Y", q: null, limitOffset: "LIMIT 10" }),
        db.query("accommodation", "listAccommodations", { activeYn: "Y", featuredYn: "Y", q: null, limitOffset: "LIMIT 10" }),
        db.query("notice", "listLatestNotices"),
        db.query("facility", "listFacilities", { activeYn: "Y", mainOpenYn: "Y", kind: null, q: null, limitOffset: "LIMIT 10" }),
      ]);

    const bannerRows = banners as any[];
    const programRows = featuredPrograms as any[];
    const accommodationRows = featuredAccommodations as any[];
    const facilityRows = featuredFacilities as any[];
    const noticeRows = latestNotices as any[];

    const bannerImgIds = mappers.singleImageIdsFrom(bannerRows);
    const contentImgIds = mappers.imageIdsFrom([...programRows, ...accommodationRows, ...facilityRows]);
    const allImgIds = [...new Set([...bannerImgIds, ...contentImgIds])];
    const imgs = await imagesService.getImages(allImgIds);

    return {
      banners: bannerRows.map((r) => mappers.mapBanner(r, imgs.get(r.imageId))),
      featuredPrograms: programRows.map((r) => mappers.mapProgram(r, imgs)),
      featuredAccommodations: accommodationRows.map((r) => mappers.mapAccommodation(r, imgs)),
      latestNotices: noticeRows.map(mappers.mapNotice),
      featuredFacilities: facilityRows.map((r) => mappers.mapFacility(r, imgs)),
    };
  },

  async getVillageProfile() {
    const row = await db.queryOne("content", "getVillageProfile");
    if (!row) return null;
    const r = row as any;
    const imgs = await imagesService.getImages((r.imageIds as string[]) ?? []);
    return mappers.mapVillageProfile(r, imgs);
  },

  async listPrograms(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: "Y", mainOpenYn: q.mainOpenYn ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("program", "listPrograms", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("program", "countPrograms", params),
    ]);
    const imgs = await imagesService.getImages(mappers.imageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapProgram(r, imgs));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getProgram(id: string) {
    const row = await db.queryOne("program", "getProgramById", { id: utils.pgId(id) });
    if (!row) return null;
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapProgram(row as any, imgs);
  },

  async listAccommodations(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: "Y", featuredYn: q.featuredYn ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("accommodation", "listAccommodations", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("accommodation", "countAccommodations", params),
    ]);
    const imgs = await imagesService.getImages(mappers.imageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapAccommodation(r, imgs));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getAccommodation(id: string) {
    const row = await db.queryOne("accommodation", "getAccommodationById", { id: utils.pgId(id) });
    if (!row) return null;
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapAccommodation(row as any, imgs);
  },

  async listRooms(accommodationId: string, q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const accId = utils.pgId(accommodationId);
    const params = { accommodationId: accId, activeYn: "Y" };
    const [rows, countRow] = await Promise.all([
      db.query("accommodation", "listRooms", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("accommodation", "countRooms", params),
    ]);
    const imgs = await imagesService.getImages(mappers.imageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapRoom(r, imgs));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getRoom(accommodationId: string, roomId: string) {
    const row = await db.queryOne("accommodation", "getRoomById", {
      id: utils.pgId(roomId),
      accommodationId: utils.pgId(accommodationId),
    });
    if (!row) return null;
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapRoom(row as any, imgs);
  },

  async lookupReservations(q: types.ReservationLookupQuery) {
    const rows = await db.query("reservation", "lookupReservations", { name: q.name, phone: q.phone });
    return (rows as any[]).map(mappers.mapReservation);
  },

  async checkAvailability(q: types.AvailabilityQuery) {
    const rows = await db.query("reservation", "checkAvailability", {
      kind: q.kind,
      targetId: utils.pgId(q.targetId),
      startDate: q.startDate,
      roomId: q.roomId ? utils.pgId(q.roomId) : null,
    });
    return {
      available: rows.length === 0,
      conflictingDates: (rows as any[]).map((r) =>
        r.startDate instanceof Date ? r.startDate.toISOString().slice(0, 10) : String(r.startDate).slice(0, 10),
      ),
    };
  },

  async createReservation(body: types.CreateReservationInput, userId?: string) {
    const targetRow = body.kind === "PROGRAM"
      ? await db.queryOne<{ name: string }>("program", "getProgramName", { id: utils.pgId(body.targetId) })
      : await db.queryOne<{ name: string }>("accommodation", "getAccommodationName", { id: utils.pgId(body.targetId) });
    const roomRow = body.roomId
      ? await db.queryOne<{ name: string }>("accommodation", "getRoomName", { id: utils.pgId(body.roomId) })
      : null;
    const row = await db.queryOne("reservation", "createReservation", {
      kind: body.kind,
      applicantName: body.applicant.name,
      applicantPhone: body.applicant.phone,
      applicantEmail: body.applicant.email ?? null,
      userId: utils.pgId(userId),
      targetId: utils.pgId(body.targetId),
      targetName: targetRow?.name ?? body.targetId,
      roomId: body.roomId ? utils.pgId(body.roomId) : "NULL",
      roomName: roomRow?.name ?? null,
      sessionId: body.sessionId ? utils.pgId(body.sessionId) : "NULL",
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      guests: body.guests ?? null,
      requestMemo: body.requestMemo ?? null,
    });
    if (!row) throw new Error("예약 생성에 실패했습니다");
    return mappers.mapReservation(row as any);
  },

  async listNotices(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { openYn: "Y", q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("notice", "listNotices", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("notice", "countNotices", params),
    ]);
    const items = (rows as any[]).map(mappers.mapNotice);
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getNotice(id: string) {
    const row = await db.queryOne("notice", "getNoticeById", { id: utils.pgId(id), openYn: "Y" });
    return row ? mappers.mapNotice(row as any) : null;
  },

  async listGallery(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: "Y", q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("gallery", "listGalleryItems", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("gallery", "countGalleryItems", params),
    ]);
    const imgs = await imagesService.getImages(mappers.singleImageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapGalleryItem(r, imgs.get(r.imageId)));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getGalleryItem(id: string) {
    const row = await db.queryOne("gallery", "getGalleryItemById", { id: utils.pgId(id), activeYn: "Y" });
    if (!row) return null;
    const r = row as any;
    const imgs = await imagesService.getImages([r.imageId]);
    return mappers.mapGalleryItem(r, imgs.get(r.imageId));
  },

  async listFacilities(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: "Y", mainOpenYn: (q as any).mainOpenYn ?? null, kind: (q as any).kind ?? null, q: q.q ?? null };
    const [rows, countRow] = await Promise.all([
      db.query("facility", "listFacilities", { ...params, limitOffset: lo }),
      q.all ? null : db.queryOne<{ total: string }>("facility", "countFacilities", params),
    ]);
    const imgs = await imagesService.getImages(mappers.imageIdsFrom(rows as any[]));
    const items = (rows as any[]).map((r) => mappers.mapFacility(r, imgs));
    return utils.toPaged(items, q.all ? items.length : Number(countRow?.total ?? 0), q);
  },

  async getFacility(id: string) {
    const row = await db.queryOne("facility", "getFacilityById", { id: utils.pgId(id), activeYn: "Y" });
    if (!row) return null;
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapFacility(row as any, imgs);
  },
};

export default publicService;
