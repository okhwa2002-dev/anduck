# Security Hardening Notes

> 앞으로 보안 기능을 구현하거나 수정할 때의 규칙은 `.claude/roles/security.md`를 우선 따른다.

이 문서는 관리자 인증/세션 보안을 강화하면서 변경한 내용을 정리한다.

## 1. 서버 기준 Idle Timeout

### 목적

브라우저에서 로그아웃하지 않아도 일정 시간 동안 사용하지 않으면 세션이 종료되도록 한다.

프론트의 자동 로그아웃만으로는 우회 가능성이 있으므로, API 서버에서도 refresh token 기준으로 idle timeout을 검증한다.

### 동작 방식

- `refresh_token.last_used_at` 컬럼을 추가했다.
- refresh token 생성 시 `last_used_at`을 현재 DB 로컬 시간으로 저장한다.
- `/auth/refresh` 요청 시 `last_used_at` 기준으로 idle timeout을 검사한다.
- 기본 idle timeout은 `JWT_IDLE_TIMEOUT=30m`이다.
- idle 시간이 초과되면 해당 refresh token을 폐기하고 `401`을 반환한다.

### 변경 파일

- `anduck_schema.sql`
- `apps/api/.env`
- `apps/api/src/mapper/auth.xml`
- `apps/api/src/services/authService.ts`
- `apps/api/src/controllers/authController.ts`

### DB 변경

```sql
ALTER TABLE refresh_token
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp();

CREATE INDEX IF NOT EXISTS refresh_token_last_used_at_idx
ON refresh_token (last_used_at);
```

## 2. 관리자 화면 Idle Logout

### 목적

관리자 화면에서 일정 시간 입력이 없으면 자동으로 로그아웃한다.

### 동작 방식

- 관리자 레이아웃에 `IdleSessionGuard`를 추가했다.
- 클릭, 키보드, 마우스 이동, 스크롤, 터치 등을 활동으로 판단한다.
- 30분 동안 활동이 없으면 `/api/auth/logout`을 호출하고 로그인 화면으로 이동한다.

### 변경 파일

- `apps/web/src/components/admin/IdleSessionGuard.tsx`
- `apps/web/src/layouts/AdminLayout.tsx`
- `apps/web/src/app/api/auth/logout/route.ts`

## 3. CSRF 방어

### 목적

관리자 변경 요청과 파일 업로드 요청에 CSRF 검증을 적용한다.

현재 관리자 API는 `Authorization: Bearer` 헤더를 사용하므로 일반적인 쿠키 기반 CSRF 위험은 낮지만, 방어를 명확히 하기 위해 별도 CSRF 토큰을 검증한다.

### 동작 방식

- 로그인/토큰 갱신 시 `csrfToken`을 발급한다.
- access token payload에 `csrfToken`을 포함한다.
- 웹은 `csrf_token` 쿠키에 값을 저장한다.
- 관리자 변경 요청 `POST`, `PATCH`, `DELETE`와 파일 업로드 요청에 `X-CSRF-Token` 헤더를 자동으로 붙인다.
- API 서버는 JWT payload의 `csrfToken`과 요청 헤더의 `X-CSRF-Token`이 같은지 검증한다.
- 값이 없거나 다르면 `403`을 반환한다.

### 변경 파일

