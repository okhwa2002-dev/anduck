import type { FastifyRequest, FastifyReply } from "fastify";
import type * as types from "@anduck/types";
import { pool } from "../utils/db";
import publicService from "../services/publicService";
import { notFound } from "../utils";

type Req<T extends Record<string, unknown> = Record<never, never>> = FastifyRequest<T>;

const publicController = {
  async health() {
    return { ok: true, service: "@anduck/api" };
  },

  async healthDb(_req: Req, reply: FastifyReply) {
    try {
      await pool.query("SELECT 1");
      return { ok: true, service: "@anduck/api", database: "connected" };
    } catch {
      return reply.code(503).send({ ok: false, service: "@anduck/api", database: "unavailable" });
    }
  },

  async getHome() {
    return publicService.getHome();
  },

  async getVillageProfile() {
    const profile = await publicService.getVillageProfile();
    return profile ?? notFound("마을 정보를 찾을 수 없습니다");
  },

  async listPrograms(req: Req<{ Querystring: types.ListQuery }>) {
    return publicService.listPrograms(req.query);
  },

  async getProgram(req: Req<{ Params: { id: string } }>) {
    const program = await publicService.getProgram(req.params.id);
    return program ?? notFound("체험 프로그램을 찾을 수 없습니다");
  },

  async listAccommodations(req: Req<{ Querystring: types.ListQuery }>) {
    return publicService.listAccommodations(req.query);
  },

  async getAccommodation(req: Req<{ Params: { id: string } }>) {
    const accommodation = await publicService.getAccommodation(req.params.id);
    return accommodation ?? notFound("숙소를 찾을 수 없습니다");
  },

  async listRooms(req: Req<{ Params: { accommodationId: string }; Querystring: types.ListQuery }>) {
    return publicService.listRooms(req.params.accommodationId, req.query);
  },

  async getRoom(req: Req<{ Params: { accommodationId: string; roomId: string } }>) {
    const room = await publicService.getRoom(req.params.accommodationId, req.params.roomId);
    return room ?? notFound("객실을 찾을 수 없습니다");
  },

  async lookupReservations(req: Req<{ Querystring: types.ReservationLookupQuery }>) {
    return publicService.lookupReservations(req.query);
  },

  async checkAvailability(req: Req<{ Querystring: types.AvailabilityQuery }>) {
    return publicService.checkAvailability(req.query);
  },

  async createReservation(req: Req<{ Body: types.CreateReservationInput }>) {
    return publicService.createReservation(req.body, req.user?.sub);
  },

  async listNotices(req: Req<{ Querystring: types.ListQuery }>) {
    return publicService.listNotices(req.query);
  },

  async getNotice(req: Req<{ Params: { id: string } }>) {
    const notice = await publicService.getNotice(req.params.id);
    return notice ?? notFound("공지사항을 찾을 수 없습니다");
  },

  async listGallery(req: Req<{ Querystring: types.ListQuery }>) {
    return publicService.listGallery(req.query);
  },

  async getGalleryItem(req: Req<{ Params: { id: string } }>) {
    const item = await publicService.getGalleryItem(req.params.id);
    return item ?? notFound("갤러리 항목을 찾을 수 없습니다");
  },

  async listFacilities(req: Req<{ Querystring: types.ListQuery }>) {
    return publicService.listFacilities(req.query);
  },

  async getFacility(req: Req<{ Params: { id: string } }>) {
    const facility = await publicService.getFacility(req.params.id);
    return facility ?? notFound("시설을 찾을 수 없습니다");
  },
};

export default publicController;
