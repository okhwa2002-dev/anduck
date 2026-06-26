import type { AxiosInstance } from "axios";
import type * as types from "@anduck/types";

type WithFilters<T> = Omit<T, "filters"> & { filters?: types.FilterCondition[] };

function serializeFilters<T extends { filters?: types.FilterCondition[] }>(query?: T) {
  if (!query) return undefined;
  const { filters, ...rest } = query;
  return { ...rest, ...(filters?.length ? { filters: JSON.stringify(filters) } : {}) };
}

export function createEndpoints(http: AxiosInstance) {
  return {
    auth: {
      login: (body: types.LoginRequest) =>
        http.post<types.AuthResponse>("/auth/login", body).then((r) => r.data),
      me: () => http.get<types.AuthResponse["user"]>("/auth/me").then((r) => r.data),
      refresh: (refreshToken: string) =>
        http
          .post<types.AuthResponse>("/auth/refresh", { refreshToken })
          .then((r) => r.data),
      logout: () => http.post<void>("/auth/logout").then((r) => r.data),
    },

    menus: {
      listForUser: (groupCode?: string) =>
        http
          .get<types.Menu[]>("/auth/menus", { params: { groupCode } })
          .then((r) => r.data),
    },

    codes: {
      listGroups: (groupCodes?: string[] | string) =>
        http
          .get<types.CodeGroup[]>("/codes", {
            params: {
              groupCodes: Array.isArray(groupCodes) ? groupCodes.join(",") : groupCodes,
            },
          })
          .then((r) => r.data),
      getGroup: (groupCode: string) =>
        http.get<types.CodeGroup>(`/codes/${groupCode}`).then((r) => r.data),
    },

    home: {
      get: () =>
        http
          .get<{
            banners: types.Banner[];
            featuredPrograms: types.Program[];
            featuredAccommodations: types.Accommodation[];
            latestNotices: types.Notice[];
            featuredFacilities: types.Facility[];
          }>("/home")
          .then((r) => r.data),
    },

    village: {
      getProfile: () =>
        http.get<types.VillageProfile>("/village/profile").then((r) => r.data),
    },

    programs: {
      list: (query?: types.ListQuery) =>
        http.get<types.Program[]>("/programs", { params: query }).then((r) => r.data),
      get: (id: string) =>
        http.get<types.Program>(`/programs/${id}`).then((r) => r.data),
    },

    accommodations: {
      list: (query?: types.ListQuery) =>
        http
          .get<types.Accommodation[]>("/accommodations", { params: query })
          .then((r) => r.data),
      get: (id: string) =>
        http.get<types.Accommodation>(`/accommodations/${id}`).then((r) => r.data),
      listRooms: (accommodationId: string) =>
        http
          .get<types.Room[]>(`/accommodations/${accommodationId}/rooms`)
          .then((r) => r.data),
      getRoom: (accommodationId: string, roomId: string) =>
        http
          .get<types.Room>(`/accommodations/${accommodationId}/rooms/${roomId}`)
          .then((r) => r.data),
    },

    reservations: {
      create: (body: types.CreateReservationInput) =>
        http.post<types.Reservation>("/reservations", body).then((r) => r.data),
      lookup: (query: types.ReservationLookupQuery) =>
        http
          .get<types.Reservation[]>("/reservations/lookup", { params: query })
          .then((r) => r.data),
      checkAvailability: (query: types.AvailabilityQuery) =>
        http
          .get<types.AvailabilityResult>("/reservations/availability", {
            params: query,
          })
          .then((r) => r.data),
    },

    notices: {
      list: (query?: types.ListQuery) =>
        http.get<types.Notice[]>("/notices", { params: query }).then((r) => r.data),
      get: (id: string) =>
        http.get<types.Notice>(`/notices/${id}`).then((r) => r.data),
    },

    gallery: {
      list: (query?: types.ListQuery) =>
        http
          .get<types.GalleryItem[]>("/gallery", { params: query })
          .then((r) => r.data),
      get: (id: string) =>
        http.get<types.GalleryItem>(`/gallery/${id}`).then((r) => r.data),
    },

    facilities: {
      list: (query?: types.ListQuery & { kind?: types.FacilityKind }) =>
        http
          .get<types.Facility[]>("/facilities", { params: query })
          .then((r) => r.data),
      get: (id: string) =>
        http.get<types.Facility>(`/facilities/${id}`).then((r) => r.data),
    },

    files: {
      uploadImage: (formData: unknown, source?: string) =>
        http
          .post<types.UploadedFile>("/files/images", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            params: source ? { source } : undefined,
          })
          .then((r) => r.data),
    },

    admin: {
      dashboard: {
        summary: () =>
          http.get<types.DashboardSummary>("/admin/dashboard").then((r) => r.data),
      },

      village: {
        updateProfile: (body: types.UpdateVillageProfileInput) =>
          http
            .patch<types.VillageProfile>("/admin/village/profile", body)
            .then((r) => r.data),
        intros: {
          list: (query?: WithFilters<types.ListQuery>) =>
            http
              .get<types.Paginated<types.VillageProfile>>("/admin/village/intros", { params: serializeFilters(query) })
              .then((r) => r.data),
          get: (id: string) =>
            http.get<types.VillageProfile>(`/admin/village/intros/${id}`).then((r) => r.data),
          create: (body: types.CreateVillageIntroInput) =>
            http.post<types.VillageProfile>("/admin/village/intros", body).then((r) => r.data),
          update: (id: string, body: types.UpdateVillageIntroInput) =>
            http.patch<types.VillageProfile>(`/admin/village/intros/${id}`, body).then((r) => r.data),
          remove: (id: string) =>
            http.delete<void>(`/admin/village/intros/${id}`).then((r) => r.data),
        },
      },

      programs: {
        list: (query?: types.ListQuery) =>
          http
            .get<types.Paginated<types.Program>>("/admin/programs", { params: query })
            .then((r) => r.data),
        create: (body: types.CreateProgramInput) =>
          http.post<types.Program>("/admin/programs", body).then((r) => r.data),
        update: (id: string, body: types.UpdateProgramInput) =>
          http.patch<types.Program>(`/admin/programs/${id}`, body).then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/programs/${id}`).then((r) => r.data),
      },

      accommodations: {
        list: (query?: types.ListQuery) =>
          http
            .get<types.Paginated<types.Accommodation>>("/admin/accommodations", {
              params: query,
            })
            .then((r) => r.data),
        create: (body: types.CreateAccommodationInput) =>
          http
            .post<types.Accommodation>("/admin/accommodations", body)
            .then((r) => r.data),
        update: (id: string, body: types.UpdateAccommodationInput) =>
          http
            .patch<types.Accommodation>(`/admin/accommodations/${id}`, body)
            .then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/accommodations/${id}`).then((r) => r.data),
      },

      rooms: {
        list: (accommodationId: string, query?: types.ListQuery) =>
          http
            .get<types.Paginated<types.Room>>(
              `/admin/accommodations/${accommodationId}/rooms`,
              { params: query },
            )
            .then((r) => r.data),
        create: (accommodationId: string, body: types.CreateRoomInput) =>
          http
            .post<types.Room>(`/admin/accommodations/${accommodationId}/rooms`, body)
            .then((r) => r.data),
        update: (accommodationId: string, roomId: string, body: types.UpdateRoomInput) =>
          http
            .patch<types.Room>(
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
        list: (query?: WithFilters<types.ListQuery>) =>
          http
            .get<types.Paginated<types.Reservation>>("/admin/reservations", {
              params: serializeFilters(query),
            })
            .then((r) => r.data),
        get: (id: string) =>
          http
            .get<types.Reservation>(`/admin/reservations/${id}`)
            .then((r) => r.data),
        updateStatus: (id: string, body: types.UpdateReservationStatusInput) =>
          http
            .patch<types.Reservation>(`/admin/reservations/${id}/status`, body)
            .then((r) => r.data),
        export: (query?: WithFilters<types.ListQuery>) =>
          http
            .get<ArrayBuffer>("/admin/reservations/export", {
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

      notices: {
        list: (query?: types.ListQuery) =>
          http
            .get<types.Paginated<types.Notice>>("/admin/notices", { params: query })
            .then((r) => r.data),
        create: (body: types.CreateNoticeInput) =>
          http.post<types.Notice>("/admin/notices", body).then((r) => r.data),
        update: (id: string, body: types.UpdateNoticeInput) =>
          http.patch<types.Notice>(`/admin/notices/${id}`, body).then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/notices/${id}`).then((r) => r.data),
      },

      gallery: {
        list: (query?: types.ListQuery) =>
          http
            .get<types.Paginated<types.GalleryItem>>("/admin/gallery", { params: query })
            .then((r) => r.data),
        create: (body: types.CreateGalleryItemInput) =>
          http.post<types.GalleryItem>("/admin/gallery", body).then((r) => r.data),
        update: (id: string, body: types.UpdateGalleryItemInput) =>
          http
            .patch<types.GalleryItem>(`/admin/gallery/${id}`, body)
            .then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/gallery/${id}`).then((r) => r.data),
      },

      facilities: {
        list: (query?: WithFilters<types.ListQuery>) =>
          http
            .get<types.Paginated<types.Facility>>("/admin/facilities", { params: serializeFilters(query) })
            .then((r) => r.data),
        get: (id: string) =>
          http.get<types.Facility>(`/admin/facilities/${id}`).then((r) => r.data),
        create: (body: types.CreateFacilityInput) =>
          http.post<types.Facility>("/admin/facilities", body).then((r) => r.data),
        update: (id: string, body: types.UpdateFacilityInput) =>
          http
            .patch<types.Facility>(`/admin/facilities/${id}`, body)
            .then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/facilities/${id}`).then((r) => r.data),
        export: (query?: WithFilters<types.ListQuery>) =>
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
        list: (query?: types.ListQuery) =>
          http
            .get<types.Paginated<types.Banner>>("/admin/banners", { params: query })
            .then((r) => r.data),
        create: (body: types.CreateBannerInput) =>
          http.post<types.Banner>("/admin/banners", body).then((r) => r.data),
        update: (id: string, body: types.UpdateBannerInput) =>
          http.patch<types.Banner>(`/admin/banners/${id}`, body).then((r) => r.data),
        remove: (id: string) =>
          http.delete<void>(`/admin/banners/${id}`).then((r) => r.data),
      },
    },
  };
}

export type AnduckApi = ReturnType<typeof createEndpoints>;
