import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import * as db from "../utils/db";
import { pgId } from "../utils";

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
    const ext = path.extname(file.filename) || ".jpg";
    const storedName = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(uploadDir, storedName), buffer);

    const url = `${publicUrl}/uploads/${storedName}`;
    const row = await db.queryOne("image", "createImage", {
      url,
      alt: path.basename(file.filename, ext),
      filename: file.filename,
      mimeType: file.mimetype,
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
