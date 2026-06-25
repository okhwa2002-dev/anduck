import type { FastifyInstance } from "fastify";
import type * as types from "@anduck/types";
import menuController from "../controllers/menuController";

const SEC = { security: [{ bearerAuth: [] }] };
const ERR = { 400: { $ref: "ErrorResponse#" }, 401: { $ref: "ErrorResponse#" }, 404: { $ref: "ErrorResponse#" } };

const registerMenuRoutes = async (app: FastifyInstance) => {
  // ─── Public ─────────────────────────────────────────────────────────────────
  // 인증 불필요 — roles=[] 공개 메뉴만 반환
  app.get<{ Querystring: { groupCode?: string } }>("/menus", {
    schema: {
      tags: ["Menus"],
      summary: "공개 메뉴 트리 (비인증 — 전체 공개 메뉴만)",
      querystring: {
        type: "object",
        properties: { groupCode: { type: "string", description: "메뉴 그룹 코드 (예: WEB_PUBLIC)" } },
      },
      response: { 200: { type: "array", items: { $ref: "Menu#" } } },
    },
  }, menuController.listPublicMenus);

  app.get("/menus/groups", {
    schema: {
      tags: ["Menus"],
      summary: "메뉴 그룹 목록",
      response: { 200: { type: "array", items: { $ref: "MenuGroup#" } } },
    },
  }, menuController.listMenuGroups);

  // ─── Auth — 로그인 사용자의 role 기반 메뉴 ─────────────────────────────────
  app.get<{ Querystring: { groupCode?: string } }>("/auth/menus", {
    schema: {
      tags: ["Menus"],
      summary: "로그인 사용자 역할 기반 메뉴 트리",
      description: "JWT role에 따라 접근 가능한 메뉴만 반환. ADMIN이면 GUEST·MEMBER·ADMIN 메뉴 포함.",
      ...SEC,
      querystring: {
        type: "object",
        properties: { groupCode: { type: "string", description: "메뉴 그룹 코드 (예: WEB_ADMIN)" } },
      },
      response: { 200: { type: "array", items: { $ref: "Menu#" } }, ...ERR },
    },
    preHandler: [app.authenticate],
  }, menuController.listMyMenus);

  // ─── Admin — 메뉴 관리 ──────────────────────────────────────────────────────
  app.post<{ Body: { groupCode: string; groupName: string; description?: string; useYn?: "Y" | "N"; sortOrder?: number } }>(
    "/admin/menu-groups",
    {
      schema: {
        tags: ["Admin / Menus"],
        summary: "메뉴 그룹 생성",
        body: { $ref: "CreateMenuGroupBody#" },
        ...SEC,
        response: { 200: { $ref: "MenuGroup#" }, ...ERR },
      },
      preHandler: [app.authenticate, app.authorizeAdmin, app.verifyCsrf],
    },
    menuController.createMenuGroup,
  );

  app.post<{ Body: types.CreateMenuInput }>("/admin/menus", {
    schema: {
      tags: ["Admin / Menus"],
      summary: "메뉴 생성",
      body: { $ref: "CreateMenuBody#" },
      ...SEC,
      response: { 200: { $ref: "Menu#" }, ...ERR },
    },
    preHandler: [app.authenticate, app.authorizeAdmin, app.verifyCsrf],
  }, menuController.createMenu);

  app.patch<{ Params: { id: string }; Body: types.UpdateMenuInput }>("/admin/menus/:id", {
    schema: {
      tags: ["Admin / Menus"],
      summary: "메뉴 수정",
      params: { $ref: "IdParam#" },
      body: { $ref: "UpdateMenuBody#" },
      ...SEC,
      response: { 200: { $ref: "Menu#" }, ...ERR },
    },
    preHandler: [app.authenticate, app.authorizeAdmin, app.verifyCsrf],
  }, menuController.updateMenu);
};

export default registerMenuRoutes;
