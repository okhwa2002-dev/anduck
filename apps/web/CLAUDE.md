@AGENTS.md

# @anduck/web — 개발 스펙

세부 규칙은 `.claude/roles/` 참조:
- [coding.md](../../.claude/roles/coding.md) — 아키텍처 흐름, import/export, 로깅 규칙
- [auth.md](../../.claude/roles/auth.md) — JWT, 쿠키, 미들웨어 인증 패턴
- [security.md](../../.claude/roles/security.md) — 관리자 세션, CSRF, role guard, 보안 검증 규칙
- [file-upload.md](../../.claude/roles/file-upload.md) — 파일 업로드 API, 저장 방식, image 테이블 연결
- [image-upload.md](../../.claude/roles/image-upload.md) — 공통 이미지 업로드, 대표 이미지 지정/삭제 규칙
- [filter-system.md](../../.claude/roles/filter-system.md) — 관리자 멀티 필터와 API query 규칙
- [admin-list.md](../../.claude/roles/admin-list.md) — 관리자 목록 화면의 공통코드, 필터, 그리드, 목록 상태 규칙
- [excel-export.md](../../.claude/roles/excel-export.md) — 엑셀 다운로드 구현 규칙

---

## 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript 5 |
| 스타일 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui |
| 데이터 페칭 (어드민) | SWR 2 + TanStack Table |
| 인증 | httpOnly 쿠키 + Next.js Middleware |
| JWT 검증 | jose (Edge Runtime) |
| 패키지 관리 | pnpm workspace (monorepo) |

---

## 디렉토리 구조

```
apps/web/src/
  app/                          # Next.js 라우팅 진입점 (얇게 유지)
    (public)/
      layout.tsx                # → layouts/PublicLayout
      page.tsx                  # → view/home/IndexPage
    (admin)/
      layout.tsx                # → layouts/AdminLayout
      admin/
        page.tsx                # → view/admin/DashboardPage
    auth/
      login/
        page.tsx                # → view/auth/LoginPage
    api/                        # Next.js Route Handlers
      auth/
        login/route.ts
        logout/route.ts
        refresh/route.ts
    layout.tsx                  # 루트 레이아웃 (Noto Sans KR 폰트)
  view/                         # 화면 컴포넌트 — 반드시 Page로 끝남
    home/IndexPage.tsx
    admin/DashboardPage.tsx
    auth/LoginPage.tsx
  layouts/
    PublicLayout.tsx            # 헤더 + 푸터
    AdminLayout.tsx             # 사이드바
  components/
    public/
      Header.tsx
      Footer.tsx
      home/                     # 홈 섹션 컴포넌트
        BannerSection.tsx
        ProgramsSection.tsx
        AccommodationsSection.tsx
        NoticesSection.tsx
    admin/
      Sidebar.tsx
      StatCard.tsx
    ui/                         # shadcn/ui 자동 생성
  api/                          # 백엔드 호출 헬퍼 (Server/Client 공용)
    home.ts
    admin.ts
  lib/
    auth.ts                     # 쿠키 헬퍼
  middleware.ts                 # /admin/** 경로 보호
```

---

## 파일 명명 규칙

**`view/` 안의 모든 파일은 반드시 `Page`로 끝난다.**

| 유형 | 파일명 |
|------|--------|
| 목록 첫 화면 | `IndexPage.tsx` |
| 상세 화면 | `DetailPage.tsx` |
| 편집 화면 | `EditPage.tsx` |
| 기타 | `[설명]Page.tsx` |

섹션·서브 컴포넌트는 `components/` 하위에 배치한다.

---

## 라우팅

| 경로 | 레이아웃 | view 컴포넌트 |
|------|----------|--------------|
| `/` | PublicLayout | `home/IndexPage` |
| `/auth/login` | 없음 | `auth/LoginPage` |
| `/admin` | AdminLayout | `admin/DashboardPage` |
| `/admin/programs` | AdminLayout | `admin/programs/IndexPage` |
| `/admin/accommodations` | AdminLayout | `admin/accommodations/IndexPage` |
| `/admin/reservations` | AdminLayout | `admin/reservations/IndexPage` |
| `/admin/reservations/[id]` | AdminLayout | `admin/reservations/EditPage` |
| `/admin/notices` | AdminLayout | `admin/notices/IndexPage` |
| `/admin/gallery` | AdminLayout | `admin/gallery/IndexPage` |
| `/admin/facilities` | AdminLayout | `admin/facilities/IndexPage` |
| `/admin/village` | AdminLayout | `admin/village/IndexPage` |

