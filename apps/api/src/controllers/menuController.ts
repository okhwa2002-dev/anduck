import type { FastifyRequest, FastifyReply } from "fastify";
import type * as types from "@anduck/types";
import menuService from "../services/menuService";
import { Errors } from "../utils/errors";

type Req<T extends Record<string, unknown> = Record<never, never>> = FastifyRequest<T>;

const menuController = {
  /** 공개 메뉴 트리 (인증 불필요 — roles=[] 공개 메뉴만 반환) */
  async listPublicMenus(req: Req<{ Querystring: { groupCode?: string } }>) {
    return menuService.getMenusByUser(undefined, req.query.groupCode);
  },

  /** 로그인 사용자의 권한 기반 메뉴 트리 */
  async listMyMenus(req: Req<{ Querystring: { groupCode?: string } }>) {
    const userId = (req.user as any)?.sub as string | undefined;
    return menuService.getMenusByUser(userId, req.query.groupCode);
  },

  /** 메뉴 그룹 목록 */
  async listMenuGroups(_req: Req, _reply: FastifyReply) {
    return menuService.listMenuGroups("Y");
  },

  /** 메뉴 그룹 생성 (admin) */
  async createMenuGroup(req: Req<{ Body: types.CreateMenuGroupInput }>) {
    const uid = (req.user as any)?.sub as string | undefined;
    const result = await menuService.createMenuGroup(req.body, uid);
    if (!result) throw new Error("메뉴 그룹 생성에 실패했습니다");
    return result;
  },

  /** 메뉴 생성 (admin) */
  async createMenu(req: Req<{ Body: types.CreateMenuInput }>) {
    const uid = (req.user as any)?.sub as string | undefined;
    const result = await menuService.createMenu(req.body, uid);
    if (!result) throw new Error("메뉴 생성에 실패했습니다");
    return result;
  },

  /** 메뉴 수정 (admin) */
  async updateMenu(req: Req<{ Params: { id: string }; Body: types.UpdateMenuInput }>) {
    const result = await menuService.updateMenu(req.params.id, req.body);
    if (!result) throw Errors.notFound("메뉴를 찾을 수 없습니다");
    return result;
  },
};

export default menuController;