- `packages/types/src/auth.ts`
- `packages/api-client/src/client.ts`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/api/admin.ts`
- `apps/web/src/api/files.ts`
- `apps/web/src/middleware.ts`
- `apps/api/src/app.ts`
- `apps/api/src/controllers/authController.ts`
- `apps/api/src/routes/adminRoutes.ts`
- `apps/api/src/routes/filesRoutes.ts`
- `apps/api/src/schemas.ts`

## 4. 관리자 API Role Guard

### 목적

프론트 미들웨어뿐 아니라 API 서버에서도 관리자 권한을 강제한다.

기존에는 `/admin/*` API가 인증 토큰만 있으면 통과할 수 있었으므로, 서버에서 `ADMIN` 또는 `SUPER_ADMIN` 사용자인지 추가 검증한다.

### 동작 방식

- `app.authorizeAdmin` guard를 추가했다.
- JWT payload의 `userType`이 `ADMIN` 또는 `SUPER_ADMIN`일 때만 통과한다.
- 권한이 없으면 `403`을 반환한다.
- `/admin/*` 라우트 전체에 적용한다.
- 관리자 메뉴 변경 API와 파일 업로드 API에도 적용한다.

### 변경 파일

- `apps/api/src/app.ts`
- `apps/api/src/routes/adminRoutes.ts`
- `apps/api/src/routes/menuRoutes.ts`
- `apps/api/src/routes/filesRoutes.ts`

## 5. 보안 헤더

### 목적

브라우저 보안 정책을 강화하고, 클릭재킹·MIME sniffing·불필요한 브라우저 권한 사용을 제한한다.

### 적용 내용

API 응답:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

Web 응답:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 변경 파일

- `apps/api/src/utils/securityHeaders.ts`
- `apps/api/src/app.ts`
- `apps/web/next.config.ts`

## 6. 로그인 실패 횟수 제한 / 계정 잠금

### 목적

비밀번호 대입 공격을 줄이기 위해 같은 계정에서 로그인 실패가 반복되면 일정 시간 동안 로그인을 제한한다.

### 동작 방식

- `user.failed_login_count` 컬럼에 연속 로그인 실패 횟수를 저장한다.
- `user.locked_until` 컬럼에 계정 잠금 만료 일시를 저장한다.
- 로그인 실패 시 `LOGIN_MAX_FAILURES` 기준으로 실패 횟수를 누적한다.
- 실패 횟수가 기준 이상이면 `LOGIN_LOCK_DURATION` 동안 계정을 잠근다.
- 잠금 시간이 지나기 전 로그인 시도는 비밀번호 검증 전에 차단한다.
- 로그인 성공 시 실패 횟수와 잠금 일시를 초기화한다.

### 변경 파일

- `anduck_schema.sql`
- `apps/api/.env`
- `apps/api/src/mapper/auth.xml`
- `apps/api/src/services/authService.ts`

### DB 변경

```sql
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS user_locked_until_idx
ON "user" (locked_until);
```

## 7. 관리자 작업 로그

### 목적

관리자 화면에서 데이터가 변경될 때 누가, 언제, 어떤 요청을 수행했는지 추적할 수 있도록 기록한다.

### 동작 방식

- 관리자 권한 사용자의 `POST`, `PATCH`, `DELETE` 요청을 기록한다.
- 기록 대상은 `/admin/*`, `/files/*` 계열의 관리자 변경 요청이다.
- `user_id`, `user_type`, HTTP method, 요청 경로, 라우트 경로, 응답 상태 코드, IP, User-Agent, 요청 데이터를 저장한다.
- 요청 데이터는 `params`, `query`, `body`를 JSONB로 저장한다.
- 비밀번호, 토큰, CSRF 값 등 민감정보는 `[MASKED]`로 저장한다.
- 로그 저장 실패가 실제 API 응답 실패로 이어지지 않도록 `onResponse` 훅에서 예외를 로깅만 한다.

### 변경 파일

- `anduck_schema.sql`
- `apps/api/src/app.ts`
- `apps/api/src/services/auditLogService.ts`

### DB 변경

```sql
CREATE TABLE "admin_audit_log" (
  "id"              BIGSERIAL PRIMARY KEY,
  "user_id"         BIGINT,
  "user_type"       TEXT,
  "method"          TEXT NOT NULL,
  "path"            TEXT NOT NULL,
  "route_path"      TEXT,
  "status_code"     INTEGER,
  "ip_address"      TEXT,
  "user_agent"      TEXT,
  "request_payload" JSONB,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT current_kst_timestamp()
);
```

## 8. 운영/개발 적용 순서

1. DB 스키마 반영

```bash
# 이미 개발 DB에는 적용됨
# 새 환경에서는 anduck_schema.sql 기준으로 생성하거나 ALTER 문을 실행한다.
```

2. 공유 패키지 빌드

```bash
pnpm --filter @anduck/types build
pnpm --filter @anduck/api-client build
```

3. API/Web 타입 확인

```bash
pnpm --filter @anduck/api typecheck
pnpm --filter @anduck/web typecheck
```

4. 서버 재시작

- API 서버 재시작 필요
- Web 서버 재시작 필요
- 기존 로그인 세션은 새 CSRF 토큰이 없으므로 다시 로그인하는 것이 안전하다.

## 9. 현재 보안 설정값

```env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_IDLE_TIMEOUT=30m
LOGIN_MAX_FAILURES=5
LOGIN_LOCK_DURATION=30m
```

## 10. 다음 보안 강화 후보

- 관리자 작업 로그 조회 화면
