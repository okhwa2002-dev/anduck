import * as db from "../utils/db";

export type ImageRef = { id: string; url: string; alt?: string };

const imagesService = {
  async getImages(ids: string[]): Promise<Map<string, ImageRef>> {
    const validIds = [...new Set(ids.filter((id) => /^\d+$/.test(id)))];
    if (!validIds.length) return new Map();
    const idsParam = `ARRAY[${validIds.join(",")}]`;
    const sql = db.buildSQL("image", "getImagesByIds", { ids: idsParam });
    const { rows } = await db.pool.query(sql);
    return new Map(rows.map((r) => [r.id as string, { id: r.id, url: r.url, alt: r.alt ?? undefined }]));
  },
};

export default imagesService;
