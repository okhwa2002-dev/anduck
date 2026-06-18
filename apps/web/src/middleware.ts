import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import type { AuthResponse } from "@anduck/types";

const ADMIN_TYPES = new Set(["ADMIN", "SUPER_ADMIN"]);
const IS_PROD = process.env.NODE_ENV === "production";

async function verifyToken(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return (payload["userType"] as string) ?? null;
  } catch {
    return null;
  }
}

async function doRefresh(refreshToken: string): Promise<AuthResponse | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<AuthResponse>;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (accessToken) {
    const userType = await verifyToken(accessToken);
    if (userType && ADMIN_TYPES.has(userType)) {
      return NextResponse.next();
    }
  }

  const refreshed = await doRefresh(refreshToken);
  if (!refreshed || !ADMIN_TYPES.has(refreshed.user.userType)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const response = NextResponse.next();
  response.cookies.set("access_token", refreshed.tokens.accessToken, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 15 * 60,
    path: "/",
  });
  response.cookies.set("refresh_token", refreshed.tokens.refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
