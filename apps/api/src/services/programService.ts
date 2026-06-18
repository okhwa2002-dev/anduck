import type * as types from "@anduck/types";
import * as db from "../utils/db";
import * as utils from "../utils";
import imagesService from "./imagesService";
import mappers from "./mappers";

const programService = {
  async listPrograms(q: types.ListQuery = {}) {
    const lo = utils.limitOffsetSQL(q);
    const params = { activeYn: q.useYn ?? "Y", featuredYn: q.featuredYn ?? null, q: q.q ?? null };
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

  async createProgram(body: types.CreateProgramInput, userId?: string) {
    const row = await db.queryOne("program", "createProgram", {
      name: body.name,
      summary: body.summary ?? null,
      description: body.description,
      durationMinutes: body.durationMinutes ?? null,
      pricePerPerson: body.pricePerPerson ?? 0,
      minParticipants: body.minParticipants ?? null,
      maxParticipants: body.maxParticipants ?? null,
      availableDays: utils.pgTextArr(body.availableDays),
      operatingHours: body.operatingHours ?? null,
      preparationNotes: body.preparationNotes ?? null,
      mainImageId: utils.pgId(body.mainImageId),
      imageIds: utils.pgBigintArr(body.imageIds),
      featuredYn: body.featuredYn ?? "N",
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("프로그램 생성에 실패했습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapProgram(row as any, imgs);
  },

  async updateProgram(id: string, body: types.UpdateProgramInput, userId?: string) {
    const row = await db.queryOne("program", "updateProgram", {
      id: utils.pgId(id),
      name: body.name ?? null,
      summary: body.summary ?? null,
      description: body.description ?? null,
      durationMinutes: body.durationMinutes ?? null,
      pricePerPerson: body.pricePerPerson ?? null,
      minParticipants: body.minParticipants ?? null,
      maxParticipants: body.maxParticipants ?? null,
      availableDays: body.availableDays != null ? utils.pgTextArr(body.availableDays) : null,
      operatingHours: body.operatingHours ?? null,
      preparationNotes: body.preparationNotes ?? null,
      mainImageId: body.mainImageId !== undefined ? utils.pgId(body.mainImageId) : null,
      imageIds: body.imageIds != null ? utils.pgBigintArr(body.imageIds) : null,
      featuredYn: body.featuredYn ?? null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
      updatedBy: utils.pgId(userId),
    });
    if (!row) throw new Error("프로그램을 찾을 수 없습니다");
    const imgs = await imagesService.getImages(mappers.imageIdsFrom([row as any]));
    return mappers.mapProgram(row as any, imgs);
  },

  async removeProgram(id: string, userId?: string) {
    return programService.updateProgram(id, { activeYn: "N" }, userId);
  },

  async listProgramSessions(programId: string) {
    const rows = await db.query("program", "listProgramSessions", {
      programId: utils.pgId(programId),
      activeYn: "Y",
    });
    return (rows as any[]).map(mappers.mapProgramSession);
  },

  async createProgramSession(programId: string, body: types.CreateProgramSessionInput, userId?: string) {
    const row = await db.queryOne("program", "createProgramSession", {
      programId: utils.pgId(programId),
      sessionDate: body.sessionDate,
      startTime: body.startTime,
      capacity: body.capacity ?? null,
      activeYn: body.activeYn ?? "Y",
      createdBy: utils.pgId(userId),
    });
    if (!row) throw new Error("프로그램 세션 생성에 실패했습니다");
    return mappers.mapProgramSession(row as any);
  },

  async updateProgramSession(sessionId: string, body: types.UpdateProgramSessionInput) {
    const row = await db.queryOne("program", "updateProgramSession", {
      id: utils.pgId(sessionId),
      sessionDate: body.sessionDate ?? null,
      startTime: body.startTime ?? null,
      capacity: body.capacity ?? null,
      activeYn: body.activeYn ?? null,
    });
    if (!row) throw new Error("프로그램 세션을 찾을 수 없습니다");
    return mappers.mapProgramSession(row as any);
  },

  async removeProgramSession(sessionId: string) {
    await db.execute("program", "updateProgramSession", {
      id: utils.pgId(sessionId),
      sessionDate: null,
      startTime: null,
      capacity: null,
      activeYn: "N",
    });
  },
};

export default programService;
