import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import * as db from "../utils/db";
import { pgId } from "../utils";
import { Errors } from "../utils/errors";

const IMAGE_TYPES = {
  "image/jpeg": { ext: ".jpg", extensions: [".jpg", ".jpeg"] },
  "image/png": { ext: ".png", extensions: [".png"] },
  "image/gif": { ext: ".gif", extensions: [".gif"] },
  "image/webp": { ext: ".webp", extensions: [".webp"] },
} as const;

type ImageMime = keyof typeof IMAGE_TYPES;

function detectImageMime(buffer: Buffer): ImageMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function validateImageFile(file: { filename: string; mimetype: string }, buffer: Buffer): ImageMime {
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime) {
    throw Errors.badRequest("실제 이미지 파일만 업로드할 수 있습니다");
  }

  if (file.mimetype !== detectedMime) {
    throw Errors.badRequest("파일 MIME 타입과 실제 이미지 형식이 일치하지 않습니다");
  }

  const ext = path.extname(file.filename).toLowerCase();
  const allowedExtensions = IMAGE_TYPES[detectedMime].extensions;
  if (ext && !allowedExtensions.includes(ext as never)) {
    throw Errors.badRequest("파일 확장자와 실제 이미지 형식이 일치하지 않습니다");
  }

  return detectedMime;
}

const filesService = {
  async uploadImage(
    file: { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> },
    uploadDir: string,
    publicUrl: string,
    userId?: string,
    sourceType?: string,
  ) {
    await fs.mkdir(uploadDir, { recursive: true });

    const buffer = await file.toBuffer();
    const detectedMime = validateImageFile(file, buffer);
    const ext = IMAGE_TYPES[detectedMime].ext;
    const storedName = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(uploadDir, storedName), buffer);

    const url = `${publicUrl}/uploads/${storedName}`;
    const row = await db.queryOne("image", "createImage", {
      url,
      alt: path.basename(file.filename, ext),
      filename: file.filename,
      mimeType: detectedMime,
      size: buffer.length,
      sourceType: sourceType ?? null,
      createdBy: pgId(userId),
    });

    if (!row) throw new Error("이미지 저장에 실패했습니다");
    const r = row as any;
    return { id: r.id, url: r.url, filename: r.filename, contentType: r.mimeType, size: r.size };
  },
};

export default filesService;
