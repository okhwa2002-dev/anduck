import type { Address, YN } from "@anduck/types";
import type { ImageRef } from "./imagesService";

type ImgMap = Map<string, ImageRef>;

function imgRef(imgs: ImgMap, id?: string | null): ImageRef | undefined {
  return id ? imgs.get(id) : undefined;
}

function imgRefs(imgs: ImgMap, ids?: string[] | null): ImageRef[] {
  return (ids ?? []).flatMap((id) => { const i = imgs.get(id); return i ? [i] : []; });
}

function ts(date: Date | string | null | undefined): string {
  if (!date) return new Date().toISOString();
  return date instanceof Date ? date.toISOString() : date;
}

function dateOnly(date: Date | string | null | undefined): string {
  if (!date) return "";
  const s = date instanceof Date ? date.toISOString() : date;
  return s.slice(0, 10);
}

function num(v: unknown): number {
  return v != null ? Number(v) : 0;
}

function addr(v: unknown): Address | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const r = v as Record<string, unknown>;
  const road = typeof r.road === "string" ? r.road : "";
  if (!road) return undefined;
  return {
    zipCode: typeof r.zipCode === "string" ? r.zipCode : undefined,
    road,
    detail: typeof r.detail === "string" ? r.detail : undefined,
  };
}

const mappers = {
  imageIdsFrom(rows: Array<{ mainImageId?: string | null; imageIds?: string[] | null }>): string[] {
    const s = new Set<string>();
    for (const r of rows) {
      if (r.mainImageId) s.add(r.mainImageId);
      for (const id of r.imageIds ?? []) if (id) s.add(id);
    }
    return [...s];
  },

  singleImageIdsFrom(rows: Array<{ imageId?: string | null }>): string[] {
    return rows.filter((r) => r.imageId).map((r) => r.imageId!);
  },

  mapProgram(r: any, imgs: ImgMap) {
    return {
      id: r.id as string,
      name: r.name as string,
      summary: r.summary ?? undefined,
      description: r.description as string,
      durationMinutes: r.durationMinutes != null ? Number(r.durationMinutes) : undefined,
      pricePerPerson: num(r.pricePerPerson),
      minParticipants: r.minParticipants != null ? Number(r.minParticipants) : undefined,
      maxParticipants: r.maxParticipants != null ? Number(r.maxParticipants) : undefined,
      availableDays: (r.availableDays as string[]) ?? [],
      operatingHours: r.operatingHours ?? undefined,
      preparationNotes: r.preparationNotes ?? undefined,
      mainImage: imgRef(imgs, r.mainImageId),
      images: imgRefs(imgs, r.imageIds),
      mainOpenYn: r.mainOpenYn as YN,
      activeYn: r.activeYn as YN,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: ts(r.createdAt),
      createdBy: r.createdBy ?? undefined,
      updatedAt: ts(r.updatedAt),
    };
  },

  mapProgramSession(r: any) {
    return {
      id: r.id as string,
      programId: r.programId as string,
      sessionDate: dateOnly(r.sessionDate),
      startTime: r.startTime as string,
      capacity: r.capacity != null ? Number(r.capacity) : undefined,
      activeYn: r.activeYn as YN,
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapAccommodation(r: any, imgs: ImgMap) {
    return {
      id: r.id as string,
      type: r.type as string,
      name: r.name as string,
      summary: r.summary ?? undefined,
      description: r.description as string,
      mainImage: imgRef(imgs, r.mainImageId),
      images: imgRefs(imgs, r.imageIds),
      amenities: (r.amenities as string[]) ?? [],
      checkInTime: r.checkInTime ?? undefined,
      checkOutTime: r.checkOutTime ?? undefined,
      featuredYn: r.featuredYn as YN,
      activeYn: r.activeYn as YN,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: ts(r.createdAt),
      createdBy: r.createdBy ?? undefined,
      updatedAt: ts(r.updatedAt),
      updatedBy: r.updatedBy ?? undefined,
    };
  },

  mapRoom(r: any, imgs: ImgMap) {
    return {
      id: r.id as string,
      accommodationId: r.accommodationId as string,
      name: r.name as string,
      description: r.description ?? undefined,
      baseGuests: Number(r.baseGuests),
      maxGuests: Number(r.maxGuests),
      weekdayPrice: num(r.weekdayPrice),
      weekendPrice: r.weekendPrice != null ? num(r.weekendPrice) : undefined,
      mainImage: imgRef(imgs, r.mainImageId),
      images: imgRefs(imgs, r.imageIds),
      activeYn: r.activeYn as YN,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapSeasonRate(r: any) {
    return {
      id: r.id as string,
      name: r.name as string,
      startDate: dateOnly(r.startDate),
      endDate: dateOnly(r.endDate),
      roomId: r.roomId ?? undefined,
      price: num(r.price),
      useYn: r.useYn as YN,
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapReservation(r: any) {
    return {
      id: r.id as string,
      kind: r.kind as string,
      status: r.status as string,
      applicant: {
        name: r.applicantName as string,
        phone: r.applicantPhone as string,
        email: r.applicantEmail ?? undefined,
      },
      targetId: r.targetId as string,
      targetName: r.targetName as string,
      roomId: r.roomId ?? undefined,
      roomName: r.roomName ?? undefined,
      sessionId: r.sessionId ?? undefined,
      startDate: dateOnly(r.startDate),
      endDate: r.endDate ? dateOnly(r.endDate) : undefined,
      guests: r.guests != null ? Number(r.guests) : undefined,
      requestMemo: r.requestMemo ?? undefined,
      adminMemo: r.adminMemo ?? undefined,
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapNotice(r: any) {
    return {
      id: r.id as string,
      title: r.title as string,
      body: r.body as string,
      pinnedYn: r.pinnedYn as YN,
      openYn: r.openYn as YN,
      authorId: r.authorId ?? undefined,
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapGalleryItem(r: any, image?: ImageRef) {
    return {
      id: r.id as string,
      title: r.title as string,
      description: r.description ?? undefined,
      image,
      activeYn: r.activeYn as YN,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapFacility(r: any, imgs: ImgMap) {
    return {
      id: r.id as string,
      kind: r.kind as string,
      name: r.name as string,
      summary: r.summary ?? undefined,
      description: r.description ?? undefined,
      address: addr(r.address),
      location: r.latitude != null ? { latitude: num(r.latitude), longitude: num(r.longitude) } : undefined,
      mainImage: imgRef(imgs, r.mainImageId),
      images: imgRefs(imgs, r.imageIds),
      mainOpenYn: r.mainOpenYn as YN,
      activeYn: r.activeYn as YN,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapBanner(r: any, image?: ImageRef) {
    return {
      id: r.id as string,
      title: r.title as string,
      subtitle: r.subtitle ?? undefined,
      image,
      linkType: r.linkType as string,
      linkValue: r.linkValue ?? undefined,
      activeYn: r.activeYn as YN,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },

  mapVillageProfile(r: any, imgs: ImgMap) {
    return {
      id: r.id as string,
      name: r.name as string,
      description: r.description ?? undefined,
      address: addr(r.address),
      location: r.latitude != null ? { latitude: num(r.latitude), longitude: num(r.longitude) } : undefined,
      phone: r.phone ?? undefined,
      email: r.email ?? undefined,
      images: imgRefs(imgs, r.imageIds),
      createdAt: ts(r.createdAt),
      updatedAt: ts(r.updatedAt),
    };
  },
};

export default mappers;
