import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth";
import type { AuthResponse, LoginRequest } from "@anduck/types";

export async function POST(request: Request) {
  const body: LoginRequest = await request.json();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const res = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error: unknown = await res.json();
    return NextResponse.json(error, { status: res.status });
  }

  const data: AuthResponse = await res.json();
  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data.tokens);
  return response;
}
