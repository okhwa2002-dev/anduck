import type { Sortable, Timestamps, YN } from "./common";

export interface MenuGroup extends Timestamps, Sortable {
  id: string;
  groupCode: string;
  groupName: string;
  description?: string;
  useYn: YN;
  menus?: Menu[];
}

export interface Menu extends Timestamps, Sortable {
  id: string;
  groupId: string;
  parentId?: string;
  menuCode: string;
  menuName: string;
  path?: string;
  icon?: string;
  roles: string[];
  target: "_self" | "_blank";
  activeYn: YN;
  children?: Menu[];
}

export interface CreateMenuGroupInput {
  groupCode: string;
  groupName: string;
  description?: string;
  useYn?: YN;
  sortOrder?: number;
}

export type UpdateMenuGroupInput = Partial<CreateMenuGroupInput>;

export interface CreateMenuInput {
  groupId: string;
  parentId?: string;
  menuCode: string;
  menuName: string;
  path?: string;
  icon?: string;
  roles?: string[];
  target?: "_self" | "_blank";
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateMenuInput = Partial<Omit<CreateMenuInput, "groupId">>;
