import type { AxiosInstance } from "axios";
import type {
  Accommodation,
  AuthResponse,
  AvailabilityQuery,
  AvailabilityResult,
  Banner,
  CreateAccommodationInput,
  CreateBannerInput,
  CreateFacilityInput,
  CreateGalleryItemInput,
  CreateNoticeInput,
  CreateProgramInput,
  CreateReservationInput,
  CreateRoomInput,
  DashboardSummary,
  Facility,
  FacilityKind,
  FilterCondition,
  GalleryItem,
  ListQuery,
  LoginRequest,
  Menu,
  Notice,
  Paginated,
  Program,
  Reservation,
  ReservationLookupQuery,
  Room,
  UpdateAccommodationInput,
  UpdateBannerInput,
  UpdateFacilityInput,
  UpdateGalleryItemInput,
  UpdateNoticeInput,
  UpdateProgramInput,
  UpdateReservationStatusInput,
  UpdateRoomInput,
  UpdateVillageProfileInput,
  UploadedFile,
  VillageProfile,
} from "@anduck/types";

type WithFilters<T> = Omit<T, "filters"> & { filters?: FilterCondition[] };

function serializeFilters<T extends { filters?: FilterCondition[] }>(query?: T) {
  if (!query) return undefined;
  const { filters, ...rest } = query;
  return { ...rest, ...(filters?.length ? { filters: JSON.stringify(filters) } : {}) };
}

