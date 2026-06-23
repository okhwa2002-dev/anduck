import * as db from "../utils/db";
import * as utils from "../utils";

type MenuRow = {
  id: string;
  groupId: string;
  parentId: string | null;
  menuCode: string;
  menuName: string;
  path?: string;
  icon?: string;
  target: string;
  activeYn: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MenuNode = Omit<MenuRow, "parentId"> & {
  parentId?: string;
  children?: MenuNode[];
};

/** flat 배열을 parent-child 트리로 변환 */
function buildTree(rows: MenuRow[]): MenuNode[] {
  const map = new Map<string, MenuNode>();

  for (const r of rows) {
    const { parentId, ...rest } = r;
    map.set(r.id, { ...rest, ...(parentId ? { parentId } : {}), children: [] });
  }

  const roots: MenuNode[] = [];
  for (const node of map.values()) {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node); // 부모가 권한 밖이면 최상위로 승격
      }
    } else {
      roots.push(node);
    }
  }

  // 빈 children 제거
  for (const node of map.values()) {
    if (node.children?.length === 0) delete node.children;
  }

  return roots;
}

const menuService = {
  /**
   * 사용자 권한 기반 메뉴 트리 조회
   * - userId 제공 시: user_permission → permission_menu 조인으로 접근 가능한 메뉴 반환
   * - userId 미제공 (게스트): groupCode='WEB_PUBLIC' 등으로 공개 메뉴 반환
   * - groupCode: 특정 그룹만 필터 (없으면 전체)
   */
  async getMenusByUser(userId?: string, groupCode?: string): Promise<MenuNode[]> {
    const params = { groupCode: groupCode ?? null };
    const rows = userId
      ? await db.query("menu", "listMenusByUser", { ...params, userId: utils.pgId(userId) })
      : await db.query("menu", "listDefaultMenus", params);
    return buildTree(rows as MenuRow[]);
  },

  /** 메뉴 그룹 목록 */
  async listMenuGroups(useYn?: "Y" | "N") {
    return db.query("menu", "listMenuGroups", { useYn: useYn ?? null });
  },

  /** 그룹 생성 */
  async createMenuGroup(body: {
    groupCode: string;
    groupName: string;
    description?: string;
    useYn?: "Y" | "N";
    sortOrder?: number;
  }, userId?: string) {
    return db.queryOne("menu", "createMenuGroup", {
      groupCode: body.groupCode,
      groupName: body.groupName,
      description: body.description ?? null,
      useYn: body.useYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
  },

  /** 메뉴 생성 */
  async createMenu(body: {
    groupId: string;
    parentId?: string;
    menuCode: string;
    menuName: string;
    path?: string;
    icon?: string;
    target?: "_self" | "_blank";
    activeYn?: "Y" | "N";
    sortOrder?: number;
  }, userId?: string) {
    return db.queryOne("menu", "createMenu", {
      groupId: utils.pgId(body.groupId),
      parentId: body.parentId ? utils.pgId(body.parentId) : "NULL",
      menuCode: body.menuCode,
      menuName: body.menuName,
      path: body.path ?? null,
      icon: body.icon ?? null,
      target: body.target ?? "_self",
      activeYn: body.activeYn ?? "Y",
      sortOrder: body.sortOrder ?? 0,
      createdBy: utils.pgId(userId),
    });
  },

  /** 메뉴 수정 */
  async updateMenu(id: string, body: {
    menuName?: string;
    path?: string;
    icon?: string;
    target?: "_self" | "_blank";
    activeYn?: "Y" | "N";
    sortOrder?: number;
  }) {
    return db.queryOne("menu", "updateMenu", {
      id: utils.pgId(id),
      menuName: body.menuName ?? null,
      path: body.path ?? null,
      icon: body.icon ?? null,
      target: body.target ?? null,
      activeYn: body.activeYn ?? null,
      sortOrder: body.sortOrder ?? null,
    });
  },
};

export default menuService;
