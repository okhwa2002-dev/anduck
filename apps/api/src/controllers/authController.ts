import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import authService from "../services/authService";
import { BadRequestError, ConflictError } from "../utils/errors";

type AuthUser = {
  id: string;
  email: string;
  userType: string;
};

function createJwtPayload(user: AuthUser, csrfToken: string = randomUUID()) {
  return {
    sub: user.id,
    email: user.email,
    userType: user.userType,
    csrfToken,
    jti: randomUUID(),
  };
}

const authController = {
  async login(req: FastifyRequest<{ Body: { loginId: string; password: string } }>, reply: FastifyReply) {
    const { loginId, password } = req.body;
    const user = await authService.validateCredentials(loginId, password);
    if (!user) return reply.code(401).send({ message: "이메일 또는 비밀번호가 올바르지 않습니다" });
    const csrfToken = randomUUID();
    const accessToken = req.server.jwt.sign(createJwtPayload(user, csrfToken), { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" });
    const refreshToken = req.server.jwt.sign(createJwtPayload(user, csrfToken), { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" });
    await authService.saveRefreshToken(user.id, refreshToken, req.headers["user-agent"]);
    return { user, tokens: { accessToken, refreshToken, csrfToken } };
  },

  async signup(req: FastifyRequest<{ Body: { loginId: string; email: string; password: string; name: string; phone?: string } }>, reply: FastifyReply) {
    const { loginId, email, password, name, phone } = req.body;
    try {
      const user = await authService.createUser(loginId, email, password, name, phone);
      const csrfToken = randomUUID();
      const accessToken = req.server.jwt.sign(createJwtPayload(user, csrfToken), { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" });
      const refreshToken = req.server.jwt.sign(createJwtPayload(user, csrfToken), { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" });
      await authService.saveRefreshToken(user.id, refreshToken, req.headers["user-agent"]);
      return reply.code(201).send({ user, tokens: { accessToken, refreshToken, csrfToken } });
    } catch (err: any) {
      if (err.code === "23505") throw new ConflictError("이미 사용 중인 이메일입니다");
      throw err;
    }
  },

  async refresh(req: FastifyRequest<{ Body: { refreshToken: string } }>, reply: FastifyReply) {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) throw new BadRequestError("리프레시 토큰이 필요합니다");
    const stored = await authService.getRefreshToken(refreshToken);
    if (!stored || stored.revokedAt || new Date(stored.expiresAt) < new Date()) {
      return reply.code(401).send({ message: "유효하지 않은 리프레시 토큰입니다" });
    }
    if (authService.isRefreshTokenIdleExpired(stored)) {
      await authService.revokeToken(stored.userId, refreshToken);
      return reply.code(401).send({ message: "세션이 만료되었습니다. 다시 로그인해 주세요." });
    }
    const user = await authService.getUserById(stored.userId);
    if (!user) return reply.code(401).send({ message: "사용자를 찾을 수 없습니다" });
    const payload = req.server.jwt.verify(refreshToken) as { csrfToken?: string };
    const csrfToken = payload.csrfToken ?? randomUUID();
    await authService.revokeToken(stored.userId, refreshToken);
    const accessToken = req.server.jwt.sign(createJwtPayload(user, csrfToken), { expiresIn: process.env.JWT_EXPIRES_IN ?? "15m" });
    const newRefreshToken = req.server.jwt.sign(createJwtPayload(user, csrfToken), { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d" });
    await authService.saveRefreshToken(user.id, newRefreshToken, req.headers["user-agent"]);
    return { user, tokens: { accessToken, refreshToken: newRefreshToken, csrfToken } };
  },

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const { sub } = req.user;
    const body = req.body as { refreshToken?: string };
    if (body?.refreshToken) await authService.revokeToken(sub, body.refreshToken);
    return reply.code(204).send();
  },

  async me(req: FastifyRequest) {
    const { sub } = req.user;
    const user = await authService.getUserById(sub);
    if (!user) return { id: sub, email: req.user.email, userType: req.user.userType };
    return user;
  },
};

export default authController;