---

## 인증

### 쿠키 구조

| 쿠키 | httpOnly | 유효기간 | 용도 |
|------|----------|----------|------|
| `access_token` | false (JS 접근 가능) | 15분 | API 호출 Bearer 토큰 |
| `refresh_token` | true | 7일 | Silent refresh |

### 로그인 흐름

1. `LoginPage` → `POST /api/auth/login` (Route Handler)
2. Route Handler → 백엔드 `POST /auth/login`
3. 응답 토큰을 쿠키에 저장 (`setAuthCookies`)
4. `/admin` 리다이렉트

### Middleware (`/admin/**`)

1. `access_token` 검증 (`jose.jwtVerify`) → `userType` 확인
2. 만료 시 `refresh_token`으로 백엔드 직접 갱신 (silent refresh)
3. `userType`이 `ADMIN` 또는 `SUPER_ADMIN`이 아니면 `/auth/login` 리다이렉트

### 로그아웃

`POST /api/auth/logout` → 쿠키 삭제 → `/auth/login`

---

## 데이터 페칭

### 공개 페이지 (Server Components)

```typescript
// src/api/home.ts — ISR 5분
export async function getHomeData(): Promise<HomeData> {
  const res = await fetch(`${API_URL}/home`, { next: { revalidate: 300 } });
  return res.json();
}

// app/(public)/page.tsx
export default async function Page() {
  const data = await getHomeData();
  return <IndexPage data={data} />;
}
```

### 어드민 페이지 (Client Components + SWR)

```typescript
// src/api/admin.ts — access_token 자동 주입
export const adminApi = createEndpoints(http).admin;

// view/admin/SomePage.tsx
"use client";
const { data } = useSWR("key", () => adminApi.something.list());
```

---

## shadcn/ui 컴포넌트

현재 설치된 컴포넌트 (`src/components/ui/`):

| 컴포넌트 | import |
|----------|--------|
| Button | `@/components/ui/button` |
| Input | `@/components/ui/input` |
| Label | `@/components/ui/label` |
| Card | `@/components/ui/card` |
| Badge | `@/components/ui/badge` |
| Table | `@/components/ui/table` |

> **주의:** `Button`에 `asChild` prop이 없다. Link처럼 보이는 버튼은 `buttonVariants` 사용:
> ```tsx
> import { buttonVariants } from "@/components/ui/button";
> <Link href="/admin" className={buttonVariants({ variant: "outline" })}>관리자</Link>
> ```

컴포넌트 추가:
```bash
cd apps/web && pnpm dlx shadcn@latest add [component-name]
```

---

## TanStack Table (어드민 데이터 그리드)

설치됨: `@tanstack/react-table`

어드민 IndexPage에서 사용:
```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
```

shadcn/ui `Table` 컴포넌트와 조합하여 사용한다.

---

## 새 어드민 페이지 추가 방법

1. `src/app/(admin)/admin/[resource]/page.tsx` 생성 (얇은 진입점)
2. `src/view/admin/[resource]/IndexPage.tsx` 생성 (`"use client"`)
3. `src/api/admin.ts`에서 `adminApi.[resource]` 사용
4. `src/components/admin/Sidebar.tsx`의 `NAV_ITEMS`에 항목 추가

---

## 환경변수 (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
JWT_SECRET=anduck-dev-secret-change-in-production
```

---

## 주요 명령어

```bash
# 개발 서버
pnpm --filter @anduck/web dev

# 타입체크 (반드시 .next 캐시 클리어 후)
pnpm --filter @anduck/web typecheck

# 빌드
pnpm --filter @anduck/web build

# shadcn/ui 컴포넌트 추가 (apps/web 디렉토리에서 실행)
cd apps/web && pnpm dlx shadcn@latest add [name]
```
