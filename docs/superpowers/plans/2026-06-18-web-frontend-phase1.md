# Web Frontend (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web` Next.js 15 앱을 monorepo에 추가하고, 공개 홈 페이지·로그인·어드민 대시보드 뼈대를 구축한다.

**Architecture:** Next.js App Router Route Groups(`(public)`, `(admin)`)으로 공개/어드민 레이아웃을 완전 분리한다. `view/`는 `Page`로 끝나는 화면 컴포넌트만, `components/`는 섹션/공통 UI, `layouts/`는 레이아웃을 담는다. 어드민 인증은 `access_token`(JS readable 쿠키, 15분)과 `refresh_token`(httpOnly, 7일)을 분리 보관하며, middleware에서 silent refresh를 수행한다.

**Tech Stack:** Next.js 15, TypeScript 5, Tailwind CSS 3, shadcn/ui, SWR 2, `@anduck/api-client`, `@anduck/types`, `jose` (Edge Runtime JWT)

## Global Constraints

- 패키지 이름: `@anduck/web`
- Node.js 20, pnpm workspace (`apps/*` 이미 등록됨)
- `view/` 내 모든 파일은 `Page`로 끝남
- `access_token`: JS readable 쿠키 (15분, API 호출용), `refresh_token`: httpOnly 쿠키 (7일, silent refresh용)
- `NEXT_PUBLIC_API_URL=http://localhost:4000`, `JWT_SECRET=...`
- middleware는 Edge Runtime — `jose` 사용 (`jsonwebtoken` 사용 불가)
- 어드민 허용 `userType`: `ADMIN`, `SUPER_ADMIN`

---

### Task 1: 프로젝트 세팅

**Files:**
- Create: `apps/web/` (Next.js 앱 전체)
- Modify: `apps/web/package.json` (name 변경)
- Create: `apps/web/.env.local`

**Interfaces:**
- Produces: `@anduck/web` 패키지, `http://localhost:3000` 접속 가능

- [ ] **Step 1: Next.js 15 앱 생성**

