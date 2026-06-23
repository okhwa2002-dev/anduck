import type { Address, GeoPoint, ImageRef, Sortable, Timestamps, YN } from "./common";

export interface Notice extends Timestamps {
  id: string;
  title: string;
  body: string;
  pinnedYn: YN;
  openYn: YN;
  authorId: string;
}

export interface GalleryItem extends Timestamps, Sortable {
  id: string;
  title?: string;
  description?: string;
  image: ImageRef;
  activeYn: YN;
}

export enum FacilityKind {
  VILLAGE = "VILLAGE",
  NEARBY = "NEARBY",
}

export interface Facility extends Timestamps, Sortable {
  id: string;
  kind: FacilityKind;
  name: string;
  summary?: string;
  description: string;
  address?: Address;
  location?: GeoPoint;
  mainImage?: ImageRef;
  images: ImageRef[];
  mainOpenYn: YN;
  activeYn: YN;
}

export enum BannerLinkType {
  NONE = "NONE",
  PROGRAM = "PROGRAM",
  ACCOMMODATION = "ACCOMMODATION",
  NOTICE = "NOTICE",
  FACILITY = "FACILITY",
  URL = "URL",
}

export interface Banner extends Timestamps, Sortable {
  id: string;
  title: string;
  subtitle?: string;
  image: ImageRef;
  linkType: BannerLinkType;
  linkValue?: string;
  activeYn: YN;
}

export interface VillageProfile extends Timestamps {
  id: string;
  name: string;
  description: string;
  address: Address;
  location?: GeoPoint;
  phone?: string;
  email?: string;
  images: ImageRef[];
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  pinnedYn?: YN;
  openYn?: YN;
}

export type UpdateNoticeInput = Partial<CreateNoticeInput>;

export interface CreateGalleryItemInput {
  title?: string;
  description?: string;
  imageId: string;
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateGalleryItemInput = Partial<CreateGalleryItemInput>;

export interface CreateFacilityInput {
  kind: FacilityKind;
  name: string;
  summary?: string;
  description: string;
  address?: Address;
  location?: GeoPoint;
  mainImageId?: string;
  imageIds?: string[];
  mainOpenYn?: YN;
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateFacilityInput = Partial<CreateFacilityInput>;

export interface CreateBannerInput {
  title: string;
  subtitle?: string;
  imageId: string;
  linkType: BannerLinkType;
  linkValue?: string;
  activeYn?: YN;
  sortOrder?: number;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

export interface UpdateVillageProfileInput {
  name?: string;
  description?: string;
  address?: Address;
  location?: GeoPoint;
  phone?: string;
  email?: string;
  imageIds?: string[];
}
