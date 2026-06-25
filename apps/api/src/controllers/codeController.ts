import type { FastifyRequest } from "fastify";
import type * as types from "@anduck/types";
import codeService from "../services/codeService";
import { notFound } from "../utils";

type Req<T extends Record<string, unknown> = Record<never, never>> = FastifyRequest<T>;

const codeController = {
  async listCodeGroups(req: Req<{ Querystring: types.ListCodeGroupsQuery }>) {
    return codeService.listCodeGroups(req.query);
  },

  async getCodeGroup(req: Req<{ Params: { groupCode: string }; Querystring: Pick<types.ListCodeGroupsQuery, "useYn"> }>) {
    const group = await codeService.getCodeGroup(req.params.groupCode, req.query);
    return group ?? notFound("공통코드 그룹을 찾을 수 없습니다");
  },
};

export default codeController;
