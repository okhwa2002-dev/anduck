# Security Rules

보안 관련 기능을 만들거나 수정할 때 반드시 따르는 규칙이다.

## 인증 토큰

- Access token 기본 만료는 `JWT_EXPIRES_IN`을 따른다.
- Refresh token 기본 만료는 `JWT_REFRESH_EXPIRES_IN`을 따른다.
- Refresh token은 DB `refresh_token` 테이블에 해시로 저장한다.
- Refresh token 원문은 DB에 저장하지 않는다.
- Refresh token 생성/갱신 시 `last_used_at`을 기록한다.
- `/auth/refresh`에서는 `JWT_IDLE_TIMEOUT` 기준으로 idle timeout을 검사한다.
- idle timeout이 초과되면 refresh token을 폐기하고 `401`을 반환한다.

## 로그인 실패 제한

- 로그인 실패 횟수는 `user.failed_login_count`에 저장한다.
- 계정 잠금 만료 시각은 `user.locked_until`에 저장한다.
- 실패 제한 횟수는 `LOGIN_MAX_FAILURES`를 따른다.
- 잠금 시간은 `LOGIN_LOCK_DURATION`을 따른다.
- 잠긴 계정은 비밀번호 검증 전에 차단한다.
- 로그인 성공 시 실패 횟수와 잠금 만료 시각을 초기화한다.

## 관리자 세션

- 관리자 화면에는 idle logout guard를 적용한다.
- 기본 미사용 제한 시간은 30분이다.
- idle logout 시 `/api/auth/logout`을 호출하고 로그인 화면으로 이동한다.
- 서버 idle timeout도 함께 적용되어야 하며, 프론트 idle logout만으로 끝내지 않는다.

## 관리자 API 권한

- `/admin/*` API는 반드시 다음 순서의 guard를 적용한다.

```ts
app.authenticate
app.authorizeAdmin
app.verifyCsrf
```

- `authorizeAdmin`은 `ADMIN`, `SUPER_ADMIN`만 통과시킨다.
- 일반 `MEMBER` 토큰은 관리자 API 접근 시 `403`을 반환해야 한다.
- 프론트 미들웨어 권한 검사만 믿지 않는다. API 서버에서 반드시 재검증한다.

## 관리자 작업 로그

- 관리자 변경 요청은 `admin_audit_log`에 기록한다.
- 대상 메서드: `POST`, `PATCH`, `DELETE`
- 대상 경로: `/admin/*`, `/files/*` 등 관리자 권한으로 데이터를 변경하는 API
- 기록 항목은 사용자 ID, 사용자 유형, method, path, route path, status code, IP, User-Agent, 요청 payload를 포함한다.
- password, token, accessToken, refreshToken, csrfToken 등 민감정보는 저장 전에 마스킹한다.
- 로그 저장 실패가 원래 API 응답을 실패시키지 않도록 처리한다.
- DB 코멘트를 적용할 때 한글 깨짐을 피하기 위해 UTF-8 파일 기준으로 관리하고, 개발 DB 반영 스크립트에서는 문자열 인코딩을 검증한다.

## CSRF

- 관리자 변경 요청에는 CSRF 검증을 적용한다.
- 대상 메서드: `POST`, `PATCH`, `DELETE`
- 요청 헤더: `X-CSRF-Token`
- API는 JWT payload의 `csrfToken`과 `X-CSRF-Token`이 일치하는지 검증한다.
- 값이 없거나 다르면 `403`을 반환한다.
- 로그인/refresh 응답에는 `csrfToken`을 포함한다.
- 웹은 `csrf_token` 쿠키에 CSRF 값을 저장하고, API client에서 변경 요청 시 자동으로 헤더에 붙인다.

## 파일 업로드 보안

- 관리자 이미지 업로드 API는 `authenticate`, `authorizeAdmin`, `verifyCsrf`를 모두 적용한다.
- 허용 MIME, 파일 크기, rate limit을 적용한다.
- MIME 헤더만 믿지 않고 magic byte로 실제 이미지 형식을 검증한다.
- MIME, 확장자, 실제 이미지 형식이 서로 맞지 않으면 업로드를 거부한다.
- 업로드 파일명은 원본명을 그대로 쓰지 않고 UUID 기반 저장명을 사용한다.

## 보안 헤더

- API와 Web 응답에는 기본 보안 헤더를 적용한다 (`utils/securityHeaders.ts`).
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: cross-origin` — 정적 파일(`/uploads/`)을 다른 오리진(Web 프론트)에서 로드할 수 있도록 `cross-origin`으로 설정한다. `same-origin`으로 설정하면 브라우저가 크로스 오리진 이미지 요청을 차단한다.
- Web에는 `Content-Security-Policy`를 적용한다.
- CSP는 개발 서버에서 Next.js 동작을 위해 `unsafe-eval`을 허용할 수 있으나, production에서는 제외한다.
- 외부 이미지/연결 출처를 추가할 때는 CSP `img-src`와 `next.config.ts images.remotePatterns`를 함께 갱신한다.

## 변경 후 검증

보안 흐름 변경 후 최소한 아래를 실행한다.

```bash
pnpm --filter @anduck/types build
pnpm --filter @anduck/api-client build
pnpm --filter @anduck/api typecheck
pnpm --filter @anduck/web typecheck
```

토큰 구조가 바뀐 경우 API 서버와 Web 서버를 모두 재시작하고 다시 로그인한다.
