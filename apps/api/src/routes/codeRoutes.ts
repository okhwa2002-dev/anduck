import type { FastifyInstance } from "fastify";
import type * as types from "@anduck/types";
import codeController from "../controllers/codeController";

const registerCodeRoutes = async (app: FastifyInstance) => {
  app.get<{ Querystring: types.ListCodeGroupsQuery }>("/codes", {
    schema: {
      tags: ["Codes"],
      summary: "공통코드 그룹 목록",
      querystring: {
        type: "object",
        properties: {
          groupCodes: { type: "string", description: "쉼표로 구분한 그룹 코드 목록" },
          useYn: { type: "string", enum: ["Y", "N"], default: "Y" },
        },
      },
      response: { 200: { type: "array", items: { $ref: "CodeGroup#" } } },
    },
  }, codeController.listCodeGroups);

  app.get<{ Params: { groupCode: string }; Querystring: Pick<types.ListCodeGroupsQuery, "useYn"> }>("/codes/:groupCode", {
    schema: {
      tags: ["Codes"],
      summary: "공통코드 그룹 단건 조회",
      params: {
        type: "object",
        properties: { groupCode: { type: "string" } },
        required: ["groupCode"],
      },
      querystring: {
        type: "object",
        properties: { useYn: { type: "string", enum: ["Y", "N"], default: "Y" } },
      },
      response: { 200: { $ref: "CodeGroup#" }, 404: { $ref: "ErrorResponse#" } },
    },
  }, codeController.getCodeGroup);
};

export default registerCodeRoutes;
