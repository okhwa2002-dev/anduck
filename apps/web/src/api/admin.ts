import { createApiClient, createEndpoints } from "@anduck/api-client";
import { getAccessToken } from "@/lib/auth";

const http = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  getToken: getAccessToken,
  onUnauthorized: () => {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  },
});

export const adminApi = createEndpoints(http).admin;
