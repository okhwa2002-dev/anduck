import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth";
import type { AuthResponse } from "@anduck/types";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "refresh_token 없음" }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    return NextResponse.json({ message: "토큰 갱신 실패" }, { status: 401 });
  }

  const data: AuthResponse = await res.json();
  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data.tokens);
  return response;
}