```bash
pnpm create next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

프롬프트 응답:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Turbopack: No
- Import alias: `@/*`

- [ ] **Step 2: package.json name 변경**

`apps/web/package.json`의 `name` 필드 수정:
```json
{
  "name": "@anduck/web",
  "version": "0.1.0",
  "private": true
}
```

- [ ] **Step 3: 의존성 추가**

```bash
pnpm --filter @anduck/web add @anduck/types@workspace:* @anduck/api-client@workspace:* swr jose
```

- [ ] **Step 4: 공유 패키지 빌드**

```bash
pnpm --filter @anduck/types build
pnpm --filter @anduck/api-client build
```

Expected: `packages/types/dist/`, `packages/api-client/dist/` 생성

- [ ] **Step 5: .env.local 생성**

`apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
JWT_SECRET=anduck-dev-secret-change-in-production
```

- [ ] **Step 6: 개발 서버 기동 확인**

```bash
pnpm --filter @anduck/web dev
```

Expected: `http://localhost:3000` 에서 Next.js 기본 페이지 노출

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): Next.js 15 앱 초기 세팅"
```

---

### Task 2: shadcn/ui 초기화

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/input.tsx`
- Create: `apps/web/src/components/ui/label.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/badge.tsx`
- Create: `apps/web/src/components/ui/table.tsx`

**Interfaces:**
- Produces: `Button`, `Input`, `Label`, `Card`, `Badge`, `Table` — `@/components/ui/...` import 가능

- [ ] **Step 1: shadcn/ui 초기화**

```bash
cd apps/web && pnpm dlx shadcn@latest init -d
```

`-d`: Default style, Slate color, CSS variables 기본값 사용

- [ ] **Step 2: 컴포넌트 추가**

```bash
pnpm dlx shadcn@latest add button input label card badge table
```

- [ ] **Step 3: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add apps/web/components.json apps/web/src/components/ui
git commit -m "feat(web): shadcn/ui 초기화 및 기본 컴포넌트 추가"
```

---

### Task 3: 쿠키 헬퍼 & API 헬퍼

**Files:**
- Create: `apps/web/src/lib/auth.ts`
- Create: `apps/web/src/api/home.ts`
- Create: `apps/web/src/api/admin.ts`

**Interfaces:**
- Produces:
  - `setAuthCookies(response: NextResponse, tokens: AuthTokens): void`
  - `clearAuthCookies(response: NextResponse): void`
  - `getAccessToken(): string | null` (브라우저 전용)
  - `getHomeData(): Promise<HomeData>`
  - `adminApi` — `createEndpoints(http).admin` 인스턴스

- [ ] **Step 1: 쿠키 헬퍼 작성**

`apps/web/src/lib/auth.ts`:
```typescript
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
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
}

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
```

- [ ] **Step 2: 홈 API 헬퍼 작성**

`apps/web/src/api/home.ts`:
```typescript
import type { Accommodation, Banner, Facility, Notice, Program } from "@anduck/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export interface HomeData {
  banners: Banner[];
  featuredPrograms: Program[];
  featuredAccommodations: Accommodation[];
  latestNotices: Notice[];
  featuredFacilities: Facility[];
}

export async function getHomeData(): Promise<HomeData> {
  const res = await fetch(`${API_URL}/home`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error("홈 데이터 로드 실패");
  return res.json() as Promise<HomeData>;
}
```

- [ ] **Step 3: 어드민 API 헬퍼 작성**

`apps/web/src/api/admin.ts`:
```typescript
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
```

- [ ] **Step 4: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib apps/web/src/api
git commit -m "feat(web): 쿠키 헬퍼 및 API 헬퍼 추가"
```

---

### Task 4: 인증 Route Handlers

**Files:**
- Create: `apps/web/src/app/api/auth/login/route.ts`
- Create: `apps/web/src/app/api/auth/logout/route.ts`
- Create: `apps/web/src/app/api/auth/refresh/route.ts`

**Interfaces:**
- Consumes: `setAuthCookies`, `clearAuthCookies` from `@/lib/auth`
- Produces:
  - `POST /api/auth/login` body: `{ loginId, password }` → 쿠키 설정 + `{ user }` 반환
  - `POST /api/auth/logout` → 쿠키 삭제
  - `POST /api/auth/refresh` → 쿠키 갱신 + `{ user }` 반환

- [ ] **Step 1: 로그인 Route Handler 작성**

`apps/web/src/app/api/auth/login/route.ts`:
```typescript
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
```

- [ ] **Step 2: 로그아웃 Route Handler 작성**

`apps/web/src/app/api/auth/logout/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
```

- [ ] **Step 3: 토큰 갱신 Route Handler 작성**

`apps/web/src/app/api/auth/refresh/route.ts`:
```typescript
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
```

- [ ] **Step 4: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api
git commit -m "feat(web): 인증 Route Handler 추가 (login/logout/refresh)"
```

---

### Task 5: Middleware

**Files:**
- Create: `apps/web/src/middleware.ts`

**Interfaces:**
- Consumes: `JWT_SECRET` env, `access_token` / `refresh_token` 쿠키, `NEXT_PUBLIC_API_URL` env, `AuthResponse` from `@anduck/types`
- Produces: `/admin/**` 경로 → 유효한 ADMIN/SUPER_ADMIN만 통과, 나머지 `/auth/login` 리다이렉트

- [ ] **Step 1: middleware 작성**

`apps/web/src/middleware.ts`:
```typescript
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
```

- [ ] **Step 2: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 3: 동작 확인**

```bash
pnpm --filter @anduck/web dev
```

브라우저에서 `http://localhost:3000/admin` 접속 → `/auth/login`으로 리다이렉트 확인

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat(web): /admin 경로 보호 middleware 추가 (silent refresh 포함)"
```

---

### Task 6: 루트 레이아웃 & 공개 레이아웃

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/layouts/PublicLayout.tsx`
- Create: `apps/web/src/components/public/Header.tsx`
- Create: `apps/web/src/components/public/Footer.tsx`
- Create: `apps/web/src/app/(public)/layout.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`
- Produces: `PublicLayout` — 스티키 헤더 + children + 푸터

- [ ] **Step 1: 루트 레이아웃 수정**

`apps/web/src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "안덕 건강힐링체험마을",
  description: "제주 안덕 건강힐링체험마을에 오신 것을 환영합니다",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Header 컴포넌트 작성**

`apps/web/src/components/public/Header.tsx`:
```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "체험 프로그램", href: "/programs" },
  { label: "숙소", href: "/accommodations" },
  { label: "시설", href: "/facilities" },
  { label: "갤러리", href: "/gallery" },
  { label: "공지사항", href: "/notices" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-green-800">
          안덕 건강힐링체험마을
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 transition-colors hover:text-green-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">관리자</Link>
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Footer 컴포넌트 작성**

`apps/web/src/components/public/Footer.tsx`:
```typescript
export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-10">
      <div className="container mx-auto px-4 text-center">
        <p className="font-semibold text-gray-800">안덕 건강힐링체험마을</p>
        <p className="mt-1 text-sm text-gray-500">제주특별자치도 서귀포시 안덕면</p>
        <p className="mt-4 text-xs text-gray-400">
          © 2024 안덕 건강힐링체험마을. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: PublicLayout 작성**

`apps/web/src/layouts/PublicLayout.tsx`:
```typescript
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: (public)/layout.tsx 작성**

`apps/web/src/app/(public)/layout.tsx`:
```typescript
import { PublicLayout } from "@/layouts/PublicLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
```

- [ ] **Step 6: 타입체크 및 확인**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음. `http://localhost:3000` 에서 헤더·푸터 확인

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/layouts apps/web/src/components/public "apps/web/src/app/(public)/layout.tsx"
git commit -m "feat(web): 공개 레이아웃 (Header, Footer, PublicLayout) 추가"
```

---

### Task 7: 홈 페이지

**Files:**
- Create: `apps/web/src/components/public/home/BannerSection.tsx`
- Create: `apps/web/src/components/public/home/ProgramsSection.tsx`
- Create: `apps/web/src/components/public/home/AccommodationsSection.tsx`
- Create: `apps/web/src/components/public/home/NoticesSection.tsx`
- Create: `apps/web/src/view/home/IndexPage.tsx`
- Modify: `apps/web/src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: `getHomeData(): Promise<HomeData>` from `@/api/home`
- Produces: `/` — 배너, 추천 프로그램, 숙소, 공지 섹션 노출

타입 참조: `Banner.image: ImageRef`, `Program.mainImage?: ImageRef`, `Accommodation.mainImage?: ImageRef`, `ImageRef.url: string`, `ImageRef.alt?: string`

- [ ] **Step 1: BannerSection 작성**

`apps/web/src/components/public/home/BannerSection.tsx`:
```typescript
import Image from "next/image";
import type { Banner } from "@anduck/types";

export function BannerSection({ banners }: { banners: Banner[] }) {
  const main = banners[0];
  if (!main) return null;

  return (
    <section className="relative h-[480px] w-full overflow-hidden bg-gray-200">
      {main.image?.url && (
        <Image
          src={main.image.url}
          alt={main.image.alt ?? main.title}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white">
        <h1 className="text-4xl font-bold drop-shadow">{main.title}</h1>
        {main.subtitle && (
          <p className="mt-3 text-lg drop-shadow">{main.subtitle}</p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: ProgramsSection 작성**

`apps/web/src/components/public/home/ProgramsSection.tsx`:
```typescript
import Image from "next/image";
import Link from "next/link";
import type { Program } from "@anduck/types";

export function ProgramsSection({ programs }: { programs: Program[] }) {
  if (!programs.length) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">
          체험 프로그램
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 bg-gray-100">
                {program.mainImage?.url && (
                  <Image
                    src={program.mainImage.url}
                    alt={program.mainImage.alt ?? program.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{program.name}</h3>
                {program.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {program.summary}
                  </p>
                )}
                <p className="mt-2 text-sm font-medium text-green-700">
                  {program.pricePerPerson.toLocaleString()}원 / 인
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: AccommodationsSection 작성**

`apps/web/src/components/public/home/AccommodationsSection.tsx`:
```typescript
import Image from "next/image";
import Link from "next/link";
import type { Accommodation } from "@anduck/types";

export function AccommodationsSection({
  accommodations,
}: {
  accommodations: Accommodation[];
}) {
  if (!accommodations.length) return null;

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">숙소</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {accommodations.map((acc) => (
            <Link
              key={acc.id}
              href={`/accommodations/${acc.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-52 bg-gray-100">
                {acc.mainImage?.url && (
                  <Image
                    src={acc.mainImage.url}
                    alt={acc.mainImage.alt ?? acc.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{acc.name}</h3>
                {acc.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {acc.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: NoticesSection 작성**

`apps/web/src/components/public/home/NoticesSection.tsx`:
```typescript
import Link from "next/link";
import type { Notice } from "@anduck/types";

export function NoticesSection({ notices }: { notices: Notice[] }) {
  if (!notices.length) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-800">
          공지사항
        </h2>
        <ul className="divide-y rounded-xl border bg-white">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/notices/${notice.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-800">
                  {notice.title}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <Link href="/notices" className="text-sm text-green-700 hover:underline">
            전체 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: IndexPage 작성**

`apps/web/src/view/home/IndexPage.tsx`:
```typescript
import { BannerSection } from "@/components/public/home/BannerSection";
import { ProgramsSection } from "@/components/public/home/ProgramsSection";
import { AccommodationsSection } from "@/components/public/home/AccommodationsSection";
import { NoticesSection } from "@/components/public/home/NoticesSection";
import type { HomeData } from "@/api/home";

export function IndexPage({ data }: { data: HomeData }) {
  return (
    <>
      <BannerSection banners={data.banners} />
      <ProgramsSection programs={data.featuredPrograms} />
      <AccommodationsSection accommodations={data.featuredAccommodations} />
      <NoticesSection notices={data.latestNotices} />
    </>
  );
}
```

- [ ] **Step 6: (public)/page.tsx 수정**

`apps/web/src/app/(public)/page.tsx`:
```typescript
import { getHomeData } from "@/api/home";
import { IndexPage } from "@/view/home/IndexPage";

export default async function Page() {
  const data = await getHomeData();
  return <IndexPage data={data} />;
}
```

- [ ] **Step 7: next.config.ts에 이미지 도메인 추가**

API에서 반환하는 이미지 URL의 도메인을 `next.config.ts`에 허용 추가:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 8: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/view/home apps/web/src/components/public/home "apps/web/src/app/(public)/page.tsx" apps/web/next.config.ts
git commit -m "feat(web): 홈 페이지 추가 (배너, 프로그램, 숙소, 공지 섹션)"
```

---

### Task 8: 로그인 페이지

**Files:**
- Create: `apps/web/src/view/auth/LoginPage.tsx`
- Create: `apps/web/src/app/auth/login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/login`, `Button`, `Input`, `Label` from shadcn/ui
- Produces: `/auth/login` — loginId/password 폼, 성공 시 `/admin` 이동

- [ ] **Step 1: LoginPage 작성**

`apps/web/src/view/auth/LoginPage.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });

      if (!res.ok) {
        const data: { message?: string } = await res.json();
        setError(data.message ?? "로그인에 실패했습니다.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-800">
          관리자 로그인
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loginId">아이디</Label>
            <Input
              id="loginId"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: auth/login/page.tsx 작성**

`apps/web/src/app/auth/login/page.tsx`:
```typescript
import { LoginPage } from "@/view/auth/LoginPage";

export default function Page() {
  return <LoginPage />;
}
```

- [ ] **Step 3: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 4: 동작 확인**

`http://localhost:3000/auth/login` 에서 폼 표시 확인.
백엔드 실행 후 올바른 loginId/password 입력 시 `/admin` 리다이렉트 확인.
잘못된 인증 정보 입력 시 에러 메시지 표시 확인.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/view/auth apps/web/src/app/auth
git commit -m "feat(web): 로그인 페이지 추가"
```

---

### Task 9: 어드민 레이아웃 & 사이드바

**Files:**
- Create: `apps/web/src/components/admin/Sidebar.tsx`
- Create: `apps/web/src/layouts/AdminLayout.tsx`
- Create: `apps/web/src/app/(admin)/layout.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/logout`, `Button` from shadcn/ui
- Produces: `AdminLayout` — 고정 사이드바 + 스크롤 가능한 메인 영역

- [ ] **Step 1: Sidebar 작성**

`apps/web/src/components/admin/Sidebar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "대시보드", href: "/admin" },
  { label: "프로그램", href: "/admin/programs" },
  { label: "숙소", href: "/admin/accommodations" },
  { label: "예약", href: "/admin/reservations" },
  { label: "공지사항", href: "/admin/notices" },
  { label: "갤러리", href: "/admin/gallery" },
  { label: "시설", href: "/admin/facilities" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-4">
        <span className="font-bold text-green-800">안덕 관리자</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-gray-100 ${
              pathname === item.href
                ? "bg-green-50 font-medium text-green-800"
                : "text-gray-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: AdminLayout 작성**

`apps/web/src/layouts/AdminLayout.tsx`:
```typescript
import { Sidebar } from "@/components/admin/Sidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: (admin)/layout.tsx 작성**

`apps/web/src/app/(admin)/layout.tsx`:
```typescript
import { AdminLayout } from "@/layouts/AdminLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
```

- [ ] **Step 4: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음

- [ ] **Step 5: 동작 확인**

로그인 후 `/admin` 접속 시 사이드바 표시 확인.
사이드바에서 현재 경로(`/admin`) 항목이 초록색으로 하이라이트 확인.
로그아웃 버튼 클릭 시 `/auth/login` 이동 확인.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/admin/Sidebar.tsx apps/web/src/layouts/AdminLayout.tsx "apps/web/src/app/(admin)/layout.tsx"
git commit -m "feat(web): 어드민 레이아웃 및 사이드바 추가"
```

---

### Task 10: 어드민 대시보드 페이지

**Files:**
- Create: `apps/web/src/components/admin/StatCard.tsx`
- Create: `apps/web/src/view/admin/DashboardPage.tsx`
- Create: `apps/web/src/app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `adminApi.dashboard.summary()` from `@/api/admin`, `Card` from shadcn/ui, `DashboardSummary` / `Reservation` from `@anduck/types`
- Produces: `/admin` — 통계 카드 4개 + 최근 예약 테이블

`DashboardSummary`: `{ todayReservationCount, pendingReservationCount, activeProgramCount, activeAccommodationCount, recentReservations: Reservation[] }`

`Reservation` 필드는 `packages/types/src/reservation.ts` 를 확인하여 `guestName`, `guestPhone`, `status` 필드명을 검증한다.

- [ ] **Step 1: Reservation 타입 확인**

`packages/types/src/reservation.ts` 를 열어 `guestName`, `guestPhone`, `status` 필드명이 실제로 존재하는지 확인한다. 다른 필드명이라면 아래 DashboardPage 코드를 실제 필드명으로 수정한다.

- [ ] **Step 2: StatCard 작성**

`apps/web/src/components/admin/StatCard.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  description?: string;
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: DashboardPage 작성**

`apps/web/src/view/admin/DashboardPage.tsx`:
```typescript
"use client";

import useSWR from "swr";
import { StatCard } from "@/components/admin/StatCard";
import { adminApi } from "@/api/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  CONFIRMED: "확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

export function DashboardPage() {
  const { data, error, isLoading } = useSWR("admin-dashboard", () =>
    adminApi.dashboard.summary(),
  );

  if (isLoading) return <p className="text-sm text-gray-400">로딩 중...</p>;
  if (error || !data)
    return <p className="text-sm text-red-500">데이터를 불러오지 못했습니다.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="오늘 예약" value={data.todayReservationCount} />
        <StatCard title="대기 예약" value={data.pendingReservationCount} />
        <StatCard title="운영 프로그램" value={data.activeProgramCount} />
        <StatCard title="운영 숙소" value={data.activeAccommodationCount} />
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-600">최근 예약</h2>
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>예약자</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>접수일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentReservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.guestName}</TableCell>
                  <TableCell>{r.guestPhone}</TableCell>
                  <TableCell>{STATUS_LABEL[r.status] ?? r.status}</TableCell>
                  <TableCell>
                    {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))}
              {data.recentReservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400">
                    최근 예약이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: (admin)/admin/page.tsx 작성**

`apps/web/src/app/(admin)/admin/page.tsx`:
```typescript
import { DashboardPage } from "@/view/admin/DashboardPage";

export default function Page() {
  return <DashboardPage />;
}
```

- [ ] **Step 5: 타입체크**

```bash
pnpm --filter @anduck/web typecheck
```

Expected: 에러 없음 (Step 1에서 확인한 실제 필드명과 일치해야 함)

- [ ] **Step 6: 동작 확인**

로그인 후 `http://localhost:3000/admin` 에서 통계 카드 4개 및 최근 예약 테이블 확인

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/admin/StatCard.tsx apps/web/src/view/admin "apps/web/src/app/(admin)/admin"
git commit -m "feat(web): 어드민 대시보드 페이지 추가"
```
