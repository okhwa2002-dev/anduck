import type { FastifyRequest, FastifyReply } from "fastify";
import type * as types from "@anduck/types";
import adminService from "../services/adminService";
import { notFound } from "../utils";

type Req<T extends Record<string, unknown> = Record<never, never>> = FastifyRequest<T>;

const uid = (req: Req): string | undefined => (req.user as any)?.sub;

const adminController = {
  async getDashboard() {
    return adminService.getDashboardSummary();
  },

  async updateVillageProfile(req: Req<{ Body: types.UpdateVillageProfileInput }>) {
    return adminService.updateVillageProfile(req.body);
  },

  async listPrograms(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminPrograms(req.query);
  },

  async createProgram(req: Req<{ Body: types.CreateProgramInput }>) {
    return adminService.createAdminProgram(req.body, uid(req));
  },

  async updateProgram(req: Req<{ Params: { id: string }; Body: types.UpdateProgramInput }>) {
    return adminService.updateAdminProgram(req.params.id, req.body, uid(req));
  },

  async removeProgram(req: Req<{ Params: { id: string } }>) {
    return adminService.removeAdminProgram(req.params.id, uid(req));
  },

  async listAccommodations(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminAccommodations(req.query);
  },

  async createAccommodation(req: Req<{ Body: types.CreateAccommodationInput }>) {
    return adminService.createAdminAccommodation(req.body, uid(req));
  },

  async updateAccommodation(req: Req<{ Params: { id: string }; Body: types.UpdateAccommodationInput }>) {
    return adminService.updateAdminAccommodation(req.params.id, req.body, uid(req));
  },

  async removeAccommodation(req: Req<{ Params: { id: string } }>) {
    return adminService.removeAdminAccommodation(req.params.id, uid(req));
  },

  async listRooms(req: Req<{ Params: { accommodationId: string }; Querystring: types.ListQuery }>) {
    return adminService.listAdminRooms(req.params.accommodationId, req.query);
  },

  async createRoom(req: Req<{ Params: { accommodationId: string }; Body: types.CreateRoomInput }>) {
    return adminService.createAdminRoom(req.params.accommodationId, req.body, uid(req));
  },

  async updateRoom(req: Req<{ Params: { accommodationId: string; roomId: string }; Body: types.UpdateRoomInput }>) {
    return adminService.updateAdminRoom(req.params.accommodationId, req.params.roomId, req.body, uid(req));
  },

  async removeRoom(req: Req<{ Params: { accommodationId: string; roomId: string } }>) {
    return adminService.removeAdminRoom(req.params.accommodationId, req.params.roomId, uid(req));
  },

  async listReservations(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminReservations(req.query);
  },

  async getReservation(req: Req<{ Params: { id: string } }>) {
    const reservation = await adminService.getAdminReservation(req.params.id);
    return reservation ?? notFound("예약을 찾을 수 없습니다");
  },

  async updateReservationStatus(req: Req<{ Params: { id: string }; Body: types.UpdateReservationStatusInput }>) {
    return adminService.updateAdminReservationStatus(req.params.id, req.body);
  },

  async listNotices(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminNotices(req.query);
  },

  async createNotice(req: Req<{ Body: types.CreateNoticeInput }>) {
    return adminService.createAdminNotice(req.body, uid(req));
  },

  async updateNotice(req: Req<{ Params: { id: string }; Body: types.UpdateNoticeInput }>) {
    return adminService.updateAdminNotice(req.params.id, req.body, uid(req));
  },

  async removeNotice(req: Req<{ Params: { id: string } }>) {
    return adminService.removeAdminNotice(req.params.id, uid(req));
  },

  async listGallery(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminGallery(req.query);
  },

  async createGalleryItem(req: Req<{ Body: types.CreateGalleryItemInput }>) {
    return adminService.createAdminGalleryItem(req.body, uid(req));
  },

  async updateGalleryItem(req: Req<{ Params: { id: string }; Body: types.UpdateGalleryItemInput }>) {
    return adminService.updateAdminGalleryItem(req.params.id, req.body);
  },

  async removeGalleryItem(req: Req<{ Params: { id: string } }>) {
    return adminService.removeAdminGalleryItem(req.params.id);
  },

  async getFacility(req: Req<{ Params: { id: string } }>) {
    const facility = await adminService.getAdminFacility(req.params.id);
    return facility ?? notFound("시설을 찾을 수 없습니다");
  },

  async listFacilities(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminFacilities(req.query);
  },

  async createFacility(req: Req<{ Body: types.CreateFacilityInput }>) {
    return adminService.createAdminFacility(req.body, uid(req));
  },

  async updateFacility(req: Req<{ Params: { id: string }; Body: types.UpdateFacilityInput }>) {
    return adminService.updateAdminFacility(req.params.id, req.body, uid(req));
  },

  async removeFacility(req: Req<{ Params: { id: string } }>) {
    return adminService.removeAdminFacility(req.params.id);
  },

  async exportFacilities(req: Req<{ Querystring: types.ListQuery }>, reply: FastifyReply) {
    const { buffer, title } = await adminService.exportAdminFacilities(req.query);
    const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const filename = encodeURIComponent(`${title.replace(/\s/g, "")}_${ts}.xlsx`);
    reply
      .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("Content-Disposition", `attachment; filename*=UTF-8''${filename}`)
      .send(buffer);
  },

  async listBanners(req: Req<{ Querystring: types.ListQuery }>) {
    return adminService.listAdminBanners(req.query);
  },

  async createBanner(req: Req<{ Body: types.CreateBannerInput }>) {
    return adminService.createAdminBanner(req.body);
  },

  async updateBanner(req: Req<{ Params: { id: string }; Body: types.UpdateBannerInput }>) {
    return adminService.updateAdminBanner(req.params.id, req.body);
  },

  async removeBanner(req: Req<{ Params: { id: string } }>) {
    return adminService.removeAdminBanner(req.params.id);
  },
};

export default adminController;
