import type { NextResponse } from "next/server";
import type { AuthTokens } from "@anduck/types";

const IS_PROD = process.env.NODE_ENV === "production";

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set("access_token", tokens.accessToken, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  response.cookies.set("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  response.cookies.set("csrf_token", tokens.csrfToken, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("csrf_token", "", { maxAge: 0, path: "/" });
}

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
