import type { FastifyInstance } from "fastify";
import { loadConfig } from "../utils/config";
import filesService from "../services/filesService";
import { BadRequestError } from "../utils/errors";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default async function registerFilesRoutes(app: FastifyInstance) {
  const { uploadDir, publicUrl } = loadConfig();

  app.post("/files/images", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 30, timeWindow: "1m" } },
  }, async (request, reply) => {
    const data = await request.file({ limits: { fileSize: MAX_FILE_SIZE } });
    if (!data) throw new BadRequestError("파일이 없습니다");
    if (!ALLOWED_MIME.has(data.mimetype)) {
      throw new BadRequestError("이미지 파일(jpeg, png, gif, webp)만 업로드할 수 있습니다");
    }

    const source = (request.query as any)?.source as string | undefined;
    const result = await filesService.uploadImage(data, uploadDir, publicUrl, request.user?.sub, source);
    return reply.code(201).send(result);
  });
}
