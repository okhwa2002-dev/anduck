import { createApiClient, createEndpoints } from "@anduck/api-client";
import { getAccessToken, getCsrfToken } from "@/lib/auth";

const http = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  getToken: getAccessToken,
  getCsrfToken,
  onUnauthorized: () => {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  },
});

const endpoints = createEndpoints(http);
export const adminApi = endpoints.admin;
export const menuApi = endpoints.menus;
