import type { Sortable, Timestamps, YN } from "./common";

export interface CodeGroup extends Timestamps, Sortable {
  id: string;
  groupCode: string;
  groupName: string;
  description?: string;
  useYn: YN;
  codes?: Code[];
}

export interface Code extends Timestamps, Sortable {
  id: string;
  groupId: string;
  code: string;
  name: string;
  description?: string;
  extra?: Record<string, unknown>;
  useYn: YN;
}

export interface CreateCodeGroupInput {
  groupCode: string;
  groupName: string;
  description?: string;
  useYn?: YN;
  sortOrder?: number;
}

export type UpdateCodeGroupInput = Partial<CreateCodeGroupInput>;

export interface CreateCodeInput {
  groupId: string;
  code: string;
  name: string;
  description?: string;
  extra?: Record<string, unknown>;
  useYn?: YN;
  sortOrder?: number;
}

export type UpdateCodeInput = Partial<Omit<CreateCodeInput, "groupId">>;
