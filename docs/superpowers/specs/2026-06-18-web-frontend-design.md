# Web Frontend 설계 — 안덕 건강힐링체험마을

**날짜:** 2026-06-18  
**범위:** Phase 1 (뼈대 + 홈 + 어드민 대시보드)

---

## 1. 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + TypeScript |
| 스타일 | Tailwind CSS |
| UI 컴포넌트 | shadcn/ui |
| 데이터 페칭 (어드민) | SWR |
| 인증 | httpOnly 쿠키 + Next.js middleware |
| 패키지 관리 | pnpm workspace (기존 monorepo) |

---

## 2. 디렉토리 구조

```
apps/web/
  src/
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
      api/                        # Next.js Route Handlers (app/ 안에 있어야 함)
        auth/
          login/route.ts
          logout/route.ts
          refresh/route.ts
      layout.tsx                  # 루트 레이아웃 (폰트, providers)
    view/                         # 화면 페이지 컴포넌트 (모두 Page로 끝남)
      home/
        IndexPage.tsx
      admin/
        DashboardPage.tsx
      auth/
        LoginPage.tsx
    layouts/
      PublicLayout.tsx            # 헤더 + 푸터
      AdminLayout.tsx             # 사이드바
    components/
      public/
        Header.tsx
        Footer.tsx
        home/                     # 홈 페이지 내 섹션 컴포넌트
          BannerSection.tsx
          ProgramsSection.tsx
          AccommodationsSection.tsx
          NoticesSection.tsx
      admin/
        Sidebar.tsx
        StatCard.tsx
      ui/                         # shadcn/ui 컴포넌트
    api/                          # 백엔드 API 호출 헬퍼
      home.ts
      auth.ts
      admin.ts
    lib/
      auth.ts                     # 쿠키 토큰 헬퍼 (get/set/clear)
    middleware.ts
```

---

## 3. 파일 명명 규칙

**`view/` 안의 모든 컴포넌트는 `Page`로 끝난다.**

| 화면 유형 | 파일명 | 예시 |
|-----------|--------|------|
| 목록 / 첫 페이지 | `IndexPage.tsx` | `view/programs/IndexPage.tsx` |
| 상세 화면 | `DetailPage.tsx` | `view/programs/DetailPage.tsx` |
| 기타 | `[설명]Page.tsx` | `DashboardPage.tsx`, `EditPage.tsx` |

섹션·서브 컴포넌트(페이지 내 구역, 공통 UI 등)는 `components/` 하위에 배치한다.

---

## 4. 라우팅

| 경로 | 레이아웃 | view 컴포넌트 |
|------|----------|--------------|
| `/` | PublicLayout | `home/IndexPage` |
| `/auth/login` | 없음 | `auth/LoginPage` |
| `/admin` | AdminLayout | `admin/DashboardPage` |
| `/admin/programs` | AdminLayout | `admin/programs/IndexPage` (Phase 2) |
| `/admin/accommodations` | AdminLayout | `admin/accommodations/IndexPage` (Phase 2) |
| `/admin/reservations` | AdminLayout | `admin/reservations/IndexPage` (Phase 2) |
| `/admin/notices` | AdminLayout | `admin/notices/IndexPage` (Phase 2) |
| `/admin/gallery` | AdminLayout | `admin/gallery/IndexPage` (Phase 2) |
| `/admin/facilities` | AdminLayout | `admin/facilities/IndexPage` (Phase 2) |

---

## 5. 인증 흐름

### 로그인
1. `/auth/login` — `LoginPage` 폼: `loginId` + `password` 입력
2. `POST /api/auth/login` (Next.js Route Handler) 호출
3. Route Handler → 백엔드 `POST /auth/login` 호출
4. 응답의 `accessToken`, `refreshToken`을 **httpOnly 쿠키**에 저장
5. `/admin`으로 리다이렉트

### middleware 검증 (`/admin/**`)
1. 쿠키에서 `access_token` 추출 → JWT decode
2. `userType`이 `ADMIN` 또는 `SUPER_ADMIN`인지 확인
3. 토큰 만료 시: `refresh_token`으로 갱신 (silent refresh)
4. 실패 시: `/auth/login`으로 리다이렉트

### 로그아웃
- `POST /api/auth/logout` Route Handler에서 쿠키 삭제 → `/auth/login` 리다이렉트

### 보안 원칙
- 토큰 전부 httpOnly 쿠키 — XSS 안전
- SameSite=Lax + Route Handler 조합으로 CSRF 기본 방어
- `userType: MEMBER`는 `/admin` 접근 불가

---

## 6. 데이터 페칭 전략

### 공개 페이지 (Server Components)
- `src/api/*.ts` 헬퍼를 Server Component에서 직접 호출
- 홈 데이터: `GET /home` (ISR, 5분 revalidate)
- SEO: Next.js `metadata` API 활용

### 어드민 페이지 (Client Components + SWR)
- `src/api/*.ts` 헬퍼를 SWR fetcher로 사용
- 쿠키 자동 전송 (`credentials: 'include'`)
- CRUD 후: `mutate()`로 캐시 무효화

---

## 7. Phase 1 구현 범위

### 세팅
- `apps/web` 생성 (Next.js 15 + TypeScript + Tailwind CSS)
- pnpm workspace 등록
- shadcn/ui 초기화
- `@anduck/types`, `@anduck/api-client` 의존성 추가
- `.env.local` 설정

### 공개 사이트
- `layouts/PublicLayout.tsx`
- `components/public/Header.tsx` — 네비 + "관리자" 버튼
- `components/public/Footer.tsx`
- `view/home/IndexPage.tsx`
- `components/public/home/BannerSection.tsx`
- `components/public/home/ProgramsSection.tsx`
- `components/public/home/AccommodationsSection.tsx`
- `components/public/home/NoticesSection.tsx`

### 인증
- `view/auth/LoginPage.tsx` — loginId / password 폼
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/refresh/route.ts`
- `middleware.ts`

### 어드민
- `layouts/AdminLayout.tsx`
- `components/admin/Sidebar.tsx`
- `components/admin/StatCard.tsx`
- `view/admin/DashboardPage.tsx`
- `api/admin.ts`

---

## 8. 환경변수 (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
JWT_SECRET=your-secret-key
```

---

## 9. 의존성 (`apps/web/package.json`)

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "swr": "^2",
    "@anduck/types": "workspace:*",
    "@anduck/api-client": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^3",
    "@types/react": "^19",
    "@types/node": "^20"
  }
}
```
