import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { loadMappers, pool, setDbLogger } from "./utils/db";
import { localISOString, LogRotator } from "./utils/logger";
import registerAdminRoutes from "./routes/adminRoutes";
import { AppError } from "./utils/errors";
import registerAuthRoutes from "./routes/authRoutes";
import registerPublicRoutes from "./routes/publicRoutes";
import registerMenuRoutes from "./routes/menuRoutes";
import { registerSchemas } from "./schemas.js";

export type JwtPayload = { sub: string; email: string; userType: string };

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function createApp(): Promise<FastifyInstance> {
  loadMappers();

  const isTest = process.env.NODE_ENV === "test";

  const rotator = isTest ? null : new LogRotator();

  const app = Fastify({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger: rotator
      ? ({ level: "info", timestamp: () => `,"time":"${localISOString()}"`, stream: rotator } as any)
      : !isTest,
  });

  setDbLogger(app.log);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "안덕 건강힐링체험마을 API",
        description: "안덕 체험마을 공개/관리자 API",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
  });

  await app.register(rateLimit, { global: false });

  await app.register(cors, {
    origin: (process.env.CORS_ORIGIN ?? "*").split(","),
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "anduck-dev-secret-change-in-production",
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ message: "인증이 필요합니다" });
    }
  });

  app.decorate("optionalAuthenticate", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      // 토큰 없거나 유효하지 않으면 게스트로 처리
    }
  });

  app.setErrorHandler((error: Error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    reply.send(error);
  });

  registerSchemas(app);

  await registerAuthRoutes(app);
  await registerPublicRoutes(app);
  await registerMenuRoutes(app);
  app.register(registerAdminRoutes);

  app.addHook("onClose", async () => {
    await pool.end();
    rotator?.end();
  });

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuthenticate: (request: FastifyRequest) => Promise<void>;
  }
}
