import type { FastifyInstance } from "fastify";
import authController from "../controllers/authController";

const ERR = {
  401: { $ref: "ErrorResponse#" },
  400: { $ref: "ErrorResponse#" },
};

const registerAuthRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: { loginId: string; password: string } }>(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "로그인",
        body: { $ref: "LoginBody#" },
        response: { 200: { $ref: "AuthTokenResponse#" }, ...ERR },
      },
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    authController.login,
  );

  app.post<{ Body: { loginId: string; email: string; password: string; name: string; phone?: string } }>(
    "/auth/signup",
    {
      schema: {
        tags: ["Auth"],
        summary: "회원가입",
        body: { $ref: "SignupBody#" },
        response: { 200: { $ref: "AuthTokenResponse#" }, ...ERR },
      },
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    authController.signup,
  );

  app.post<{ Body: { refreshToken: string } }>(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "토큰 갱신",
        body: { $ref: "RefreshBody#" },
        response: { 200: { $ref: "RefreshTokenResponse#" }, ...ERR },
      },
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
    },
    authController.refresh,
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        summary: "로그아웃",
        security: [{ bearerAuth: [] }],
        response: { 200: { $ref: "OkResponse#" }, 401: { $ref: "ErrorResponse#" } },
      },
      preHandler: [app.authenticate],
    },
    authController.logout,
  );

  app.get(
    "/auth/me",
    {
      schema: {
        tags: ["Auth"],
        summary: "내 정보 조회",
        security: [{ bearerAuth: [] }],
        response: { 200: { $ref: "UserInfo#" }, 401: { $ref: "ErrorResponse#" } },
      },
      preHandler: [app.authenticate],
    },
    authController.me,
  );
};

export default registerAuthRoutes;
