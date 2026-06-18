# 인증 규칙 — JWT / Fastify

## 로그인 식별자

- 로그인은 `email` 대신 `login_id` 사용
- `login_id`: 사용자가 직접 지정하는 고유 아이디 (UNIQUE, NOT NULL)
- `email`: 연락처 용도만, 로그인에 사용하지 않음

```json
POST /auth/login   → { "loginId": "hong", "password": "..." }
POST /auth/signup  → { "loginId": "hong", "email": "hong@example.com", "password": "...", "name": "홍길동" }
```

---

## JWT Payload

```typescript
type JwtPayload = { sub: string; email: string; role: string };
// sub: user.id (string)
```

Access Token과 Refresh Token 모두 동일한 구조로 서명.  
`request.user` 타입이 `JwtPayload`이므로 `req.user.sub`으로 user ID 접근.

---

## 토큰 종류

| 종류 | 만료 | 저장 |
|------|------|------|
| Access Token | `JWT_EXPIRES_IN` (기본 15m) | 클라이언트 메모리 |
| Refresh Token | `JWT_REFRESH_EXPIRES_IN` (기본 7d) | DB `refresh_token` 테이블 |

---

## 라우트 보호 패턴

### `authenticate` — 인증 필수 (401 반환)

```typescript
// 단일 라우트
app.get("/auth/me", { preHandler: [app.authenticate] }, handler);

// 그룹 전체 (admin 라우트)
app.addHook("preHandler", app.authenticate);
```

### `optionalAuthenticate` — 인증 선택 (게스트 허용)

토큰이 있으면 `req.user` 채움, 없거나 유효하지 않으면 게스트로 통과.

```typescript
// 로그인 회원이면 user_id 연결, 게스트면 null
app.post("/reservations", { preHandler: [app.optionalAuthenticate] }, handler);
```

컨트롤러에서 userId 추출:

```typescript
async function createReservation(req: Req<{ Body: types.CreateReservationInput }>) {
  return publicService.createReservation(req.body, req.user?.sub);
}
```

서비스에서 `utils.pgId(userId)` → 없으면 `"NULL"`, 있으면 정수 문자열.

---

## JWT 서명 (컨트롤러)

```typescript
// req.server.jwt 사용 (app 클로저 불필요)
const accessToken = req.server.jwt.sign(payload, { expiresIn: config.jwtExpiresIn });
```

---

## 환경변수

```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```