export function createEndpoints(http: AxiosInstance) {
  return {
    auth: {
      login: (body: LoginRequest) =>
        http.post<AuthResponse>("/auth/login", body).then((r) => r.data),
      me: () => http.get<AuthResponse["user"]>("/auth/me").then((r) => r.data),
      refresh: (refreshToken: string) =>
        http
          .post<AuthResponse>("/auth/refresh", { refreshToken })
          .then((r) => r.data),
      logout: () => http.post<void>("/auth/logout").then((r) => r.data),
    },

    menus: {
      listForUser: (groupCode?: string) =>
        http
          .get<Menu[]>("/auth/menus", { params: { groupCode } })
          .then((r) => r.data),
    },

    home: {
      get: () =>
        http
          .get<{
            banners: Banner[];
            featuredPrograms: Program[];
            featuredAccommodations: Accommodation[];
            latestNotices: Notice[];
            featuredFacilities: Facility[];
          }>("/home")
          .then((r) => r.data),
    },

    village: {
      getProfile: () =>
        http.get<VillageProfile>("/village/profile").then((r) => r.data),
    },

    programs: {
      list: (query?: ListQuery) =>
        http.get<Program[]>("/programs", { params: query }).then((r) => r.data),
      get: (id: string) =>
        http.get<Program>(`/programs/${id}`).then((r) => r.data),
    },

    accommodations: {
      list: (query?: ListQuery) =>
        http
          .get<Accommodation[]>("/accommodations", { params: query })
          .then((r) => r.data),
      get: (id: string) =>
        http.get<Accommodation>(`/accommodations/${id}`).then((r) => r.data),
      listRooms: (accommodationId: string) =>
        http
          .get<Room[]>(`/accommodations/${accommodationId}/rooms`)
          .then((r) => r.data),
      getRoom: (accommodationId: string, roomId: string) =>
        http
          .get<Room>(`/accommodations/${accommodationId}/rooms/${roomId}`)
          .then((r) => r.data),
    },

    reservations: {
      create: (body: CreateReservationInput) =>
        http.post<Reservation>("/reservations", body).then((r) => r.data),
      lookup: (query: ReservationLookupQuery) =>
        http
          .get<Reservation[]>("/reservations/lookup", { params: query })
          .then((r) => r.data),
      checkAvailability: (query: AvailabilityQuery) =>
        http
          .get<AvailabilityResult>("/reservations/availability", {
            params: query,
          })
          .then((r) => r.data),
    },

    notices: {
      list: (query?: ListQuery) =>
        http.get<Notice[]>("/notices", { params: query }).then((r) => r.data),
      get: (id: string) =>
        http.get<Notice>(`/notices/${id}`).then((r) => r.data),
    },

    gallery: {
      list: (query?: ListQuery) =>
        http
          .get<GalleryItem[]>("/gallery", { params: query })
          .then((r) => r.data),
      get: (id: string) =>
        http.get<GalleryItem>(`/gallery/${id}`).then((r) => r.data),
    },

    facilities: {
      list: (query?: ListQuery & { kind?: FacilityKind }) =>
        http
          .get<Facility[]>("/facilities", { params: query })
          .then((r) => r.data),
      get: (id: string) =>
        http.get<Facility>(`/facilities/${id}`).then((r) => r.data),
    },

    files: {
      uploadImage: (formData: unknown, source?: string) =>
        http
          .post<UploadedFile>("/files/images", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            params: source ? { source } : undefined,
          })
          .then((r) => r.data),
    },

    admin: {
      dashboard: {
        summary: () =>
          http.get<DashboardSummary>("/admin/dashboard").then((r) => r.data),
      },

      village: {
        updateProfile: (body: UpdateVillageProfileInput) =>
          http
            .patch<VillageProfile>("/admin/village/profile", body)
            .then((r) => r.data),
      },

      programs: {
        list: (query?: ListQuery) =>
          http
            .get<Paginated<Program>>("/admin/programs", { params: query })
            .then((r) => r.data),
        create: (body: CreateProgramInput) =>
          http.post<Program>("/admin/programs", body).then((r) => r.data),
        update: (id: string, body: UpdateProgramInput) =>
          http.patch<Program>(`/admin/programs/${id}`, body).then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/programs/${id}`).then((r) => r.data),
      },

      accommodations: {
        list: (query?: ListQuery) =>
          http
            .get<Paginated<Accommodation>>("/admin/accommodations", {
              params: query,
            })
            .then((r) => r.data),
        create: (body: CreateAccommodationInput) =>
          http
            .post<Accommodation>("/admin/accommodations", body)
            .then((r) => r.data),
        update: (id: string, body: UpdateAccommodationInput) =>
          http
            .patch<Accommodation>(`/admin/accommodations/${id}`, body)
            .then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/accommodations/${id}`).then((r) => r.data),
      },

      rooms: {
        list: (accommodationId: string, query?: ListQuery) =>
          http
            .get<Paginated<Room>>(
              `/admin/accommodations/${accommodationId}/rooms`,
              { params: query },
            )
            .then((r) => r.data),
        create: (accommodationId: string, body: CreateRoomInput) =>
          http
            .post<Room>(`/admin/accommodations/${accommodationId}/rooms`, body)
            .then((r) => r.data),
        update: (accommodationId: string, roomId: string, body: UpdateRoomInput) =>
          http
            .patch<Room>(
              `/admin/accommodations/${accommodationId}/rooms/${roomId}`,
              body,
            )
            .then((r) => r.data),
        remove: (accommodationId: string, roomId: string) =>
          http
            .delete<void>(
              `/admin/accommodations/${accommodationId}/rooms/${roomId}`,
            )
            .then((r) => r.data),
      },

      reservations: {
        list: (query?: ListQuery) =>
          http
            .get<Paginated<Reservation>>("/admin/reservations", {
              params: query,
            })
            .then((r) => r.data),
        get: (id: string) =>
          http
            .get<Reservation>(`/admin/reservations/${id}`)
            .then((r) => r.data),
        updateStatus: (id: string, body: UpdateReservationStatusInput) =>
          http
            .patch<Reservation>(`/admin/reservations/${id}/status`, body)
            .then((r) => r.data),
      },

      notices: {
        list: (query?: ListQuery) =>
          http
            .get<Paginated<Notice>>("/admin/notices", { params: query })
            .then((r) => r.data),
        create: (body: CreateNoticeInput) =>
          http.post<Notice>("/admin/notices", body).then((r) => r.data),
        update: (id: string, body: UpdateNoticeInput) =>
          http.patch<Notice>(`/admin/notices/${id}`, body).then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/notices/${id}`).then((r) => r.data),
      },

      gallery: {
        list: (query?: ListQuery) =>
          http
            .get<Paginated<GalleryItem>>("/admin/gallery", { params: query })
            .then((r) => r.data),
        create: (body: CreateGalleryItemInput) =>
          http.post<GalleryItem>("/admin/gallery", body).then((r) => r.data),
        update: (id: string, body: UpdateGalleryItemInput) =>
          http
            .patch<GalleryItem>(`/admin/gallery/${id}`, body)
            .then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/gallery/${id}`).then((r) => r.data),
      },

      facilities: {
        list: (query?: WithFilters<ListQuery>) =>
          http
            .get<Paginated<Facility>>("/admin/facilities", { params: serializeFilters(query) })
            .then((r) => r.data),
        get: (id: string) =>
          http.get<Facility>(`/admin/facilities/${id}`).then((r) => r.data),
        create: (body: CreateFacilityInput) =>
          http.post<Facility>("/admin/facilities", body).then((r) => r.data),
        update: (id: string, body: UpdateFacilityInput) =>
          http
            .patch<Facility>(`/admin/facilities/${id}`, body)
            .then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/facilities/${id}`).then((r) => r.data),
        export: (query?: WithFilters<ListQuery>) =>
          http
            .get<ArrayBuffer>("/admin/facilities/export", {
              params: serializeFilters(query),
              responseType: "arraybuffer",
            })
            .then((r) => {
              const disposition = r.headers["content-disposition"] as string | undefined;
              const match = disposition?.match(/filename\*=UTF-8''(.+)/);
              const filename = match ? decodeURIComponent(match[1]) : "download.xlsx";
              return { data: r.data, filename };
            }),
      },

      banners: {
        list: (query?: ListQuery) =>
          http
            .get<Paginated<Banner>>("/admin/banners", { params: query })
            .then((r) => r.data),
        create: (body: CreateBannerInput) =>
          http.post<Banner>("/admin/banners", body).then((r) => r.data),
        update: (id: string, body: UpdateBannerInput) =>
          http.patch<Banner>(`/admin/banners/${id}`, body).then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/banners/${id}`).then((r) => r.data),
      },
    },
  };
}

export type AnduckApi = ReturnType<typeof createEndpoints>;
