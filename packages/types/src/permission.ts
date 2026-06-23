import type { Sortable, Timestamps, YN } from "./common";

export interface Permission extends Timestamps, Sortable {
  id: string;
  code: string;
  name: string;
  description?: string;
  useYn: YN;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionId: string;
  createdAt: string;
  permission?: Permission;
}

export interface PermissionMenu {
  id: string;
  permissionId: string;
  menuId: string;
  createdAt: string;
}

export interface CreatePermissionInput {
  code: string;
  name: string;
  description?: string;
  useYn?: YN;
  sortOrder?: number;
}

export type UpdatePermissionInput = Partial<CreatePermissionInput>;

export interface AssignUserPermissionInput {
  userId: string;
  permissionIds: string[];
}

export interface AssignPermissionMenuInput {
  permissionId: string;
  menuIds: string[];
}
