import type * as types from "@anduck/types";
import * as db from "../utils/db";
import * as utils from "../utils";
import imagesService from "./imagesService";
import mappers from "./mappers";

const accommodationService = {
  async listAccommodations(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: q.useYn ?? "Y", featuredYn: q.featuredYn ?? null, q: q.q ?? null };
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

  async createAccommodation(body: types.CreateAccommodationInput, userId?: string) {
    const row = await db.queryOne("accommodation", "createAccommodation", {
      type: body.type,
      name: body.name,
      summary: body.summary ?? null,
      description: body.description,
      mainImageId: utils.pgId(body.mainImageId),
      imageIds: utils.pgBigintArr(body.imageIds),
      amenities: utils.pgTextArr(body.amenities),
      checkInTime: body.checkInTime ?? null,
      checkOutTime: body.checkOutTime ?? null,
      featuredYn: body.featuredYn ?? "N",
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("숙소 생성에 실패했습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapAccommodation(row as any, imgs);
  },

  async updateAccommodation(id: string, body: types.UpdateAccommodationInput, userId?: string) {
    const row = await db.queryOne("accommodation", "updateAccommodation", {
      id: utils.pgId(id),
      type: body.type ?? null,
      name: body.name ?? null,
      summary: body.summary ?? null,
      description: body.description ?? null,
      mainImageId: body.mainImageId !== undefined ? utils.pgId(body.mainImageId) : null,
      imageIds: body.imageIds != null ? utils.pgBigintArr(body.imageIds) : null,
      amenities: body.amenities != null ? utils.pgTextArr(body.amenities) : null,
      checkInTime: body.checkInTime ?? null,
      checkOutTime: body.checkOutTime ?? null,
      featuredYn: body.featuredYn ?? null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
      updatedBy: utils.pgId(userId),
    });
    if (!row) throw new Error("숙소를 찾을 수 없습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapAccommodation(row as any, imgs);
  },

  async removeAccommodation(id: string, userId?: string) {
    return accommodationService.updateAccommodation(id, { activeYn: "N" }, userId);
  },

  async listRooms(accommodationId: string, q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const accId = utils.pgId(accommodationId);
    const params = { accommodationId: accId, activeYn: q.useYn ?? "Y" };
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

  async createRoom(accommodationId: string, body: types.CreateRoomInput, userId?: string) {
    const row = await db.queryOne("accommodation", "createRoom", {
      accommodationId: utils.pgId(accommodationId),
      name: body.name,
      description: body.description ?? null,
      baseGuests: body.baseGuests,
      maxGuests: body.maxGuests,
      weekdayPrice: body.weekdayPrice,
      weekendPrice: body.weekendPrice ?? null,
      mainImageId: utils.pgId(body.mainImageId),
      imageIds: utils.pgBigintArr(body.imageIds),
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("객실 생성에 실패했습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapRoom(row as any, imgs);
  },

  async updateRoom(accommodationId: string, roomId: string, body: types.UpdateRoomInput, userId?: string) {
    const row = await db.queryOne("accommodation", "updateRoom", {
      id: utils.pgId(roomId),
      name: body.name ?? null,
      description: body.description ?? null,
      baseGuests: body.baseGuests ?? null,
      maxGuests: body.maxGuests ?? null,
      weekdayPrice: body.weekdayPrice ?? null,
      weekendPrice: body.weekendPrice ?? null,
      mainImageId: body.mainImageId !== undefined ? utils.pgId(body.mainImageId) : null,
      imageIds: body.imageIds != null ? utils.pgBigintArr(body.imageIds) : null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
    });
    if (!row) throw new Error("객실을 찾을 수 없습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapRoom(row as any, imgs);
  },

  async removeRoom(accommodationId: string, roomId: string, userId?: string) {
    return accommodationService.updateRoom(accommodationId, roomId, { activeYn: "N" }, userId);
  },

  async listSeasonRates(q: types.ListQuery = {}) {
    const rows = await db.query("accommodation", "listSeasonRates", { useYn: q.useYn ?? null });
    const items = (rows as any[]).map(mappers.mapSeasonRate);
    return utils.toPaged(items, items.length, { all: true });
  },

  async createSeasonRate(body: types.CreateSeasonRateInput, userId?: string) {
    const row = await db.queryOne("accommodation", "createSeasonRate", {
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      roomId: utils.pgId(body.roomId),
      price: body.price,
      useYn: body.useYn ?? "Y",
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("시즌 요금 생성에 실패했습니다");
    return mappers.mapSeasonRate(row as any);
  },

  async updateSeasonRate(id: string, body: types.UpdateSeasonRateInput, userId?: string) {
    const row = await db.queryOne("accommodation", "updateSeasonRate", {
      id: utils.pgId(id),
      name: body.name ?? null,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      roomId: body.roomId !== undefined ? utils.pgId(body.roomId) : null,
      price: body.price ?? null,
      useYn: body.useYn ?? null,
    });
    if (!row) throw new Error("시즌 요금을 찾을 수 없습니다");
    return mappers.mapSeasonRate(row as any);
  },

  async removeSeasonRate(id: string) {
    await db.execute("accommodation", "deleteSeasonRate", { id: utils.pgId(id) });
  },
};

export default accommodationService;
