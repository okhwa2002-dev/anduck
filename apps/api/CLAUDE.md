# @anduck/api — 개발 스펙

세부 규칙은 `.claude/roles/` 참조:
- [coding.md](../../.claude/roles/coding.md) — 아키텍처 흐름, import/export, 이미지 처리, 로깅
- [database.md](../../.claude/roles/database.md) — XML 매퍼, pg 타입 변환, 스키마 컨벤션, 헬퍼
- [auth.md](../../.claude/roles/auth.md) — JWT, authenticate / optionalAuthenticate 패턴
- [security.md](../../.claude/roles/security.md) — 관리자 세션, CSRF, role guard, 보안 검증 규칙
- [types.md](../../.claude/roles/types.md) — @anduck/types 구조, 빌드 순서, 필드명 규칙
- [filter-system.md](../../.claude/roles/filter-system.md) — 멀티 필터 구조, FilterCondition, SQL 변환 패턴
- [file-upload.md](../../.claude/roles/file-upload.md) — 파일 업로드 엔드포인트, 저장 방식, 엔티티 연결 패턴
- [image-upload.md](../../.claude/roles/image-upload.md) — 공통 이미지 업로드, 대표 이미지 지정/삭제 규칙
- [excel-export.md](../../.claude/roles/excel-export.md) — 엑셀 다운로드 엔드포인트, buildExcel/sendExcelReply 유틸, 새 엔티티 추가 방법

---

## API 작업 순서

0. **규칙 확인** — `.claude/roles/` 중 관련 파일 먼저 읽기
   - `database.md` — 매퍼 문법, 스키마 컨벤션 (항상)
   - `coding.md` — 아키텍처, import/export 패턴 (항상)
   - `auth.md` — 인증이 필요한 기능
   - `security.md` — 관리자 인증/권한/CSRF/세션 관련 작업
   - `image-upload.md` — 이미지 업로드/대표 이미지 관련 작업
   - `types.md` — 공유 타입 수정이 필요한 경우
1. **`anduck_schema.sql`** — 테이블 구조, 컬럼명, 제약 확인
2. **`packages/types/src/`** — 입출력 타입 정의 (없으면 추가)
3. **`mapper/*.xml`** — SQL 작성 (파라미터 문법, camelCase 별칭, BIGINT::text)
4. **`services/*.ts`** — 비즈니스 로직, DB 호출, pgId/pgBigintArr 변환
5. **`controllers/*.ts`** — req 파싱 → service 호출
6. **`routes/*.ts`** — 경로, 타입 제네릭, preHandler, schema `$ref`
7. **`schemas.ts`** — Fastify 스키마 추가/수정
8. **빌드·검증**
   ```bash
   pnpm --filter @anduck/types build   # 타입 변경 시
   pnpm --filter @anduck/api typecheck # 항상 마지막에
   ```

---

## 스택

| 역할 | 기술 |
|------|------|
| 런타임 | Node.js 20 + TypeScript 5 |
| 프레임워크 | Fastify 5 |
| SQL 매퍼 | mybatis-mapper (XML) |
| DB 드라이버 | pg (node-postgres) |
| 인증 | @fastify/jwt + bcryptjs |
| 로깅 | pino + LogRotator (커스텀) |
| 패키지 관리 | pnpm workspace (Turborepo) |

---

## 디렉토리 구조

```
apps/api/src/
  index.ts          # 엔트리: app 생성 → 포트 리스닝
  app.ts            # Fastify 인스턴스, 플러그인, 라우트 등록
  utils/
    index.ts        # pgId, pgBigintArr, pgTextArr, pgJsonb, limitOffsetSQL, toPaged ...
    errors.ts       # AppError 클래스 + Errors 팩토리 (badRequest / notFound / conflict)
    logger.ts       # LogRotator (일 단위 파일 로테이션)
    db.ts           # pg Pool + mybatis-mapper 래퍼
    config.ts       # 환경변수 → ApiConfig
  mapper/           # MyBatis XML (namespace = 파일명)
  routes/           # 경로·preHandler·schema 등록
  controllers/      # req 파싱 → service 호출 → 반환
  services/         # 비즈니스 로직 + DB 호출
```

---

## 환경변수 (`.env`)

```env
DATABASE_URL=postgresql://anduck:anduck@localhost:5432/anduck
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
LOG_DIR=D:\workspace\ok2020\log\anduck
```

---

## 주요 명령어

```bash
# 개발 서버
pnpm --filter @anduck/api dev

# 타입체크 (types 빌드 먼저)
pnpm --filter @anduck/types build
pnpm --filter @anduck/api typecheck

# 빌드
pnpm --filter @anduck/api build
```

---

## Health Check

```
GET /health     → { ok: true, service: "@anduck/api" }
GET /health/db  → { ok: true, database: "connected" }
```
