export type YN = "Y" | "N";

export interface Timestamps {
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface Sortable {
  sortOrder: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  /** true = 페이징 없이 전체 조회 (엑셀 다운로드 등) */
  all?: boolean;
}

export interface ListQuery extends PaginationQuery {
  q?: string;
  useYn?: YN;
  featuredYn?: YN;
}

export interface ImageRef {
  id: string;
  url: string;
  alt?: string;
}

export interface Address {
  road: string;
  detail?: string;
  zipCode?: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

export type ISODate = string;
export type ISODateTime = string;
